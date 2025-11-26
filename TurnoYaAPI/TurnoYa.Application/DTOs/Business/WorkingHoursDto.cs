namespace TurnoYa.Application.DTOs.Business;

/// <summary>
/// DTO para representar los horarios de un día específico
/// </summary>
public class DayScheduleDto
{
    /// <summary>
    /// Indica si el negocio está abierto este día
    /// </summary>
    public bool IsOpen { get; set; }

    /// <summary>
    /// Hora de apertura (formato HH:mm, ej: "09:00")
    /// </summary>
    public string? OpenTime { get; set; }

    /// <summary>
    /// Hora de cierre (formato HH:mm, ej: "18:00")
    /// </summary>
    public string? CloseTime { get; set; }

    /// <summary>
    /// Hora de inicio de descanso/almuerzo (opcional)
    /// </summary>
    public string? BreakStartTime { get; set; }

    /// <summary>
    /// Hora de fin de descanso/almuerzo (opcional)
    /// </summary>
    public string? BreakEndTime { get; set; }
}

/// <summary>
/// DTO para representar todos los horarios de trabajo de la semana
/// </summary>
public class WorkingHoursDto
{
    public DayScheduleDto Monday { get; set; } = new();
    public DayScheduleDto Tuesday { get; set; } = new();
    public DayScheduleDto Wednesday { get; set; } = new();
    public DayScheduleDto Thursday { get; set; } = new();
    public DayScheduleDto Friday { get; set; } = new();
    public DayScheduleDto Saturday { get; set; } = new();
    public DayScheduleDto Sunday { get; set; } = new();
}
