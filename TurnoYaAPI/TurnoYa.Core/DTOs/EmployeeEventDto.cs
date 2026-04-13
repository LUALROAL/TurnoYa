namespace TurnoYa.Core.DTOs;

/// <summary>
/// Tipos de eventos de empleado para SignalR.
/// </summary>
public enum EmployeeEventType
{
    Linked,
    Unlinked
}

/// <summary>
/// DTO para eventos de empleado broadcasted via SignalR.
/// Usado para notificar en tiempo real cuando un empleado se asocia/desasocia de un negocio.
/// </summary>
public class EmployeeEventDto
{
    public Guid EmployeeId { get; init; }
    public Guid BusinessId { get; init; }
    public string BusinessName { get; init; } = string.Empty;
    public string Position { get; init; } = string.Empty;
    public EmployeeEventType EventType { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    public EmployeeEventDto() { }

    public EmployeeEventDto(
        Guid employeeId,
        Guid businessId,
        string businessName,
        string position,
        EmployeeEventType eventType)
    {
        EmployeeId = employeeId;
        BusinessId = businessId;
        BusinessName = businessName;
        Position = position;
        EventType = eventType;
        Timestamp = DateTime.UtcNow;
    }
}