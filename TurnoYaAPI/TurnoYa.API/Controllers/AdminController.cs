using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Admin;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador de administración
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IAdminService adminService, ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    /// <summary>
    /// Busca usuarios con filtros y paginación
    /// </summary>
    /// <param name="searchTerm">Texto de búsqueda (email, nombre, apellido)</param>
    /// <param name="role">Filtrar por rol específico</param>
    /// <param name="page">Número de página (base 1)</param>
    /// <param name="pageSize">Cantidad de elementos por página</param>
    /// <returns>Lista paginada de usuarios</returns>
    [HttpGet("users")]
    [ProducesResponseType(typeof(PagedUsersResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedUsersResponseDto>> SearchUsers(
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? role = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            if (page < 1)
            {
                return BadRequest(new { message = "El número de página debe ser mayor o igual a 1" });
            }

            if (pageSize < 1 || pageSize > 100)
            {
                return BadRequest(new { message = "El tamaño de página debe estar entre 1 y 100" });
            }

            var searchDto = new SearchUsersDto
            {
                SearchTerm = searchTerm,
                Role = role,
                Page = page,
                PageSize = pageSize
            };

            var result = await _adminService.SearchUsersAsync(searchDto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al buscar usuarios");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
