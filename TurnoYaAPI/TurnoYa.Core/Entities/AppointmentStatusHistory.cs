namespace TurnoYa.Core.Entities;

public class AppointmentStatusHistory : BaseEntity
{
    public Guid AppointmentId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty; // User | Business | System
    public string? Reason { get; set; }

    public Appointment? Appointment { get; set; }
}