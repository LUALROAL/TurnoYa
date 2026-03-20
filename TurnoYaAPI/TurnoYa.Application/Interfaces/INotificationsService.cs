using TurnoYa.Core.DTOs;

namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Servicio para broadcasting de eventos de citas via SignalR.
/// Los servicios de dominio (ej: AppointmentService) injectan IHubContext 
/// pero este servicio proporciona una abstraccion adicional para testing y flexibilidad.
/// </summary>
public interface INotificationsService
{
    /// <summary>
    /// Envía un evento a un usuario especifico (grupo user:{userId}).
    /// </summary>
    /// <param name="userId">ID del usuario destino</param>
    /// <param name="event">Evento de cita a enviar</param>
    Task BroadcastToUserAsync(Guid userId, AppointmentEventDto eventDto);

    /// <summary>
    /// Envía un evento a un negocio especifico (grupo business:{businessId}).
    /// </summary>
    /// <param name="businessId">ID del negocio destino</param>
    /// <param name="event">Evento de cita a enviar</param>
    Task BroadcastToBusinessAsync(Guid businessId, AppointmentEventDto eventDto);

    /// <summary>
    /// Envía un evento a multiples grupos (usuario y negocio).
    /// Usado cuando ambos deben recibir el evento (Created, Cancelled, Completed, NoShow).
    /// </summary>
    /// <param name="userId">ID del usuario</param>
    /// <param name="businessId">ID del negocio</param>
    /// <param name="event">Evento de cita a enviar</param>
    Task BroadcastToBothAsync(Guid userId, Guid businessId, AppointmentEventDto eventDto);
}
