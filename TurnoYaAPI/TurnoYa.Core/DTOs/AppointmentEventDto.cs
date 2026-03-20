namespace TurnoYa.Core.DTOs;

/// <summary>
/// Tipos de eventos de cita para SignalR.
/// </summary>
public enum AppointmentEventType
{
    Created,
    Confirmed,
    Cancelled,
    Completed,
    NoShow
}

/// <summary>
/// DTO para eventos de cita broadcasteados via SignalR.
/// Usado por IHubContext para enviar eventos en tiempo real a clientes.
/// </summary>
public class AppointmentEventDto
{
    public Guid AppointmentId { get; init; }
    public AppointmentEventType EventType { get; init; }
    public Guid CustomerId { get; init; }
    public Guid BusinessId { get; init; }
    public string BusinessName { get; init; } = string.Empty;
    public string ServiceName { get; init; } = string.Empty;
    public DateTime ScheduledDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Reason { get; init; }

    public AppointmentEventDto() { }

    public AppointmentEventDto(
        Guid appointmentId,
        AppointmentEventType eventType,
        Guid customerId,
        Guid businessId,
        string businessName,
        string serviceName,
        DateTime scheduledDate,
        string status,
        string? reason = null)
    {
        AppointmentId = appointmentId;
        EventType = eventType;
        CustomerId = customerId;
        BusinessId = businessId;
        BusinessName = businessName;
        ServiceName = serviceName;
        ScheduledDate = scheduledDate;
        Status = status;
        Reason = reason;
    }
}
