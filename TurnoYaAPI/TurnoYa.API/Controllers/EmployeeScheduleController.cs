using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de horarios de empleados
/// </summary>
[ApiController]
[Route("api/[controller]/[action]")]
public class EmployeeScheduleController : ControllerBase
{
    private readonly IEmployeeScheduleService _service;
    public EmployeeScheduleController(IEmployeeScheduleService service)
    {
        _service = service;
    }
    /// <summary>
    /// Obtiene el horario de trabajo de un empleado por su ID
    /// </summary>
    /// <param name="employeeId">ID del empleado</param>
    /// <returns>Horario de trabajo</returns>
    [HttpGet("{employeeId}")]
    public async Task<ActionResult<WorkingHoursDto>> GetByEmployee(Guid employeeId)
    {
        var schedule = await _service.GetByEmployeeIdAsync(employeeId);
        if (schedule == null)
            return NotFound();
        return Ok(schedule);
    }
    /// <summary>
    /// Crea un nuevo horario de trabajo para un empleado
    /// </summary>
    /// <param name="employeeId">ID del empleado</param>
    /// <param name="dto">Datos del horario</param>
    [HttpPost]
    public async Task<ActionResult> Create(Guid employeeId, [FromBody] WorkingHoursDto dto)
    {
        await _service.CreateAsync(employeeId, dto);
        return CreatedAtAction(nameof(GetByEmployee), new { employeeId }, dto);
    }
    /// <summary>
    /// Actualiza el horario de trabajo de un empleado
    /// </summary>
    /// <param name="employeeId">ID del empleado</param>
    /// <param name="dto">Datos del horario</param>
    [HttpPut("{employeeId}")]
    public async Task<ActionResult> Update(Guid employeeId, [FromBody] WorkingHoursDto dto)
    {
        await _service.UpdateAsync(employeeId, dto);
        return NoContent();
    }
    /// <summary>
    /// Elimina el horario de trabajo de un empleado
    /// </summary>
    /// <param name="employeeId">ID del empleado</param>
    [HttpDelete("{employeeId}")]
    public async Task<ActionResult> Delete(Guid employeeId)
    {
        await _service.DeleteAsync(employeeId);
        return NoContent();
    }
}

