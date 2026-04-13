using Microsoft.AspNetCore.SignalR;
using TurnoYa.API.Hubs;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.DTOs;

namespace TurnoYa.API.Services;

/// <summary>
/// Implementación de INotificationsService usando IHubContext para broadcasting via SignalR.
/// Vive en la capa API porque es el punto de entrada para SignalR.
/// Usa fire-and-forget pattern para no bloquear las transacciones principales.
/// </summary>
public class NotificationsService : INotificationsService
{
    private readonly IHubContext<NotificationsHub> _hubContext;
    private readonly ILogger<NotificationsService> _logger;

    public NotificationsService(
        IHubContext<NotificationsHub> hubContext,
        ILogger<NotificationsService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task BroadcastToUserAsync(Guid userId, AppointmentEventDto eventDto)
    {
        try
        {
            var groupName = $"user:{userId}";
            await _hubContext.Clients.Group(groupName).SendAsync(
                GetEventMethodName(eventDto.EventType),
                eventDto);

            _logger.LogDebug("Broadcasted {EventType} to user {UserId}", 
                eventDto.EventType, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast {EventType} to user {UserId}", 
                eventDto.EventType, userId);
        }
    }

    /// <inheritdoc />
    public async Task BroadcastToBusinessAsync(Guid businessId, AppointmentEventDto eventDto)
    {
        try
        {
            var groupName = $"business:{businessId}";
            await _hubContext.Clients.Group(groupName).SendAsync(
                GetEventMethodName(eventDto.EventType),
                eventDto);

            _logger.LogDebug("Broadcasted {EventType} to business {BusinessId}", 
                eventDto.EventType, businessId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast {EventType} to business {BusinessId}", 
                eventDto.EventType, businessId);
        }
    }

    /// <inheritdoc />
    public async Task BroadcastToBothAsync(Guid userId, Guid businessId, AppointmentEventDto eventDto)
    {
        // Enviar a ambos grupos en paralelo (fire-and-forget async)
        var userTask = BroadcastToUserAsync(userId, eventDto);
        var businessTask = BroadcastToBusinessAsync(businessId, eventDto);

        await Task.WhenAll(userTask, businessTask);
    }

    /// <summary>
    /// Obtiene el nombre del método SignalR según el tipo de evento.
    /// El cliente Ionic escucha estos métodos en el HubConnection.
    /// </summary>
    private static string GetEventMethodName(AppointmentEventType eventType)
    {
        return eventType switch
        {
            AppointmentEventType.Created => "AppointmentCreated",
            AppointmentEventType.Confirmed => "AppointmentConfirmed",
            AppointmentEventType.Cancelled => "AppointmentCancelled",
            AppointmentEventType.Completed => "AppointmentCompleted",
            AppointmentEventType.NoShow => "AppointmentNoShow",
            _ => throw new ArgumentOutOfRangeException(nameof(eventType), eventType, "Tipo de evento desconocido")
        };
    }

    /// <inheritdoc />
    public async Task BroadcastEmployeeEventAsync(Guid userId, EmployeeEventDto eventDto)
    {
        try
        {
            var signalREventName = eventDto.EventType switch
            {
                EmployeeEventType.Linked => "EmployeeLinked",
                EmployeeEventType.Unlinked => "EmployeeUnlinked",
                _ => throw new ArgumentOutOfRangeException(nameof(eventDto.EventType), eventDto.EventType, "Tipo de evento desconocido")
            };

            // Usar Clients.User() para enviar directamente al usuario por su ID
            await _hubContext.Clients.User(userId.ToString()).SendAsync(signalREventName, eventDto);

            _logger.LogDebug("Broadcasted employee event {EventType} to user {UserId}", 
                eventDto.EventType, userId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast employee event to user {UserId}", 
                userId);
        }
    }

    /// <inheritdoc />
    public async Task BroadcastEmployeeEventToBusinessAsync(Guid businessId, EmployeeEventDto eventDto)
    {
        try
        {
            var signalREventName = eventDto.EventType switch
            {
                EmployeeEventType.Linked => "EmployeeLinked",
                EmployeeEventType.Unlinked => "EmployeeUnlinked",
                _ => throw new ArgumentOutOfRangeException(nameof(eventDto.EventType), eventDto.EventType, "Tipo de evento desconocido")
            };

            // Enviar al grupo del negocio (todos los usuarios conectados a ese negocio, incluyendo el owner)
            var groupName = $"business:{businessId}";
            await _hubContext.Clients.Group(groupName).SendAsync(signalREventName, eventDto);

            _logger.LogDebug("Broadcasted employee event {EventType} to business {BusinessId}", 
                eventDto.EventType, businessId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast employee event to business {BusinessId}", 
                businessId);
        }
    }
}
