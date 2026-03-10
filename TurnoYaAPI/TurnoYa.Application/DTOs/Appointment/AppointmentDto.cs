using TurnoYa.Core.Entities;

namespace TurnoYa.Application.DTOs.Appointment;

/// <summary>
/// DTO para representar una cita
/// </summary>
public class AppointmentDto
{
    public Guid Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? ClientPhotoUrl { get; set; }
    public string? ClientPhotoBase64 { get; set; }
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public Guid? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public string? EmployeePhotoUrl { get; set; }
    public string? EmployeePhotoBase64 { get; set; }
    public DateTime ScheduledDate { get; set; }
    public DateTime EndDate { get; set; }
    public AppointmentStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositAmount { get; set; }
    public bool DepositPaid { get; set; }
    public string? Notes { get; set; }
}
