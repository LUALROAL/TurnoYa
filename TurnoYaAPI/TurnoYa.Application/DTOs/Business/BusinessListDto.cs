namespace TurnoYa.Application.DTOs.Business;

/// <summary>
/// DTO para listados de negocios (versión simplificada)
/// </summary>
public class BusinessListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public bool IsActive { get; set; }
    public decimal? Distance { get; set; } // En kilómetros
}
