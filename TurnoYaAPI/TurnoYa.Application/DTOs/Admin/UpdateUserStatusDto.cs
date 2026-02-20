namespace TurnoYa.Application.DTOs.Admin;

/// <summary>
/// DTO para actualizar estado de usuario (bloquear/desbloquear)
/// </summary>
public class UpdateUserStatusDto
{
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public DateTime? BlockUntil { get; set; }
}
