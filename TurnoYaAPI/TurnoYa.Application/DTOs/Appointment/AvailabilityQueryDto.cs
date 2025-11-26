namespace TurnoYa.Application.DTOs.Appointment;

/// <summary>
/// DTO para consultar disponibilidad de citas
/// </summary>
public class AvailabilityQueryDto
{
    public Guid BusinessId { get; set; }
    public Guid ServiceId { get; set; }
    public Guid? EmployeeId { get; set; }
    public DateTime Date { get; set; }
}
