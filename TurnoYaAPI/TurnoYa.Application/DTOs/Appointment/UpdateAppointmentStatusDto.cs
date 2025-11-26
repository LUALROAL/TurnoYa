using TurnoYa.Core.Entities;

namespace TurnoYa.Application.DTOs.Appointment;

/// <summary>
/// DTO para actualizar el estado de una cita
/// </summary>
public class UpdateAppointmentStatusDto
{
    public AppointmentStatus Status { get; set; }
    public string? Reason { get; set; }
}
