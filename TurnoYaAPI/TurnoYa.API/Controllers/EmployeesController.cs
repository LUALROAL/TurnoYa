using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Application.Interfaces;
using System.Security.Claims;
using TurnoYa.Application.DTOs.Appointment;

namespace TurnoYa.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IEmployeePermissionService _permissionService;
    private readonly IAppointmentService _appointmentService;
    private readonly IMapper _mapper;
    private readonly ILogger<EmployeesController> _logger;

    public EmployeesController(
        IEmployeeService employeeService,
        IEmployeePermissionService permissionService,
        IAppointmentService appointmentService,
        IMapper mapper,
        ILogger<EmployeesController> logger)
    {
        _employeeService = employeeService;
        _permissionService = permissionService;
        _appointmentService = appointmentService;
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

    /// <summary>
    /// Obtiene el perfil del empleado autenticado para un negocio específico
    /// </summary>
    /// <param name="businessId">ID del negocio</param>
    /// <returns>Perfil del empleado</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(EmployeeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmployeeDto>> GetMyProfile([FromQuery] Guid businessId)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            var employee = await _employeeService.GetByUserIdAndBusinessIdAsync(userId, businessId);
            if (employee == null)
                return NotFound(new { message = "No tienes un perfil de empleado en este negocio" });

            return Ok(employee);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener perfil del empleado");
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
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
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
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
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
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Genera un enlace de invitación para el empleado
    /// </summary>
    /// <param name="id">ID del empleado a invitar</param>
    /// <returns>Enlace de invitación con token</returns>
    [HttpPost("{id}/invite")]
    [Authorize]
    [ProducesResponseType(typeof(InvitationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<InvitationResponseDto>> GenerateInvitation(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            var invitation = await _employeeService.GenerateInvitationAsync(id, userId);
            return Ok(invitation);
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
            _logger.LogError(ex, "Error al generar invitación para empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Acepta una invitación y vincula el empleado con el usuario
    /// </summary>
    /// <param name="dto">Token de invitación y opcionalmente el ID del usuario existente</param>
    /// <returns>Resultado de la aceptación de invitación</returns>
    [HttpPost("accept-invitation")]
    [ProducesResponseType(typeof(AcceptInvitationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AcceptInvitationResponseDto>> AcceptInvitation([FromBody] AcceptInvitationDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = null;
            if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedUserId))
            {
                userId = parsedUserId;
            }
            
            var dtoWithUserId = new AcceptInvitationDto(dto.Token, userId);
            var result = await _employeeService.AcceptInvitationAsync(dtoWithUserId);
            
            if (!result.Success)
                return BadRequest(result);
            
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al aceptar invitación");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Acepta una invitación usando el código corto y vincula el empleado con el usuario logueado
    /// </summary>
    /// <param name="code">Código de invitación de 6 caracteres</param>
    /// <returns>Resultado de la aceptación de invitación</returns>
    [HttpPost("accept-invitation-by-code")]
    [ProducesResponseType(typeof(AcceptInvitationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AcceptInvitationResponseDto>> AcceptInvitationByCode([FromBody] AcceptInvitationByCodeDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Debes iniciar sesión para asociarte a un negocio" });
            }
            
            var result = await _employeeService.AcceptInvitationByCodeAsync(dto.Code, userId);
            
            if (!result.Success)
                return BadRequest(result);
            
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al aceptar invitación por código");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene los permisos de un empleado
    /// </summary>
    /// <param name="id">ID del empleado</param>
    /// <returns>Permisos configurados del empleado</returns>
    [HttpGet("{id}/permissions")]
    [Authorize]
    [ProducesResponseType(typeof(EmployeePermissionsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmployeePermissionsDto>> GetPermissions(Guid id)
    {
        try
        {
            var permissions = await _permissionService.GetPermissionsAsync(id);
            if (permissions == null)
                return NotFound(new { message = "Permisos no encontrados" });
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener permisos del empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Actualiza los permisos de un empleado
    /// </summary>
    /// <param name="id">ID del empleado</param>
    /// <param name="dto">Nuevos permisos a configurar</param>
    /// <returns>Permisos actualizados del empleado</returns>
    [HttpPut("{id}/permissions")]
    [Authorize]
    [ProducesResponseType(typeof(EmployeePermissionsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmployeePermissionsDto>> UpdatePermissions(Guid id, [FromBody] UpdateEmployeePermissionsDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            // Verify ownership - el que actualiza debe ser owner del negocio
            var employee = await _employeeService.GetByIdAsync(id);
            if (employee == null)
                return NotFound(new { message = "Empleado no encontrado" });
            
            var permissions = await _permissionService.UpdatePermissionsAsync(id, dto);
            return Ok(permissions);
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
            _logger.LogError(ex, "Error al actualizar permisos del empleado {EmployeeId}", id);
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }

    /// <summary>
    /// Obtiene las citas asignadas al empleado autenticado
    /// </summary>
    /// <param name="from">Fecha inicial opcional para filtrar citas</param>
    /// <param name="to">Fecha final opcional para filtrar citas</param>
    /// <returns>Lista de citas asignadas al empleado</returns>
    [HttpGet("my-appointments")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<AppointmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetMyAppointments([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        try
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "No se pudo obtener el ID del usuario" });

            // Find employee by userId - the user must be linked as an employee
            var employees = await _employeeService.GetEmployeesByUserIdAsync(userId);
            if (employees == null || !employees.Any())
                return NotFound(new { message = "No tienes un perfil de empleado asociado" });

            // Get appointments for all employee's businesses
            var allAppointments = new List<AppointmentDto>();
            foreach (var employee in employees)
            {
                var appointments = await _appointmentService.GetByEmployeeAsync(employee.Id, from, to);
                allAppointments.AddRange(appointments);
            }

            // Sort by date descending
            var sorted = allAppointments.OrderByDescending(a => a.ScheduledDate).ToList();
            return Ok(sorted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener citas del empleado");
            return StatusCode(500, new { message = "Error interno del servidor" });
        }
    }
}