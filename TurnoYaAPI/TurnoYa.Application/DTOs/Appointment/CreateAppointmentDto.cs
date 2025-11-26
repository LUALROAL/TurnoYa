namespace TurnoYa.Application.DTOs.Appointment;

/// <summary>
/// DTO para crear una cita
/// </summary>
public class CreateAppointmentDto
{
    public Guid BusinessId { get; set; }
    public Guid ServiceId { get; set; }
    public Guid? EmployeeId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string? Notes { get; set; }
}
