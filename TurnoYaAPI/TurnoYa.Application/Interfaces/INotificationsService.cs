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

    /// <summary>
    /// Envía un evento de empleado a un usuario especifico.
    /// Usado cuando un empleado se asocia/desasocia de un negocio.
    /// </summary>
    /// <param name="userId">ID del usuario destino</param>
    /// <param name="eventDto">Evento de empleado a enviar</param>
    Task BroadcastEmployeeEventAsync(Guid userId, EmployeeEventDto eventDto);

    /// <summary>
    /// Envía un evento de empleado a todos los usuarios de un negocio (grupo business).
    /// Usado cuando un empleado se vincula para notificar al owner en tiempo real.
    /// </summary>
    /// <param name="businessId">ID del negocio destino</param>
    /// <param name="eventDto">Evento de empleado a enviar</param>
    Task BroadcastEmployeeEventToBusinessAsync(Guid businessId, EmployeeEventDto eventDto);
}
