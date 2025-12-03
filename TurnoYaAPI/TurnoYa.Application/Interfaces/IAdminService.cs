using TurnoYa.Application.DTOs.Admin;

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
}
