using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de autenticación
/// </summary>
public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(
        ApplicationDbContext context,
        ITokenService tokenService,
        IMapper mapper,
        IPasswordHasher<User> passwordHasher)
    {
        _context = context;
        _tokenService = tokenService;
        _mapper = mapper;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterUserDto registerDto)
    {
        // Verificar si el email ya existe
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == registerDto.Email.ToLower());

        if (existingUser != null)
        {
            throw new InvalidOperationException("El email ya está registrado");
        }

        // Crear nuevo usuario
        var initialRole = string.IsNullOrWhiteSpace(registerDto.Role) ? "Customer" : registerDto.Role;
        var user = new User
        {
            Email = registerDto.Email.ToLower(),
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            Phone = registerDto.Phone,
            Role = initialRole,
            IsEmailVerified = false,
            IsActive = true,
            AverageRating = 0,
            TotalNoShows = 0
        };

        // Hash de la contraseña
        user.PasswordHash = _passwordHasher.HashPassword(user, registerDto.Password);

        // Guardar usuario
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generar tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Guardar refresh token
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        // Preparar respuesta
        var userDto = _mapper.Map<UserDto>(user);
        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 86400, // 24 horas en segundos
            User = userDto
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        // Buscar usuario por email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == loginDto.Email.ToLower());

        if (user == null)
        {
            throw new UnauthorizedAccessException("Credenciales inválidas");
        }

        // Verificar contraseña
        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, loginDto.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedAccessException("Credenciales inválidas");
        }

        // Verificar si el usuario está activo
        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Usuario inactivo");
        }

        // Generar tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Revocar tokens anteriores y crear uno nuevo
        var oldTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var oldToken in oldTokens)
        {
            oldToken.RevokedAt = DateTime.UtcNow;
        }

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        // Preparar respuesta
        var userDto = _mapper.Map<UserDto>(user);
        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 86400, // 24 horas en segundos
            User = userDto
        };
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto refreshTokenDto)
    {
        // Validar access token expirado
        var principal = _tokenService.GetPrincipalFromExpiredToken(refreshTokenDto.Token);
        if (principal == null)
        {
            throw new UnauthorizedAccessException("Token inválido");
        }

        var userIdClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Token inválido");
        }

        // Buscar usuario
        var user = await _context.Users.FindAsync(userId);
        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Usuario no encontrado o inactivo");
        }

        // Validar refresh token
        var storedRefreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => 
                rt.UserId == userId && 
                rt.Token == refreshTokenDto.RefreshToken &&
                rt.RevokedAt == null &&
                rt.ExpiresAt > DateTime.UtcNow);

        if (storedRefreshToken == null)
        {
            throw new UnauthorizedAccessException("Refresh token inválido o expirado");
        }

        // Revocar el refresh token usado
        storedRefreshToken.RevokedAt = DateTime.UtcNow;

        // Generar nuevos tokens
        var newAccessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        var newRefreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync();

        // Preparar respuesta
        var userDto = _mapper.Map<UserDto>(user);
        return new AuthResponseDto
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresIn = 86400,
            User = userDto
        };
    }

    public async Task RevokeTokenAsync(string userId)
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new ArgumentException("ID de usuario inválido");
        }

        var refreshTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userGuid && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in refreshTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<UserDto> UpdateUserRoleAsync(string userId, string newRole, string requestorRole)
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new ArgumentException("ID de usuario inválido");
        }

        // Validar que el rol sea válido
        var validRoles = new[] { "Customer", "BusinessOwner", "Employee", "Admin" };
        if (!validRoles.Contains(newRole))
        {
            throw new ArgumentException("Rol inválido. Debe ser: Customer, BusinessOwner, Employee o Admin");
        }

        // Buscar usuario
        var user = await _context.Users.FindAsync(userGuid);
        if (user == null)
        {
            throw new InvalidOperationException("Usuario no encontrado");
        }

        // Si el solicitante es Admin, puede cambiar cualquier rol
        if (requestorRole == "Admin")
        {
            user.Role = newRole;
            await _context.SaveChangesAsync();
            return _mapper.Map<UserDto>(user);
        }

        // Para usuarios normales, solo permitir cambio entre Customer y BusinessOwner
        if ((user.Role == "Customer" || user.Role == "BusinessOwner") &&
            (newRole == "Customer" || newRole == "BusinessOwner"))
        {
            user.Role = newRole;
            await _context.SaveChangesAsync();
            return _mapper.Map<UserDto>(user);
        }
        else
        {
            throw new UnauthorizedAccessException("Solo se permite cambiar entre Cliente y Dueño de Negocio");
        }
    }
}
