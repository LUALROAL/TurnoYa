using TurnoYa.Application.DTOs.Auth;

namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Servicio para gestión de perfiles de usuario
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Obtiene el perfil completo del usuario actual
    /// </summary>
    /// <param name="userId">ID del usuario autenticado</param>
    /// <returns>Información completa del perfil</returns>
    Task<UserProfileDto> GetUserProfileAsync(string userId);

    /// <summary>
    /// Actualiza la información del perfil del usuario
    /// </summary>
    /// <param name="userId">ID del usuario autenticado</param>
    /// <param name="updateDto">Datos a actualizar</param>
    /// <returns>Perfil actualizado</returns>
    //Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto updateDto);
    Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateUserProfileDto updateDto, byte[]? photoData = null);

    /// <summary>
    /// Cambia la contraseña del usuario
    /// </summary>
    /// <param name="userId">ID del usuario autenticado</param>
    /// <param name="changePasswordDto">Contraseña actual y nueva</param>
    Task ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
}
