using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Admin;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;
using UpdateUserRoleAuthDto = TurnoYa.Application.DTOs.Auth.UpdateUserRoleDto;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para administración de usuarios
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
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
    /// Crea una respuesta de error estándar usando ProblemDetails
    /// </summary>
    private ProblemDetails CreateProblemDetails(int statusCode, string title, string detail)
    {
        return new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = $"https://httpstatuses.com/{statusCode}",
            Instance = HttpContext.Request.Path
        };
    }

    /// <summary>
    /// Busca y lista usuarios con filtros y paginación
    /// </summary>
    /// <param name="searchTerm">Término de búsqueda (email, nombre o apellido)</param>
    /// <param name="role">Filtrar por rol (Customer, Owner, Admin)</param>
    /// <param name="page">Número de página (base 1)</param>
    /// <param name="pageSize">Cantidad de elementos por página</param>
    /// <returns>Lista paginada de usuarios</returns>
    [HttpGet("users")]
    [ProducesResponseType(typeof(PagedUsersResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<PagedUsersResponseDto>> SearchUsers(
        [FromQuery] string? searchTerm,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

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
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Parámetros inválidos al buscar usuarios");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Parámetros inválidos",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al buscar usuarios");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al buscar usuarios");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Obtiene los detalles de un usuario específico
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <returns>Información del usuario</returns>
    [HttpGet("users/{userId}")]
    [ProducesResponseType(typeof(UserManageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserManageDto>> GetUser(string userId)
    {
        try
        {
            var user = await _adminService.GetUserAsync(userId);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Argumento inválido al obtener usuario: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Argumento inválido",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Usuario no encontrado: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status404NotFound,
                "Usuario no encontrado",
                ex.Message);
            return NotFound(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener usuario: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al obtener el usuario");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Actualiza el estado de un usuario (bloqueado/desbloqueado)
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="updateStatusDto">Datos de actualización de estado</param>
    /// <returns>Usuario actualizado</returns>
    [HttpPatch("users/{userId}/status")]
    [ProducesResponseType(typeof(UserManageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserManageDto>> UpdateUserStatus(string userId, [FromBody] UpdateUserStatusDto updateStatusDto)
    {
        try
        {
            if (updateStatusDto == null)
            {
                throw new ArgumentException("Los datos de actualización no pueden estar vacíos");
            }

            var user = await _adminService.UpdateUserStatusAsync(userId, updateStatusDto);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Datos inválidos al actualizar estado: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Datos inválidos",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Usuario no encontrado: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status404NotFound,
                "Usuario no encontrado",
                ex.Message);
            return NotFound(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar estado del usuario: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al actualizar el estado del usuario");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Actualiza el rol de un usuario
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="updateRoleDto">Nuevo rol</param>
    /// <returns>Usuario actualizado</returns>
    [HttpPatch("users/{userId}/role")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDto>> UpdateUserRole(string userId, [FromBody] UpdateUserRoleAuthDto updateRoleDto)
    {
        try
        {
            if (updateRoleDto == null || string.IsNullOrWhiteSpace(updateRoleDto.Role))
            {
                throw new ArgumentException("El rol es requerido");
            }

            var user = await _adminService.UpdateUserRoleAsync(userId, updateRoleDto.Role);
            return Ok(user);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Datos inválidos al actualizar rol: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Datos inválidos",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Usuario no encontrado: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status404NotFound,
                "Usuario no encontrado",
                ex.Message);
            return NotFound(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar rol del usuario: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al actualizar el rol del usuario");
            return StatusCode(500, problemDetails);
        }
    }
}
