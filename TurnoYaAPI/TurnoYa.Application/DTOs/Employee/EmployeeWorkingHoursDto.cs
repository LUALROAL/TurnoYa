using System.Collections.Generic;

namespace TurnoYa.Application.DTOs.Employee;

/// <summary>
/// DTO para representar los horarios de trabajo de un empleado, incluyendo fechas bloqueadas
/// </summary>
public class EmployeeWorkingHoursDto : Business.WorkingHoursDto
{
    /// <summary>
    /// Lista de fechas bloqueadas en formato YYYY-MM-DD
    /// </summary>
    public List<string> BlockedDates { get; set; } = new();
}