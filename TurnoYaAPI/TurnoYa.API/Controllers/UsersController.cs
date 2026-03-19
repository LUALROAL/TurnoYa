using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de perfiles de usuario
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;
    private readonly IConfiguration _configuration;

    public UsersController(IUserService userService, ILogger<UsersController> logger, IConfiguration configuration)
    {
        _userService = userService;
        _logger = logger;
        _configuration = configuration;
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
    /// Obtiene el ID del usuario autenticado desde los claims del JWT
    /// </summary>
    private string GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("nameid")
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("No se encontró el claim de userId en el token");
            throw new UnauthorizedAccessException("Usuario no autenticado");
        }
        // Validar formato GUID
        if (!Guid.TryParse(userId, out var guid))
        {
            _logger.LogError("El userId extraído del token no es un GUID válido: {UserId}", userId);
            throw new InvalidOperationException($"El userId del token no es un GUID válido: {userId}");
        }
        return userId;
    }

    /// <summary>
    /// Obtiene el perfil completo del usuario autenticado
    /// </summary>
    /// <returns>Información completa del perfil</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        try
        {
            var userId = GetUserId();
            var profile = await _userService.GetUserProfileAsync(userId);
            return Ok(profile);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Usuario no autenticado");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "No autorizado",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Perfil de usuario no encontrado");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status404NotFound,
                "Perfil no encontrado",
                ex.Message);
            return NotFound(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener perfil de usuario");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al obtener el perfil");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Actualiza la información del perfil del usuario autenticado
    /// </summary>
    /// <param name="updateDto">Datos a actualizar</param>
    /// <returns>Perfil actualizado</returns>
    [HttpPut("me")]
    [Consumes("multipart/form-data")] // 👈 IMPORTANTE
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile(
    [FromForm] UpdateUserProfileDto updateDto,
    IFormFile? photo) // 👈 Parámetro para la imagen
    {
        try
        {
            var userId = GetUserId();
            byte[]? photoData = null;
            if (photo != null)
            {
                using var ms = new MemoryStream();
                await photo.CopyToAsync(ms);
                photoData = ms.ToArray();
            }
            var updatedProfile = await _userService.UpdateUserProfileAsync(userId, updateDto, photoData);
            return Ok(updatedProfile);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Usuario no autenticado");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "No autorizado",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error al actualizar perfil: {Message}", ex.Message);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status404NotFound,
                "Perfil no encontrado",
                ex.Message);
            return NotFound(problemDetails);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Datos inválidos al actualizar perfil: {Message}", ex.Message);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Datos inválidos",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar perfil de usuario");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al actualizar el perfil");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Cambia la contraseña del usuario autenticado
    /// </summary>
    /// <param name="changePasswordDto">Contraseña actual y nueva</param>
    /// <returns>Sin contenido</returns>
    [HttpPatch("me/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            var userId = GetUserId();
            await _userService.ChangePasswordAsync(userId, changePasswordDto);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Usuario no autenticado");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "No autorizado",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Contraseña actual inválida");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status422UnprocessableEntity,
                "Contraseña actual inválida",
                ex.Message);
            return UnprocessableEntity(problemDetails);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error al cambiar contraseña");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Error al cambiar contraseña",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al cambiar contraseña");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al cambiar la contraseña");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Genera el código para vincular la cuenta con Telegram
    /// </summary>
    [HttpPost("telegram-link")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateTelegramLink()
    {
        try
        {
            var userId = GetUserId();
            var code = await _userService.GenerateTelegramLinkingCodeAsync(userId);
            
            // Obtener el nombre del bot desde config
            var botUsername = _configuration["Telegram:BotUsername"] ?? "TurnoYaBot";
            
            return Ok(new { 
                code = code,
                instructions = $"Para vincular tu cuenta de Telegram:\n\n1. Abre Telegram\n2. Busca @{botUsername}\n3. Envía el siguiente comando:\n/start {code}",
                telegramCommand = $"/start {code}"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al generar código de Telegram");
            return StatusCode(500, CreateProblemDetails(500, "Error del servidor", "No se pudo generar el código de vinculación."));
        }
    }
}
