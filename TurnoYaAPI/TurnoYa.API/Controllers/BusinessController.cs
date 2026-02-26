
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Application.Interfaces;
using System.Security.Claims;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de negocios (alta, baja, edición, consulta)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class BusinessController : ControllerBase
{

    private readonly IBusinessService _businessService;
    private readonly IMapper _mapper;
    private readonly ILogger<BusinessController> _logger;

    public BusinessController(
        IBusinessService businessService,
        IMapper mapper,
        ILogger<BusinessController> logger)
    {
        _businessService = businessService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los negocios activos
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<BusinessListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessListDto>>> GetAll()
    {
        var businessDtos = await _businessService.GetAllAsync();
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
        var businessDto = await _businessService.GetByIdAsync(id);
        if (businessDto == null)
            return NotFound(new { message = "Negocio no encontrado" });
        return Ok(businessDto);
    }

    /// <summary>
    /// Obtiene negocios por dueño
    /// </summary>
    [HttpGet("owner/{ownerId}")]
    [ProducesResponseType(typeof(IEnumerable<BusinessDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessDto>>> GetByOwner(Guid ownerId)
    {
        var businesses = await _businessService.GetByOwnerIdAsync(ownerId);
        var businessDtos = new List<BusinessDto>();
        foreach (var business in businesses)
        {
            var detail = await _businessService.GetByIdAsync(business.Id);
            if (detail != null)
            {
                // Convertir BusinessDetailDto a BusinessDto
                var dto = new BusinessDto
                {
                    Id = detail.Id,
                    Name = detail.Name,
                    Description = detail.Description,
                    Category = detail.Category,
                    Address = detail.Address,
                    City = detail.City,
                    Department = detail.Department,
                    Phone = detail.Phone,
                    Email = detail.Email,
                    Website = detail.Website,
                    Latitude = detail.Latitude,
                    Longitude = detail.Longitude,
                    AverageRating = detail.AverageRating,
                    TotalReviews = detail.TotalReviews,
                    IsActive = detail.IsActive,
                    CreatedAt = detail.CreatedAt,
                    OwnerId = detail.Owner.Id,
                    OwnerName = detail.Owner.FullName,
                    Images = detail.Images
                };
                businessDtos.Add(dto);
            }
        }
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
        var businessDtos = await _businessService.GetNearbyAsync((double)latitude, (double)longitude, radiusKm);
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
        var businessDtos = await _businessService.SearchAsync(query ?? string.Empty, city ?? string.Empty, category ?? string.Empty);
        return Ok(businessDtos);
    }

    /// <summary>
    /// Obtiene negocios por categoría
    /// </summary>
    [HttpGet("category/{category}")]
    [ProducesResponseType(typeof(IEnumerable<BusinessListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BusinessListDto>>> GetByCategory(string category)
    {
        var businessDtos = await _businessService.GetByCategoryAsync(category);
        return Ok(businessDtos);
    }

    /// <summary>
    /// Obtiene el listado de categorías disponibles (distintas en la tabla de negocios)
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _businessService.GetCategoriesAsync();
        return Ok(categories);
    }

    /// <summary>
    /// Crea un nuevo negocio
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(BusinessDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [RequestSizeLimit(10_000_000)] // 10 MB
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<BusinessDto>> Create([
        FromForm] CreateBusinessDto dto,
        [FromForm] List<IFormFile>? images)
    {
        // Obtener OwnerId del usuario autenticado
        var ownerIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        foreach (var claim in User.Claims)
        {
            _logger.LogWarning($"CLAIM => {claim.Type} = {claim.Value}");
        }
        if (string.IsNullOrEmpty(ownerIdString))
        {
            return StatusCode(403, new { message = "No se pudo identificar el usuario" });
        }

        var ownerId = Guid.Parse(ownerIdString);

        // Convertir imágenes a byte[]
        List<byte[]>? imageBytes = null;
        if (images != null && images.Count > 0)
        {
            imageBytes = new List<byte[]>();
            foreach (var img in images)
            {
                using var ms = new MemoryStream();
                await img.CopyToAsync(ms);
                imageBytes.Add(ms.ToArray());
            }
        }

        try
        {
            var created = await _businessService.AddAsync(dto, ownerId, imageBytes);
            // Convertir BusinessDetailDto a BusinessDto
            var dtoResult = new BusinessDto
            {
                Id = created.Id,
                Name = created.Name,
                Description = created.Description,
                Category = created.Category,
                Address = created.Address,
                City = created.City,
                Department = created.Department,
                Phone = created.Phone,
                Email = created.Email,
                Website = created.Website,
                Latitude = created.Latitude,
                Longitude = created.Longitude,
                AverageRating = created.AverageRating,
                TotalReviews = created.TotalReviews,
                IsActive = created.IsActive,
                CreatedAt = created.CreatedAt,
                OwnerId = created.Owner.Id,
                OwnerName = created.Owner.FullName,
                Images = created.Images
            };
            return CreatedAtAction(nameof(GetById), new { id = dtoResult.Id }, dtoResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear negocio");
            return StatusCode(500, new { message = "Error interno al crear negocio" });
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
    [RequestSizeLimit(10_000_000)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<BusinessDto>> Update(Guid id, [FromForm] UpdateBusinessDto dto, [FromForm] List<IFormFile>? images)
    {
        // Obtener OwnerId del usuario autenticado
        // var ownerIdClaim = User.Claims.FirstOrDefault(c => c.Type == "nameid" || c.Type == "sub" || c.Type == "id" || c.Type == "userId");
        var ownerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (ownerIdClaim == null)
        {
            _logger.LogWarning("Claims disponibles: " +
                string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

            return StatusCode(403, new { message = "No se pudo identificar el usuario" });
        }
        var ownerId = Guid.Parse(ownerIdClaim.Value);

        // Convertir imágenes a byte[]
        List<byte[]>? imageBytes = null;
        if (images != null && images.Count > 0)
        {
            imageBytes = new List<byte[]>();
            foreach (var img in images)
            {
                using var ms = new MemoryStream();
                await img.CopyToAsync(ms);
                imageBytes.Add(ms.ToArray());
            }
        }

        try
        {
            var updated = await _businessService.UpdateAsync(id, dto, ownerId, imageBytes);
            // Convertir BusinessDetailDto a BusinessDto
            var dtoResult = new BusinessDto
            {
                Id = updated.Id,
                Name = updated.Name,
                Description = updated.Description,
                Category = updated.Category,
                Address = updated.Address,
                City = updated.City,
                Department = updated.Department,
                Phone = updated.Phone,
                Email = updated.Email,
                Website = updated.Website,
                Latitude = updated.Latitude,
                Longitude = updated.Longitude,
                AverageRating = updated.AverageRating,
                TotalReviews = updated.TotalReviews,
                IsActive = updated.IsActive,
                CreatedAt = updated.CreatedAt,
                OwnerId = updated.Owner.Id,
                OwnerName = updated.Owner.FullName,
                Images = updated.Images
            };
            return Ok(dtoResult);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Negocio no encontrado" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("No autorizado para modificar este negocio");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar negocio");
            return StatusCode(500, new { message = "Error interno al actualizar negocio" });
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
        // TODO: Obtener OwnerId del usuario autenticado y pasar a servicio
        throw new NotImplementedException("Mover lógica de eliminación a BusinessService");
    }

    /// <summary>
    /// Obtiene la configuración de un negocio
    /// </summary>
    [HttpGet("{id}/settings")]
    [ProducesResponseType(typeof(BusinessSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BusinessSettingsDto>> GetSettings(Guid id)
    {
        var settings = await _businessService.GetSettingsAsync(id);
        if (settings == null)
            return NotFound(new { message = "Configuración no encontrada" });
        return Ok(settings);
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
        // TODO: Mover lógica de actualización de settings a BusinessService
        throw new NotImplementedException("Mover lógica de actualización de settings a BusinessService");
    }
}
