using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using TurnoYa.Application.DTOs.Device;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de tokens de dispositivo FCM para notificaciones push.
/// </summary>
[ApiController]
[Route("devices")]
[Authorize]
public class DevicesController : ControllerBase
{
    private readonly IUserDeviceTokenRepository _deviceTokenRepository;
    private readonly ILogger<DevicesController> _logger;
    private const int MaxDevicesPerUser = 5;

    public DevicesController(
        IUserDeviceTokenRepository deviceTokenRepository,
        ILogger<DevicesController> logger)
    {
        _deviceTokenRepository = deviceTokenRepository;
        _logger = logger;
    }

    /// <summary>
    /// Crea una respuesta de error estándar usando ProblemDetails.
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
    /// Obtiene el ID del usuario autenticado desde los claims del JWT.
    /// </summary>
    private Guid GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("nameid")
            ?? User.FindFirstValue("sub");
            
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Usuario no autenticado");
        }
        
        if (!Guid.TryParse(userId, out var guid))
        {
            throw new InvalidOperationException($"El userId del token no es un GUID válido: {userId}");
        }
        
        return guid;
    }

    /// <summary>
    /// Registra un token de dispositivo FCM para el usuario autenticado.
    /// Operación idempotente: si el token ya existe, retorna 200 con el deviceId existente.
    /// </summary>
    /// <param name="dto">Token y plataforma del dispositivo.</param>
    /// <returns>DeviceId del registro creado o existente.</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(DeviceRegistrationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DeviceRegistrationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceDto dto)
    {
        try
        {
            var userId = GetUserId();
            
            // Validar plataforma
            var platform = dto.Platform?.ToLowerInvariant();
            if (platform != "android" && platform != "ios")
            {
                var problemDetails = CreateProblemDetails(
                    StatusCodes.Status400BadRequest,
                    "Plataforma inválida",
                    "La plataforma debe ser 'android' o 'ios'.");
                return BadRequest(problemDetails);
            }
            
            // Validar que el token no esté vacío
            if (string.IsNullOrWhiteSpace(dto.Token))
            {
                var problemDetails = CreateProblemDetails(
                    StatusCodes.Status400BadRequest,
                    "Token requerido",
                    "El token FCM es requerido.");
                return BadRequest(problemDetails);
            }
            
            // Verificar si el token ya existe (idempotencia)
            var existingToken = await _deviceTokenRepository.GetByTokenAsync(dto.Token);
            if (existingToken != null)
            {
                // Si el token ya existe pero pertenece a OTRO usuario, es un conflicto
                if (existingToken.UserId != userId)
                {
                    var problemDetails = CreateProblemDetails(
                        StatusCodes.Status422UnprocessableEntity,
                        "Token en uso",
                        "Este token ya está registrado por otro usuario.");
                    return UnprocessableEntity(problemDetails);
                }
                
                // Token ya existe para este usuario — retorno idempotente
                _logger.LogInformation("Token FCM ya registrado para usuario {UserId}. DeviceId: {DeviceId}", 
                    userId, existingToken.Id);
                return Ok(new DeviceRegistrationResponse(existingToken.Id, IsExisting: true));
            }
            
            // Verificar límite de dispositivos por usuario
            var userDevices = await _deviceTokenRepository.GetByUserIdAsync(userId);
            if (userDevices.Count() >= MaxDevicesPerUser)
            {
                var problemDetails = CreateProblemDetails(
                    StatusCodes.Status422UnprocessableEntity,
                    "Límite de dispositivos alcanzado",
                    $"Máximo {MaxDevicesPerUser} dispositivos permitidos por usuario. Elimina un dispositivo existente antes de agregar uno nuevo.");
                return UnprocessableEntity(problemDetails);
            }
            
            // Crear nuevo registro
            var newDevice = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = dto.Token,
                Platform = platform,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            
            await _deviceTokenRepository.AddAsync(newDevice);
            
            _logger.LogInformation("Token FCM registrado para usuario {UserId}. DeviceId: {DeviceId}, Platform: {Platform}", 
                userId, newDevice.Id, platform);
            
            return CreatedAtAction(
                nameof(RegisterDevice), 
                new DeviceRegistrationResponse(newDevice.Id, IsExisting: false));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Intento de registro de dispositivo sin autenticación");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "No autorizado",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al registrar dispositivo");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "No se pudo registrar el dispositivo.");
            return StatusCode(500, problemDetails);
        }
    }

    /// <summary>
    /// Elimina el registro de un dispositivo.
    /// El usuario solo puede eliminar sus propios dispositivos.
    /// </summary>
    /// <param name="id">ID del dispositivo a eliminar.</param>
    /// <returns>Sin contenido en caso de éxito.</returns>
    [HttpDelete("register/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDevice(Guid id)
    {
        try
        {
            var userId = GetUserId();
            
            // Verificar que el dispositivo existe Y pertenece al usuario
            var userDevices = await _deviceTokenRepository.GetByUserIdAsync(userId);
            var device = userDevices.FirstOrDefault(d => d.Id == id);
            
            if (device == null)
            {
                // No revelar si el dispositivo existe pero pertenece a otro usuario (seguridad)
                _logger.LogWarning("Intento de eliminar dispositivo {DeviceId} que no pertenece al usuario {UserId}", 
                    id, userId);
                var problemDetails = CreateProblemDetails(
                    StatusCodes.Status404NotFound,
                    "Dispositivo no encontrado",
                    "El dispositivo especificado no existe o no tienes permisos para eliminarlo.");
                return NotFound(problemDetails);
            }
            
            await _deviceTokenRepository.DeleteAsync(id);
            
            _logger.LogInformation("Dispositivo {DeviceId} eliminado para usuario {UserId}", id, userId);
            
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Intento de eliminación de dispositivo sin autenticación");
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status401Unauthorized,
                "No autorizado",
                ex.Message);
            return Unauthorized(problemDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar dispositivo {DeviceId}", id);
            var problemDetails = CreateProblemDetails(
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor",
                "No se pudo eliminar el dispositivo.");
            return StatusCode(500, problemDetails);
        }
    }
}

/// <summary>
/// Respuesta del registro de dispositivo.
/// </summary>
public record DeviceRegistrationResponse(Guid DeviceId, bool IsExisting);
