namespace TurnoYa.Application.DTOs.Business;

/// <summary>
/// DTO para la configuración de un negocio
/// </summary>
public class BusinessSettingsDto
{
    /// <summary>
    /// Horarios de trabajo del negocio (JSON)
    /// Ejemplo: { "Monday": { "Open": "09:00", "Close": "18:00", "IsOpen": true }, ... }
    /// </summary>
    public string? WorkingHours { get; set; }

    /// <summary>
    /// Días de anticipación permitidos para reservar (ej: 30 días)
    /// </summary>
    public int BookingAdvanceDays { get; set; } = 0;

    /// <summary>
    /// Horas mínimas de anticipación para cancelar sin penalización (ej: 24 horas)
    /// </summary>
    public int CancellationHours { get; set; } = 24;

    /// <summary>
    /// Tiempo de buffer entre citas en minutos (ej: 5 min)
    /// </summary>
    public int BufferTimeBetweenAppointments { get; set; } = 15;
}
