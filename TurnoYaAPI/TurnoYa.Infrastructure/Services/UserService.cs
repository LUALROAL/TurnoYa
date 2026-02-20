using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de gestión de perfiles de usuario
/// </summary>
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly ILogger<UserService> _logger;

    public UserService(
        ApplicationDbContext context,
        IMapper mapper,
        IPasswordHasher<User> passwordHasher,
        ILogger<UserService> logger)
    {
        _context = context;
        _mapper = mapper;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<UserProfileDto> GetUserProfileAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuario no autenticado");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == new Guid(userId));

        if (user == null)
        {
            throw new InvalidOperationException("Usuario no encontrado");
        }

        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto updateDto)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuario no autenticado");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == new Guid(userId));

        if (user == null)
        {
            throw new InvalidOperationException("Usuario no encontrado");
        }

        // Actualizar solo los campos proporcionados
        if (!string.IsNullOrWhiteSpace(updateDto.FirstName))
        {
            user.FirstName = updateDto.FirstName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(updateDto.LastName))
        {
            user.LastName = updateDto.LastName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(updateDto.PhoneNumber))
        {
            user.PhoneNumber = updateDto.PhoneNumber.Trim();
        }

        if (!string.IsNullOrWhiteSpace(updateDto.Phone))
        {
            user.Phone = updateDto.Phone.Trim();
        }

        if (!string.IsNullOrWhiteSpace(updateDto.PhotoUrl))
        {
            user.PhotoUrl = updateDto.PhotoUrl.Trim();
        }

        if (updateDto.DateOfBirth.HasValue)
        {
            user.DateOfBirth = updateDto.DateOfBirth;
        }

        if (!string.IsNullOrWhiteSpace(updateDto.Gender))
        {
            user.Gender = updateDto.Gender.Trim();
        }

        try
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Perfil actualizado para usuario: {UserId}", userId);
            
            return _mapper.Map<UserProfileDto>(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar perfil de usuario: {UserId}", userId);
            throw new InvalidOperationException("Error al actualizar el perfil", ex);
        }
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuario no autenticado");
        }

        // Validar que las contraseñas coincidan
        if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
        {
            throw new ArgumentException("Las contraseñas nuevas no coinciden");
        }

        // Validar longitud mínima
        if (string.IsNullOrWhiteSpace(changePasswordDto.CurrentPassword))
        {
            throw new ArgumentException("La contraseña actual es requerida");
        }

        if (changePasswordDto.NewPassword.Length < 8)
        {
            throw new ArgumentException("La contraseña nueva debe tener al menos 8 caracteres");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == new Guid(userId));

        if (user == null)
        {
            throw new InvalidOperationException("Usuario no encontrado");
        }

        // Verificar que la contraseña actual sea correcta
        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, changePasswordDto.CurrentPassword);

        if (result == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Intento fallido de cambio de contraseña para usuario: {UserId}", userId);
            throw new ArgumentException("La contraseña actual es incorrecta");
        }

        // Actualizar contraseña
        user.PasswordHash = _passwordHasher.HashPassword(user, changePasswordDto.NewPassword);

        try
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Contraseña cambiada para usuario: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cambiar contraseña de usuario: {UserId}", userId);
            throw new InvalidOperationException("Error al cambiar la contraseña", ex);
        }
    }
}
