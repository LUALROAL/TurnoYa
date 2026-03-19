using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces;

/// <summary>
/// Repository para gestionar tokens de dispositivo FCM de usuarios.
/// </summary>
public interface IUserDeviceTokenRepository
{
    /// <summary>
    /// Obtiene un token por su valor FCM.
    /// </summary>
    Task<UserDeviceToken?> GetByTokenAsync(string token);

    /// <summary>
    /// Agrega un nuevo token de dispositivo. No debe duplicar (UserId, Token) — uniqueness
    /// se valida en la capa de aplicación usando GetByTokenAsync + upsert idempotente.
    /// </summary>
    Task<UserDeviceToken> AddAsync(UserDeviceToken entity);

    /// <summary>
    /// Obtiene todos los tokens activos de un usuario.
    /// </summary>
    Task<IEnumerable<UserDeviceToken>> GetByUserIdAsync(Guid userId);

    /// <summary>
    /// Elimina un token por su Id.
    /// </summary>
    Task DeleteAsync(Guid id);

    /// <summary>
    /// Elimina todos los tokens de un usuario (ej: logout completo).
    /// </summary>
    Task DeleteByUserIdAsync(Guid userId);
}
