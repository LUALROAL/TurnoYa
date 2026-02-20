using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador de autenticación
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
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
    /// Registra un nuevo usuario
    /// </summary>
    /// <param name="dto">Datos del usuario a registrar</param>
    /// <returns>Token de autenticación y datos del usuario</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterUserDto dto)
    {
        try
        {
            var response = await _authService.RegisterAsync(dto);
            return CreatedAtAction(nameof(Register), response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error al registrar usuario: {Email}", dto.Email);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Error de registro",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al registrar usuario: {Email}", dto.Email);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error inesperado al registrar el usuario");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Inicia sesión con email y contraseña
    /// </summary>
    /// <param name="dto">Credenciales de acceso</param>
    /// <returns>Token de autenticación y datos del usuario</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var response = await _authService.LoginAsync(dto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Intento de login fallido para: {Email}", dto.Email);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "Credenciales inválidas",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al iniciar sesión: {Email}", dto.Email);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error inesperado al iniciar sesión");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Renueva el access token usando un refresh token válido
    /// </summary>
    /// <param name="dto">Token y refresh token</param>
    /// <returns>Nuevo token de autenticación</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(dto);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Intento de refresh token inválido");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "Token de renovación inválido",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al renovar token");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error inesperado al renovar el token");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Revoca todos los refresh tokens de un usuario (logout)
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <returns>Sin contenido</returns>
    [HttpPost("revoke/{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RevokeToken(string userId)
    {
        try
        {
            await _authService.RevokeTokenAsync(userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error al revocar tokens del usuario: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status400BadRequest,
                "Error al revocar token",
                ex.Message);
            return BadRequest(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al revocar tokens del usuario: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error al revocar el token");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Actualiza el rol de un usuario
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="dto">Nuevo rol del usuario</param>
    /// <returns>Usuario actualizado</returns>
    [HttpPatch("users/{userId}/role")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDto>> UpdateUserRole(string userId, [FromBody] UpdateUserRoleDto dto)
    {
        try
        {
            // Obtener el rol del usuario autenticado desde los claims del token JWT
            var requestorRole = User.Claims.FirstOrDefault(c => c.Type == "role")?.Value ?? "Customer";
            
            var updatedUser = await _authService.UpdateUserRoleAsync(userId, dto.Role, requestorRole);
            return Ok(updatedUser);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Argumento inválido al actualizar rol: {UserId}", userId);
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
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Operación no autorizada: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "Operación no autorizada",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al actualizar rol: {UserId}", userId);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "Ocurrió un error inesperado al actualizar el rol");
            return StatusCode(500, problemDetails);
        }
    }
}
