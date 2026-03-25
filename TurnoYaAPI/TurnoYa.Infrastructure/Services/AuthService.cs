using AutoMapper;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
    private readonly IPushNotificationService _pushNotificationService;
    private readonly IConfiguration _configuration;

    public AuthService(
        ApplicationDbContext context,
        ITokenService tokenService,
        IMapper mapper,
        IPasswordHasher<User> passwordHasher,
        IPushNotificationService pushNotificationService,
        IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
        _mapper = mapper;
        _passwordHasher = passwordHasher;
        _pushNotificationService = pushNotificationService;
        _configuration = configuration;
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
            TotalNoShows = 0,
            TermsAcceptedAt = registerDto.TermsAcceptedAt
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
            .Include(u => u.OwnedBusinesses)
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
        var user = await _context.Users
            .Include(u => u.OwnedBusinesses)
            .FirstOrDefaultAsync(u => u.Id == userId);
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

        // Eliminar tokens de dispositivo push del usuario (logout completo)
        _ = Task.Run(async () =>
        {
            try
            {
                await _pushNotificationService.DeleteUserTokensAsync(userGuid);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al eliminar tokens push del usuario: {ex.Message}");
            }
        });
    }

    public async Task<UserDto> UpdateUserRoleAsync(string userId, string newRole, string requestorRole)
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new ArgumentException("ID de usuario inválido");
        }

        // Validar que el rol sea válido
        var validRoles = new[] { "Customer", "OwnerBusiness", "Employee", "Admin" };
        if (!validRoles.Contains(newRole))
        {
            throw new ArgumentException("Rol inválido. Debe ser: Customer, OwnerBusiness, Employee o Admin");
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

        // Para usuarios normales, solo permitir cambio entre Customer y OwnerBusiness
        if ((user.Role == "Customer" || user.Role == "OwnerBusiness") &&
            (newRole == "Customer" || newRole == "OwnerBusiness"))
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

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto googleLoginDto)
    {
        // Validar el token de Google
        var googleClientId = _configuration["Google:ClientId"] 
            ?? throw new InvalidOperationException("Google Client ID no configurado");

        GoogleJsonWebSignature.Payload? payload;
        try
        {
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { googleClientId }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(googleLoginDto.IdToken, validationSettings);
        }
        catch (Exception ex)
        {
            throw new UnauthorizedAccessException($"Token de Google inválido: {ex.Message}");
        }

        if (string.IsNullOrEmpty(payload.Email))
        {
            throw new UnauthorizedAccessException("El token de Google no contiene email");
        }

        // Buscar usuario por Google ID o por email
        var user = await _context.Users
            .Include(u => u.OwnedBusinesses)
            .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject || u.Email.ToLower() == payload.Email.ToLower());

        if (user == null)
        {
            // Registrar nuevo usuario con Google
            user = new User
            {
                Email = payload.Email.ToLower(),
                FirstName = !string.IsNullOrEmpty(googleLoginDto.GivenName) 
                    ? googleLoginDto.GivenName 
                    : (payload.Name?.Split(' ').FirstOrDefault() ?? "Usuario"),
                LastName = !string.IsNullOrEmpty(googleLoginDto.FamilyName) 
                    ? googleLoginDto.FamilyName 
                    : (payload.Name?.Split(' ').Skip(1).FirstOrDefault() ?? ""),
                GoogleId = payload.Subject,
                GooglePhotoUrl = !string.IsNullOrEmpty(googleLoginDto.ImageUrl) 
                    ? googleLoginDto.ImageUrl 
                    : payload.Picture,
                Role = "Customer",
                IsEmailVerified = true, // Google verifica el email
                IsActive = true,
                AverageRating = 0,
                TotalNoShows = 0,
                PasswordHash = _passwordHasher.HashPassword(new User(), Guid.NewGuid().ToString()), // Password aleatorio
                TermsAcceptedAt = googleLoginDto.TermsAcceptedAt
            };

            _context.Users.Add(user);
        }
        else
        {
            // Actualizar datos de Google si el usuario existe pero no tiene Google vinculado
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = payload.Subject;
                if (!string.IsNullOrEmpty(googleLoginDto.ImageUrl))
                {
                    user.GooglePhotoUrl = googleLoginDto.ImageUrl;
                }
                else if (!string.IsNullOrEmpty(payload.Picture))
                {
                    user.GooglePhotoUrl = payload.Picture;
                }
            }
        }

        user.LastLogin = DateTime.UtcNow;
        await _context.SaveChangesAsync();

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
            ExpiresIn = 86400,
            User = userDto
        };
    }

    public async Task LinkGoogleAccountAsync(string userId, LinkGoogleDto linkGoogleDto)
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new ArgumentException("ID de usuario inválido");
        }

        // Validar el token de Google
        var googleClientId = _configuration["Google:ClientId"] 
            ?? throw new InvalidOperationException("Google Client ID no configurado");

        GoogleJsonWebSignature.Payload? payload;
        try
        {
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { googleClientId }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(linkGoogleDto.IdToken, validationSettings);
        }
        catch (Exception ex)
        {
            throw new UnauthorizedAccessException($"Token de Google inválido: {ex.Message}");
        }

        if (string.IsNullOrEmpty(payload.Email))
        {
            throw new UnauthorizedAccessException("El token de Google no contiene email");
        }

        // Buscar el usuario actual
        var user = await _context.Users.FindAsync(userGuid);
        if (user == null)
        {
            throw new InvalidOperationException("Usuario no encontrado");
        }

        // Verificar si otro usuario ya tiene vinculado este Google ID
        var existingGoogleUser = await _context.Users
            .FirstOrDefaultAsync(u => u.GoogleId == payload.Subject && u.Id != userGuid);

        if (existingGoogleUser != null)
        {
            throw new InvalidOperationException("Esta cuenta de Google ya está vinculada a otro usuario");
        }

        // Verificar si el email de Google coincide con el email del usuario
        if (user.Email.ToLower() != payload.Email.ToLower())
        {
            throw new InvalidOperationException("El email de la cuenta de Google debe coincidir con el email de tu cuenta");
        }

        // Vincular la cuenta de Google
        user.GoogleId = payload.Subject;
        if (!string.IsNullOrEmpty(payload.Picture))
        {
            user.GooglePhotoUrl = payload.Picture;
        }

        await _context.SaveChangesAsync();
    }
}
