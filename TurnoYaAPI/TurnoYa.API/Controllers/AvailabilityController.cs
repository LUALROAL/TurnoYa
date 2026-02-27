using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Availability;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AvailabilityController : ControllerBase
    {
        private readonly IAvailabilityService _availabilityService;

        public AvailabilityController(IAvailabilityService availabilityService)
        {
            _availabilityService = availabilityService;
        }

        /// <summary>
        /// Obtiene los horarios disponibles para una fecha, servicio y opcionalmente empleado.
        /// </summary>
        /// <param name="businessId">ID del negocio</param>
        /// <param name="serviceId">ID del servicio</param>
        /// <param name="employeeId">ID del empleado (opcional)</param>
        /// <param name="date">Fecha en formato YYYY-MM-DD</param>
        [HttpGet("slots")]
        public async Task<ActionResult<AvailabilityResponseDto>> GetAvailableSlots(
    [FromQuery] Guid businessId,
    [FromQuery] Guid serviceId,
    [FromQuery] Guid? employeeId,
    [FromQuery] DateTime date)
        {
            try
            {
                var result = await _availabilityService.GetAvailableSlotsAsync(businessId, serviceId, employeeId, date);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("days")]
        public async Task<ActionResult<List<string>>> GetAvailableDays(
            [FromQuery] Guid businessId,
            [FromQuery] Guid serviceId,
            [FromQuery] Guid? employeeId,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
        {
            try
            {
                var result = await _availabilityService.GetAvailableDaysAsync(businessId, serviceId, employeeId, from, to);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}