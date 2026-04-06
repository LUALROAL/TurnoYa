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

    /// <summary>
    /// Genera un código único para vincular Telegram
    /// </summary>
    Task<string> GenerateTelegramLinkingCodeAsync(string userId);

    /// <summary>
    /// Valida que el código de vinculación no haya expirado
    /// </summary>
    /// <param name="code">Código de vinculación</param>
    /// <returns>True si el código es válido y no ha expirado</returns>
    Task<bool> ValidateLinkingCodeAsync(string code);

    /// <summary>
    /// Limpia códigos de vinculación expirados (mayores a 24 horas)
    /// </summary>
    /// <returns>Número de códigos eliminados</returns>
    Task<int> CleanupExpiredLinkingCodesAsync();

    /// <summary>
    /// Importa la foto de Google y la guarda en PhotoData del usuario
    /// </summary>
    /// <param name="userId">ID del usuario autenticado</param>
    /// <param name="googlePhotoUrl">URL de la foto de Google</param>
    /// <returns>Perfil actualizado con la nueva foto</returns>
    Task<UserProfileDto> ImportGooglePhotoAsync(string userId, string googlePhotoUrl);
}
