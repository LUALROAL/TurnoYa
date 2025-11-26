namespace TurnoYa.Application.DTOs.Service;

/// <summary>
/// DTO para crear un nuevo servicio
/// </summary>
public class CreateServiceDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    
    /// <summary>
    /// Duración del servicio en minutos
    /// </summary>
    public int Duration { get; set; }
    
    public bool RequiresDeposit { get; set; } = false;
    public decimal? DepositAmount { get; set; }
    public bool IsActive { get; set; } = true;
}
