using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TurnoYa.Application.DTOs.BusinessValidation;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BusinessValidationsController : ControllerBase
{
    private readonly IBusinessValidationService _validationService;
    private readonly IMapper _mapper;
    private readonly ILogger<BusinessValidationsController> _logger;

    public BusinessValidationsController(
        IBusinessValidationService validationService,
        IMapper mapper,
        ILogger<BusinessValidationsController> logger)
    {
        _validationService = validationService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Crea una validación de negocio después de una cita completada
    /// </summary>
    /// <param name="dto">Datos de la validación</param>
    /// <returns>Validación creada</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(BusinessValidationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BusinessValidationDto>> Create([FromBody] CreateBusinessValidationDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            var created = await _validationService.CreateValidationAsync(dto, userId);
            return CreatedAtAction(nameof(Create), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear validación de negocio");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene la información de certificación de un negocio
    /// </summary>
    /// <param name="businessId">ID del negocio</param>
    /// <returns>Resultado de certificación</returns>
    [HttpGet("certification/{businessId}")]
    [ProducesResponseType(typeof(BusinessCertificationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BusinessCertificationResultDto>> GetCertification(Guid businessId)
    {
        try
        {
            var result = await _validationService.CalculateCertificationAsync(businessId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener certificación del negocio {BusinessId}", businessId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}