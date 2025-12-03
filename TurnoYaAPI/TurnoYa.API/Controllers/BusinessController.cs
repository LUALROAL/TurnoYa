using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de negocios
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class BusinessController : ControllerBase
{
    private readonly IBusinessRepository _businessRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<BusinessController> _logger;
    private readonly ApplicationDbContext _context;

    public BusinessController(
        IBusinessRepository businessRepository,
        IMapper mapper,
        ILogger<BusinessController> logger,
        ApplicationDbContext context)
    {
        _businessRepository = businessRepository;
        _mapper = mapper;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Obtiene todos los negocios activos
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BusinessListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessListDto>>> GetAll()
    {
        var businesses = await _businessRepository.GetAllAsync();
        var businessDtos = _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        return Ok(businessDtos);
    }

    /// <summary>
    /// Obtiene un negocio por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BusinessDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BusinessDetailDto>> GetById(Guid id)
    {
        var business = await _businessRepository.GetByIdAsync(id);
        if (business == null)
            return NotFound(new { message = "Negocio no encontrado" });

        var businessDto = _mapper.Map<BusinessDetailDto>(business);
        return Ok(businessDto);
    }

    /// <summary>
    /// Obtiene negocios por dueño
    /// </summary>
    [HttpGet("owner/{ownerId}")]
    [ProducesResponseType(typeof(IEnumerable<BusinessDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessDto>>> GetByOwner(Guid ownerId)
    {
        var businesses = await _businessRepository.GetByOwnerIdAsync(ownerId);
        var businessDtos = _mapper.Map<IEnumerable<BusinessDto>>(businesses);
        return Ok(businessDtos);
    }

    /// <summary>
    /// Busca negocios cercanos por coordenadas
    /// </summary>
    [HttpGet("nearby")]
    [ProducesResponseType(typeof(IEnumerable<BusinessListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessListDto>>> GetNearby(
        [FromQuery] decimal latitude,
        [FromQuery] decimal longitude,
        [FromQuery] double radiusKm = 10)
    {
        var businesses = await _businessRepository.GetNearbyAsync(latitude, longitude, radiusKm);
        var businessDtos = _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        return Ok(businessDtos);
    }

    /// <summary>
    /// Busca negocios por filtros
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<BusinessListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessListDto>>> Search(
        [FromQuery] string? query,
        [FromQuery] string? city,
        [FromQuery] string? category)
    {
        var businesses = await _businessRepository.SearchAsync(query, city, category);
        var businessDtos = _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        return Ok(businessDtos);
    }

    /// <summary>
    /// Obtiene negocios por categoría
    /// </summary>
    [HttpGet("category/{category}")]
    [ProducesResponseType(typeof(IEnumerable<BusinessListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessListDto>>> GetByCategory(string category)
    {
        var businesses = await _businessRepository.GetByCategoryAsync(category);
        var businessDtos = _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        return Ok(businessDtos);
    }

    /// <summary>
    /// Obtiene el listado de categorías disponibles (distintas en la tabla de negocios)
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _context.Businesses
            .Where(b => !string.IsNullOrEmpty(b.Category))
            .Select(b => b.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
        return Ok(categories);
    }

    /// <summary>
    /// Crea un nuevo negocio
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(BusinessDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BusinessDto>> Create([FromBody] CreateBusinessDto dto)
    {
        try
        {
            // Obtener el OwnerId del usuario autenticado (del JWT)
            var ownerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                            ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(ownerIdClaim) || !Guid.TryParse(ownerIdClaim, out var ownerId))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario autenticado" });
            }

            var business = _mapper.Map<Business>(dto);
            business.OwnerId = ownerId;

            var createdBusiness = await _businessRepository.AddAsync(business);
            var businessDto = _mapper.Map<BusinessDto>(createdBusiness);

            return CreatedAtAction(nameof(GetById), new { id = createdBusiness.Id }, businessDto);
        }
        catch (DbUpdateException dbEx)
        {
            // Manejo específico de violaciones de restricciones de BD (ej. CHECK de Category)
            if (dbEx.InnerException is SqlException sqlEx && sqlEx.Number == 547)
            {
                var message = "Error al guardar: datos no válidos para la entidad.";
                if (sqlEx.Message.Contains("Category", StringComparison.OrdinalIgnoreCase))
                {
                    message = "La categoría enviada no está permitida por el sistema.";
                }
                _logger.LogError(dbEx, "Violación de restricción al crear negocio");
                return BadRequest(new { message });
            }
            _logger.LogError(dbEx, "Error de base de datos al crear negocio");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear negocio");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Actualiza un negocio existente
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(BusinessDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<BusinessDto>> Update(Guid id, [FromBody] UpdateBusinessDto dto)
    {
        try
        {
            var business = await _businessRepository.GetByIdAsync(id);
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

            _mapper.Map(dto, business);
            business.UpdatedAt = DateTime.UtcNow;

            var updatedBusiness = await _businessRepository.UpdateAsync(business);
            var businessDto = _mapper.Map<BusinessDto>(updatedBusiness);

            return Ok(businessDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar negocio");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Elimina un negocio
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
            var business = await _businessRepository.GetByIdAsync(id);
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

            await _businessRepository.DeleteAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar negocio {BusinessId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene la configuración de un negocio
    /// </summary>
    [HttpGet("{id}/settings")]
    [ProducesResponseType(typeof(BusinessSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BusinessSettingsDto>> GetSettings(Guid id)
    {
        try
        {
            var business = await _context.Businesses
                .Include(b => b.Settings)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (business == null)
                return NotFound(new { message = "Negocio no encontrado" });

            if (business.Settings == null)
            {
                // Crear configuración por defecto
                business.Settings = new BusinessSettings
                {
                    BusinessId = business.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
            }

            var settingsDto = _mapper.Map<BusinessSettingsDto>(business.Settings);
            return Ok(settingsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener configuración del negocio {BusinessId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Actualiza la configuración de un negocio
    /// </summary>
    [HttpPut("{id}/settings")]
    [Authorize]
    [ProducesResponseType(typeof(BusinessSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<BusinessSettingsDto>> UpdateSettings(Guid id, BusinessSettingsDto dto)
    {
        try
        {
            var business = await _context.Businesses
                .Include(b => b.Settings)
                .FirstOrDefaultAsync(b => b.Id == id);

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

            if (business.Settings == null)
            {
                business.Settings = new BusinessSettings
                {
                    BusinessId = business.Id,
                    CreatedAt = DateTime.UtcNow
                };
                _context.BusinessSettings.Add(business.Settings);
            }

            _mapper.Map(dto, business.Settings);
            business.Settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var settingsDto = _mapper.Map<BusinessSettingsDto>(business.Settings);
            return Ok(settingsDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar configuración del negocio {BusinessId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
