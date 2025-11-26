namespace TurnoYa.Application.DTOs.Appointment;

/// <summary>
/// DTO para representar un slot de tiempo disponible
/// </summary>
public class TimeSlotDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsAvailable { get; set; }
    public string? Reason { get; set; }
}
