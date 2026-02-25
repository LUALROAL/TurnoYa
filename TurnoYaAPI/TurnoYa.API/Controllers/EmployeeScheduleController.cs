using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Application.Interfaces;

namespace TurnoYa.API.Controllers;

[ApiController]
[Route("api/[controller]/[action]")]
public class EmployeeScheduleController : ControllerBase
{
    private readonly IEmployeeScheduleService _service;
    public EmployeeScheduleController(IEmployeeScheduleService service)
    {
        _service = service;
    }
    // GET: api/EmployeeSchedule/GetByEmployee/{employeeId}
    [HttpGet("{employeeId}")]
    public async Task<ActionResult<WorkingHoursDto>> GetByEmployee(Guid employeeId)
    {
        var schedule = await _service.GetByEmployeeIdAsync(employeeId);
        if (schedule == null)
            return NotFound();
        return Ok(schedule);
    }
    // POST: api/EmployeeSchedule/Create
    [HttpPost]
    public async Task<ActionResult> Create(Guid employeeId, [FromBody] WorkingHoursDto dto)
    {
        await _service.CreateAsync(employeeId, dto);
        return CreatedAtAction(nameof(GetByEmployee), new { employeeId }, dto);
    }
    // PUT: api/EmployeeSchedule/Update/{employeeId}
    [HttpPut("{employeeId}")]
    public async Task<ActionResult> Update(Guid employeeId, [FromBody] WorkingHoursDto dto)
    {
        await _service.UpdateAsync(employeeId, dto);
        return NoContent();
    }
    // DELETE: api/EmployeeSchedule/Delete/{employeeId}
    [HttpDelete("{employeeId}")]
    public async Task<ActionResult> Delete(Guid employeeId)
    {
        await _service.DeleteAsync(employeeId);
        return NoContent();
    }
}

