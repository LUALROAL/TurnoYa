namespace TurnoYa.Application.DTOs.Service;

/// <summary>
/// DTO para actualizar un servicio
/// </summary>
public class UpdateServiceDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public int? Duration { get; set; }
    public bool? RequiresDeposit { get; set; }
    public decimal? DepositAmount { get; set; }
    public bool? IsActive { get; set; }
}
