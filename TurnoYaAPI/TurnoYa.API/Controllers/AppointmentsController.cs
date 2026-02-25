using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;

namespace TurnoYaAPI.Controllers
{
    /// <summary>
    /// Controlador para gestión de citas: creación, consulta y estados.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;

        public AppointmentsController(IAppointmentService appointmentService)
        {
            _appointmentService = appointmentService;
        }

        private Guid? GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            return Guid.TryParse(idClaim, out var id) ? id : (Guid?)null;
        }

        /// <summary>
        /// Crea una nueva cita para el usuario autenticado.
        /// </summary>
        /// <param name="dto">Datos de la cita: servicio, fecha, empleado opcional, notas.</param>
        /// <returns>La cita creada.</returns>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<AppointmentDto>> Create([FromBody] CreateAppointmentDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var result = await _appointmentService.CreateAsync(dto, userId.Value);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException dbEx) when (dbEx.InnerException is SqlException sqlEx && sqlEx.Number == 547)
            {
                return BadRequest(new
                {
                    message = "No se pudo crear la cita por una restricción de datos. Verifica servicio, profesional y estado de la cita."
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }

        /// <summary>
        /// Obtiene una cita por ID. Accesible por el cliente o el dueño del negocio.
        /// </summary>
        /// <param name="id">ID de la cita</param>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<AppointmentDto>> GetById(Guid id)
        {
            var requesterId = GetUserId();
            if (requesterId == null) return Unauthorized();
            var appt = await _appointmentService.GetByIdAsync(id, requesterId.Value);
            if (appt == null) return NotFound();
            return Ok(appt);
        }

        /// <summary>
        /// Lista las citas del usuario autenticado.
        /// </summary>
        /// <param name="from">Fecha inicial opcional</param>
        /// <param name="to">Fecha final opcional</param>
        /// <param name="status">Filtrar por estado opcional</param>
        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetMy([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] AppointmentStatus? status)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();
            var list = await _appointmentService.GetMyAsync(userId.Value, from, to);
            if (status.HasValue)
                list = list.Where(a => a.Status == status.Value);
            return Ok(list);
        }

        /// <summary>
        /// Lista las citas de un negocio. Requiere ser el dueño del negocio.
        /// </summary>
        /// <param name="businessId">ID del negocio</param>
        /// <param name="from">Fecha inicial opcional</param>
        /// <param name="to">Fecha final opcional</param>
        /// <param name="status">Filtrar por estado opcional</param>
        [HttpGet("business/{businessId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetBusiness(Guid businessId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] AppointmentStatus? status)
        {
            var ownerId = GetUserId();
            if (ownerId == null) return Unauthorized();
            var list = await _appointmentService.GetBusinessAsync(businessId, ownerId.Value, from, to);
            if (status.HasValue)
                list = list.Where(a => a.Status == status.Value);
            return Ok(list);
        }

        /// <summary>
        /// Confirma una cita. Solo el dueño del negocio.
        /// </summary>
        /// <param name="id">ID de la cita</param>
        [HttpPatch("{id}/confirm")]
        [Authorize]
        public async Task<ActionResult> Confirm(Guid id)
        {
            var ownerId = GetUserId();
            if (ownerId == null) return Unauthorized();
            var ok = await _appointmentService.ConfirmAsync(id, ownerId.Value);
            if (!ok) return BadRequest();
            return NoContent();
        }

        public class CancelRequest { public string? Reason { get; set; } }

        /// <summary>
        /// Cancela una cita. Puede el cliente o el dueño.
        /// </summary>
        /// <param name="id">ID de la cita</param>
        /// <param name="body">Motivo opcional</param>
        [HttpPatch("{id}/cancel")]
        [Authorize]
        public async Task<ActionResult> Cancel(Guid id, [FromBody] CancelRequest body)
        {
            var requesterId = GetUserId();
            if (requesterId == null) return Unauthorized();
            var ok = await _appointmentService.CancelAsync(id, requesterId.Value, body?.Reason);
            if (!ok) return BadRequest();
            return NoContent();
        }

        /// <summary>
        /// Marca una cita como completada. Solo el dueño.
        /// </summary>
        /// <param name="id">ID de la cita</param>
        [HttpPatch("{id}/complete")]
        [Authorize]
        public async Task<ActionResult> Complete(Guid id)
        {
            var ownerId = GetUserId();
            if (ownerId == null) return Unauthorized();
            var ok = await _appointmentService.CompleteAsync(id, ownerId.Value);
            if (!ok) return BadRequest();
            return NoContent();
        }

        /// <summary>
        /// Marca una cita como inasistencia (NoShow). Solo el dueño.
        /// </summary>
        /// <param name="id">ID de la cita</param>
        [HttpPatch("{id}/noshow")]
        [Authorize]
        public async Task<ActionResult> NoShow(Guid id)
        {
            var ownerId = GetUserId();
            if (ownerId == null) return Unauthorized();
            var ok = await _appointmentService.MarkNoShowAsync(id, ownerId.Value);
            if (!ok) return BadRequest();
            return NoContent();
        }
    }
}
 
