using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Servicio de autenticación para registro, login y gestión de tokens
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registra un nuevo usuario en el sistema
    /// </summary>
    /// <param name="registerDto">Datos de registro del usuario</param>
    /// <returns>Respuesta con token de autenticación y datos del usuario</returns>
    Task<AuthResponseDto> RegisterAsync(RegisterUserDto registerDto);

    /// <summary>
    /// Autentica un usuario existente
    /// </summary>
    /// <param name="loginDto">Credenciales de acceso</param>
    /// <returns>Respuesta con token de autenticación y datos del usuario</returns>
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);

    /// <summary>
    /// Renueva el token de acceso usando un refresh token
    /// </summary>
    /// <param name="refreshTokenDto">Token actual y refresh token</param>
    /// <returns>Nueva respuesta con tokens renovados</returns>
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto refreshTokenDto);

    /// <summary>
    /// Revoca el refresh token de un usuario (logout)
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    Task RevokeTokenAsync(string userId);

    /// <summary>
    /// Actualiza el rol de un usuario
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="newRole">Nuevo rol del usuario</param>
    /// <param name="requestorRole">Rol del usuario que solicita el cambio</param>
    /// <returns>Usuario actualizado</returns>
    Task<UserDto> UpdateUserRoleAsync(string userId, string newRole, string requestorRole);

    /// <summary>
    /// Autentica o registra un usuario mediante Google Sign-In
    /// </summary>
    /// <param name="googleLoginDto">Token de Google y datos del usuario</param>
    /// <returns>Respuesta con token de autenticación y datos del usuario</returns>
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto googleLoginDto);

    /// <summary>
    /// Vincula una cuenta de Google a un usuario existente autenticado
    /// </summary>
    /// <param name="userId">ID del usuario actual</param>
    /// <param name="linkGoogleDto">Token de Google para vincular</param>
    Task LinkGoogleAccountAsync(string userId, LinkGoogleDto linkGoogleDto);
}
