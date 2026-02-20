using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.API.Controllers;

/// <summary>
/// Controlador para gestión de empleados
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<EmployeesController> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los empleados de un negocio
    /// </summary>
    [HttpGet("business/{businessId}")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetBusinessEmployees(Guid businessId)
    {
        try
        {
            var business = await _context.Businesses.FindAsync(businessId);
            if (business == null)
                return NotFound(new { message = "Negocio no encontrado" });

            var employees = await _context.Employees
                .Where(e => e.BusinessId == businessId)
                .ToListAsync();

            var employeeDtos = _mapper.Map<IEnumerable<EmployeeDto>>(employees);
            return Ok(employeeDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener empleados del negocio {BusinessId}", businessId);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene un empleado por ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> GetById(Guid id)
    {
        try
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
                return NotFound(new { message = "Empleado no encontrado" });

            var employeeDto = _mapper.Map<EmployeeDto>(employee);
            return Ok(employeeDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Crea un nuevo empleado para un negocio
    /// </summary>
    [HttpPost("business/{businessId}")]
    [Authorize]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeDto>> Create(Guid businessId, CreateEmployeeDto dto)
    {
        try
        {
            var business = await _context.Businesses.FindAsync(businessId);
            if (business == null)
                return NotFound(new { message = "Negocio no encontrado" });

            // Verificar que el usuario sea el dueño del negocio
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });
            }
            
            if (business.OwnerId != userId)
                return Forbid();

            var employee = _mapper.Map<Employee>(dto);
            employee.BusinessId = businessId;
            employee.UserId = userId;
            employee.Name = $"{dto.FirstName} {dto.LastName}".Trim();
            employee.Position = dto.Position;
            employee.Bio = dto.Bio;
            employee.PhotoUrl = dto.ProfilePictureUrl;
            employee.CreatedAt = DateTime.UtcNow;
            employee.UpdatedAt = DateTime.UtcNow;

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            var employeeDto = _mapper.Map<EmployeeDto>(employee);
            return CreatedAtAction(nameof(GetById), new { id = employee.Id }, employeeDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear empleado");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Actualiza un empleado
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EmployeeDto>> Update(Guid id, UpdateEmployeeDto dto)
    {
        try
        {
            var employee = await _context.Employees
                .Include(e => e.Business)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
                return NotFound(new { message = "Empleado no encontrado" });

            // Verificar que el usuario sea el dueño del negocio
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });
            }
            
            if (employee.Business?.OwnerId != userId)
                return Forbid();

            if (dto.FirstName != null || dto.LastName != null)
            {
                var currentNames = (employee.Name ?? string.Empty).Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var currentFirstName = currentNames.Length > 0 ? currentNames[0] : string.Empty;
                var currentLastName = currentNames.Length > 1 ? currentNames[1] : string.Empty;

                var firstName = dto.FirstName ?? currentFirstName;
                var lastName = dto.LastName ?? currentLastName;

                employee.Name = $"{firstName} {lastName}".Trim();
            }

            if (dto.Phone != null) employee.Phone = dto.Phone;
            if (dto.Email != null) employee.Email = dto.Email;
            if (dto.Position != null) employee.Position = dto.Position;
            if (dto.Bio != null) employee.Bio = dto.Bio;
            if (dto.ProfilePictureUrl != null) employee.PhotoUrl = dto.ProfilePictureUrl;
            if (dto.IsActive.HasValue) employee.IsActive = dto.IsActive.Value;
            employee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var employeeDto = _mapper.Map<EmployeeDto>(employee);
            return Ok(employeeDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Elimina un empleado
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var employee = await _context.Employees
                .Include(e => e.Business)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
                return NotFound(new { message = "Empleado no encontrado" });

            // Verificar que el usuario sea el dueño del negocio
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });
            }
            
            if (employee.Business?.OwnerId != userId)
                return Forbid();

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}
