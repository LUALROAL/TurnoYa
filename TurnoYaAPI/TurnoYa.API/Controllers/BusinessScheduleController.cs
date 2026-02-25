using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.Interfaces;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.API.Controllers;

[ApiController]
[Route("api/[controller]/[action]")]
public class BusinessScheduleController : ControllerBase
{
    private readonly IBusinessScheduleService _service;

    public BusinessScheduleController(IBusinessScheduleService service)
    {
        _service = service;
    }

    // GET: api/BusinessSchedule/GetByBusiness/{businessId}
    [HttpGet("{businessId}")]
    public async Task<ActionResult<WorkingHoursDto>> GetByBusiness(Guid businessId)
    {
        var schedule = await _service.GetByBusinessIdAsync(businessId);
        if (schedule == null)
            return NotFound();
        // Mapear a DTO (implementación pendiente)
        return Ok(schedule);
    }

    // POST: api/BusinessSchedule/Create
    [HttpPost]
    public async Task<ActionResult> Create(Guid businessId, [FromBody] WorkingHoursDto dto)
    {
        await _service.CreateAsync(businessId, dto);
        return CreatedAtAction(nameof(GetByBusiness), new { businessId }, dto);
    }

    // PUT: api/BusinessSchedule/Update/{businessId}
    [HttpPut("{businessId}")]
    public async Task<ActionResult> Update(Guid businessId, [FromBody] WorkingHoursDto dto)
    {
        await _service.UpdateAsync(businessId, dto);
        return NoContent();
    }

    // DELETE: api/BusinessSchedule/Delete/{businessId}
    [HttpDelete("{businessId}")]
    public async Task<ActionResult> Delete(Guid businessId)
    {
        await _service.DeleteAsync(businessId);
        return NoContent();
    }
}
