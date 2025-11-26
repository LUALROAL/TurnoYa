using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de citas
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAvailabilityService _availabilityService;
    private readonly ILogger<AppointmentsController> _logger;

    public AppointmentsController(
        IAvailabilityService availabilityService,
        ILogger<AppointmentsController> logger)
    {
        _availabilityService = availabilityService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene los slots de tiempo disponibles para un servicio
    /// </summary>
    /// <param name="businessId">ID del negocio</param>
    /// <param name="serviceId">ID del servicio</param>
    /// <param name="date">Fecha para consultar (formato: yyyy-MM-dd)</param>
    /// <param name="employeeId">ID del empleado (opcional)</param>
    [HttpGet("availability")]
    [ProducesResponseType(typeof(IEnumerable<TimeSlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<TimeSlotDto>>> GetAvailability(
        [FromQuery] Guid businessId,
        [FromQuery] Guid serviceId,
        [FromQuery] DateTime date,
        [FromQuery] Guid? employeeId = null)
    {
        try
        {
            if (businessId == Guid.Empty)
                return BadRequest(new { message = "El ID del negocio es requerido" });

            if (serviceId == Guid.Empty)
                return BadRequest(new { message = "El ID del servicio es requerido" });

            if (date == DateTime.MinValue)
                return BadRequest(new { message = "La fecha es requerida" });

            var query = new AvailabilityQueryDto
            {
                BusinessId = businessId,
                ServiceId = serviceId,
                Date = date,
                EmployeeId = employeeId
            };

            var slots = await _availabilityService.GetAvailableSlotsAsync(query);
            return Ok(slots);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener disponibilidad");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
