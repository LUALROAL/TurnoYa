using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Application.Interfaces;
using System.Security.Claims;

namespace TurnoYa.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IMapper _mapper;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        IEmployeeService employeeService,
        IMapper mapper,
        ILogger<EmployeesController> logger)
    {
        _employeeService = employeeService;
        _mapper = mapper;
        _logger = logger;
    }

    [HttpGet("business/{businessId}")]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetBusinessEmployees(Guid businessId)
    {
        try
        {
            var employees = await _employeeService.GetByBusinessIdAsync(businessId);
            return Ok(employees);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener empleados del negocio {BusinessId}", businessId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmployeeDto>> GetById(Guid id)
    {
        try
        {
            var employee = await _employeeService.GetByIdAsync(id);
            if (employee == null)
                return NotFound(new { message = "Empleado no encontrado" });
            return Ok(employee);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    [HttpPost("business/{businessId}")]
    [Authorize]
    public async Task<ActionResult<EmployeeDto>> Create(Guid businessId, [FromForm] CreateEmployeeDto dto, [FromForm] IFormFile? photo)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            byte[]? photoData = null;
            if (photo != null)
            {
                using var ms = new MemoryStream();
                await photo.CopyToAsync(ms);
                photoData = ms.ToArray();
            }

            var created = await _employeeService.CreateAsync(businessId, userId, dto, photoData);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear empleado");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<EmployeeDto>> Update(Guid id, [FromForm] UpdateEmployeeDto dto, [FromForm] IFormFile? photo)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            byte[]? photoData = null;
            if (photo != null)
            {
                using var ms = new MemoryStream();
                await photo.CopyToAsync(ms);
                photoData = ms.ToArray();
            }

            var updated = await _employeeService.UpdateAsync(id, userId, dto, photoData);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            await _employeeService.DeleteAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}