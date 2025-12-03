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
    /// Registra un nuevo usuario
    /// </summary>
    /// <param name="dto">Datos del usuario a registrar</param>
    /// <returns>Token de autenticación y datos del usuario</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al registrar usuario: {Email}", dto.Email);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Inicia sesión con email y contraseña
    /// </summary>
    /// <param name="dto">Credenciales de acceso</param>
    /// <returns>Token de autenticación y datos del usuario</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al iniciar sesión: {Email}", dto.Email);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Renueva el access token usando un refresh token válido
    /// </summary>
    /// <param name="dto">Token y refresh token</param>
    /// <returns>Nuevo token de autenticación</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al renovar token");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Revoca todos los refresh tokens de un usuario (logout)
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <returns>Sin contenido</returns>
    [HttpPost("revoke/{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RevokeToken(string userId)
    {
        try
        {
            await _authService.RevokeTokenAsync(userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al revocar tokens del usuario: {UserId}", userId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Actualiza el rol de un usuario
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="dto">Nuevo rol del usuario</param>
    /// <returns>Usuario actualizado</returns>
    [HttpPatch("users/{userId}/role")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUserRole(string userId, [FromBody] UpdateUserRoleDto dto)
    {
        try
        {
            var updatedUser = await _authService.UpdateUserRoleAsync(userId, dto.Role);
            return Ok(updatedUser);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Argumento inválido al actualizar rol: {UserId}", userId);
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Usuario no encontrado: {UserId}", userId);
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Operación no autorizada: {UserId}", userId);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado al actualizar rol: {UserId}", userId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
