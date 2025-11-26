using TurnoYa.Application.DTOs.Appointment;

namespace TurnoYa.Application.Interfaces;

/// <summary>
/// Servicio para calcular disponibilidad de citas
/// </summary>
public interface IAvailabilityService
{
    /// <summary>
    /// Obtiene los slots de tiempo disponibles para un servicio en una fecha específica
    /// </summary>
    Task<IEnumerable<TimeSlotDto>> GetAvailableSlotsAsync(AvailabilityQueryDto query);
}
