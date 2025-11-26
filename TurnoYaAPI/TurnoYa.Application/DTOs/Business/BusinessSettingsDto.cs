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
    public int BookingAdvanceDays { get; set; } = 30;

    /// <summary>
    /// Horas mínimas de anticipación para cancelar sin penalización (ej: 24 horas)
    /// </summary>
    public int CancellationHours { get; set; } = 24;

    /// <summary>
    /// Indica si el negocio requiere depósito para reservas
    /// </summary>
    public bool RequiresDeposit { get; set; } = false;

    /// <summary>
    /// Política de no-show del negocio
    /// </summary>
    public string? NoShowPolicy { get; set; }

    /// <summary>
    /// Duración del slot por defecto en minutos (ej: 30 min)
    /// </summary>
    public int DefaultSlotDuration { get; set; } = 30;

    /// <summary>
    /// Tiempo de buffer entre citas en minutos (ej: 5 min)
    /// </summary>
    public int BufferTimeBetweenAppointments { get; set; } = 0;
}
