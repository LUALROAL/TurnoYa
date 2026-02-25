using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.Interfaces;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de horarios de negocio
/// </summary>
[ApiController]
[Route("api/[controller]/[action]")]
public class BusinessScheduleController : ControllerBase
{
    private readonly IBusinessScheduleService _service;

    public BusinessScheduleController(IBusinessScheduleService service)
    {
        _service = service;
    }

    /// <summary>
    /// Obtiene el horario de trabajo de un negocio por su ID
    /// </summary>
    /// <param name="businessId">ID del negocio</param>
    /// <returns>Horario de trabajo</returns>
    [HttpGet("{businessId}")]
    public async Task<ActionResult<WorkingHoursDto>> GetByBusiness(Guid businessId)
    {
        var schedule = await _service.GetByBusinessIdAsync(businessId);
        if (schedule == null)
            return NotFound();
        // Mapear a DTO (implementación pendiente)
        return Ok(schedule);
    }

    /// <summary>
    /// Crea un nuevo horario de trabajo para un negocio
    /// </summary>
    /// <param name="businessId">ID del negocio</param>
    /// <param name="dto">Datos del horario</param>
    [HttpPost]
    public async Task<ActionResult> Create(Guid businessId, [FromBody] WorkingHoursDto dto)
    {
        await _service.CreateAsync(businessId, dto);
        return CreatedAtAction(nameof(GetByBusiness), new { businessId }, dto);
    }

    /// <summary>
    /// Actualiza el horario de trabajo de un negocio
    /// </summary>
    /// <param name="businessId">ID del negocio</param>
    /// <param name="dto">Datos del horario</param>
    [HttpPut("{businessId}")]
    public async Task<ActionResult> Update(Guid businessId, [FromBody] WorkingHoursDto dto)
    {
        await _service.UpdateAsync(businessId, dto);
        return NoContent();
    }

    /// <summary>
    /// Elimina el horario de trabajo de un negocio
    /// </summary>
    /// <param name="businessId">ID del negocio</param>
    [HttpDelete("{businessId}")]
    public async Task<ActionResult> Delete(Guid businessId)
    {
        await _service.DeleteAsync(businessId);
        return NoContent();
    }
}
