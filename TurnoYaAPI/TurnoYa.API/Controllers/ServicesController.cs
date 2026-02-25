using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Service;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de servicios (alta, baja, edición, consulta)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<ServicesController> _logger;

    public ServicesController(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<ServicesController> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los servicios de un negocio
    /// </summary>
    [HttpGet("business/{businessId}")]
    [ProducesResponseType(typeof(IEnumerable<ServiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<ServiceDto>>> GetBusinessServices(Guid businessId)
    {
        try
        {
            var business = await _context.Businesses.FindAsync(businessId);
            if (business == null)
                return NotFound(new { message = "Negocio no encontrado" });

            var services = await _context.Services
                .Where(s => s.BusinessId == businessId)
                .ToListAsync();

            var serviceDtos = _mapper.Map<IEnumerable<ServiceDto>>(services);
            return Ok(serviceDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener servicios del negocio {BusinessId}", businessId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene un servicio por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ServiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceDto>> GetById(Guid id)
    {
        try
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });

            var serviceDto = _mapper.Map<ServiceDto>(service);
            return Ok(serviceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener servicio {ServiceId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Crea un nuevo servicio para un negocio
    /// </summary>
    [HttpPost("business/{businessId}")]
    [Authorize]
    [ProducesResponseType(typeof(ServiceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceDto>> Create(Guid businessId, CreateServiceDto dto)
    {
        try
        {
            var business = await _context.Businesses.FindAsync(businessId);
            if (business == null)
                return NotFound(new { message = "Negocio no encontrado" });

            // Verificar que el usuario sea el dueño del negocio
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });
            }
            
            if (business.OwnerId != userId)
                return Forbid();

            var service = _mapper.Map<Service>(dto);
            service.BusinessId = businessId;
            service.CreatedAt = DateTime.UtcNow;
            service.UpdatedAt = DateTime.UtcNow;

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            var serviceDto = _mapper.Map<ServiceDto>(service);
            return CreatedAtAction(nameof(GetById), new { id = service.Id }, serviceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear servicio");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Actualiza un servicio
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ServiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ServiceDto>> Update(Guid id, UpdateServiceDto dto)
    {
        try
        {
            var service = await _context.Services
                .Include(s => s.Business)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });

            // Verificar que el usuario sea el dueño del negocio
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });
            }
            
            if (service.Business?.OwnerId != userId)
                return Forbid();

            _mapper.Map(dto, service);
            service.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var serviceDto = _mapper.Map<ServiceDto>(service);
            return Ok(serviceDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar servicio {ServiceId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Elimina un servicio
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var service = await _context.Services
                .Include(s => s.Business)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (service == null)
                return NotFound(new { message = "Servicio no encontrado" });

            // Verificar que el usuario sea el dueño del negocio
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });
            }
            
            if (service.Business?.OwnerId != userId)
                return Forbid();

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar servicio {ServiceId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
