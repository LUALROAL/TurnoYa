namespace TurnoYa.Application.DTOs.Service;

/// <summary>
/// DTO para representar un servicio
/// </summary>
public class ServiceDto
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int Duration { get; set; }
    public bool RequiresDeposit { get; set; }
    public decimal? DepositAmount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
