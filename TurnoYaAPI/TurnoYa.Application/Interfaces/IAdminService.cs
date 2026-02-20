using TurnoYa.Application.DTOs.Admin;
using TurnoYa.Application.DTOs.Auth;

namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Servicio de administración para gestión de usuarios
/// </summary>
public interface IAdminService
{
    /// <summary>
    /// Busca usuarios con filtros y paginación
    /// </summary>
    /// <param name="searchDto">Parámetros de búsqueda</param>
    /// <returns>Lista paginada de usuarios</returns>
    Task<PagedUsersResponseDto> SearchUsersAsync(SearchUsersDto searchDto);

    /// <summary>
    /// Obtiene los detalles de un usuario específico
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <returns>Información del usuario</returns>
    Task<UserManageDto> GetUserAsync(string userId);

    /// <summary>
    /// Actualiza el estado de un usuario (bloqueado/desbloqueado)
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="updateStatusDto">Datos de actualización de estado</param>
    /// <returns>Usuario actualizado</returns>
    Task<UserManageDto> UpdateUserStatusAsync(string userId, UpdateUserStatusDto updateStatusDto);

    /// <summary>
    /// Actualiza el rol de un usuario
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="newRole">Nuevo rol</param>
    /// <returns>Usuario actualizado</returns>
    Task<UserDto> UpdateUserRoleAsync(string userId, string newRole);
}
