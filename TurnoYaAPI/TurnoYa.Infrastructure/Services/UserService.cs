using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;

namespace TurnoYa.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUserRepository userRepository,
            IMapper mapper,
            IPasswordHasher<User> passwordHasher,
            ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _mapper = mapper;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        public async Task<UserProfileDto> GetUserProfileAsync(string userId)
        {
            var user = await _userRepository.GetByIdAsync(new Guid(userId))
                ?? throw new InvalidOperationException("Usuario no encontrado");

            return _mapper.Map<UserProfileDto>(user);
        }

        public async Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto updateDto, byte[]? photoData = null)
        {
            var user = await _userRepository.GetByIdAsync(new Guid(userId))
                ?? throw new InvalidOperationException("Usuario no encontrado");

            // Actualizar campos
            if (!string.IsNullOrWhiteSpace(updateDto.FirstName))
                user.FirstName = updateDto.FirstName.Trim();

            if (!string.IsNullOrWhiteSpace(updateDto.LastName))
                user.LastName = updateDto.LastName.Trim();

            if (!string.IsNullOrWhiteSpace(updateDto.PhoneNumber))
                user.PhoneNumber = updateDto.PhoneNumber.Trim();

            if (!string.IsNullOrWhiteSpace(updateDto.Phone))
                user.Phone = updateDto.Phone.Trim();

            if (!string.IsNullOrWhiteSpace(updateDto.PhotoUrl))
                user.PhotoUrl = updateDto.PhotoUrl.Trim();

            if (updateDto.DateOfBirth.HasValue)
                user.DateOfBirth = updateDto.DateOfBirth;

            if (!string.IsNullOrWhiteSpace(updateDto.Gender))
                user.Gender = updateDto.Gender.Trim();

            // Foto nueva
            if (photoData != null)
            {
                user.PhotoData = photoData;
                // Opcional: limpiar URL anterior si se quiere priorizar la imagen en BD
                // user.PhotoUrl = null;
            }

            await _userRepository.UpdateAsync(user);

            return _mapper.Map<UserProfileDto>(user);
        }

        public async Task ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
        {
            // Validar que las contraseñas coincidan
            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
                throw new ArgumentException("Las contraseñas nuevas no coinciden");

            // Validar longitud mínima
            if (string.IsNullOrWhiteSpace(changePasswordDto.CurrentPassword))
                throw new ArgumentException("La contraseña actual es requerida");

            if (changePasswordDto.NewPassword.Length < 8)
                throw new ArgumentException("La contraseña nueva debe tener al menos 8 caracteres");

            var user = await _userRepository.GetByIdAsync(new Guid(userId))
                ?? throw new InvalidOperationException("Usuario no encontrado");

            // Verificar contraseña actual
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
                await _userRepository.UpdateAsync(user);
                _logger.LogInformation("Contraseña cambiada correctamente para usuario: {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cambiar contraseña de usuario: {UserId}", userId);
                throw new InvalidOperationException("Error al cambiar la contraseña", ex);
            }
        }
    }
}