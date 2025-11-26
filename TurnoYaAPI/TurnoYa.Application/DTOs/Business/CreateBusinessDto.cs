namespace TurnoYa.Application.DTOs.Business;

/// <summary>
/// DTO para crear un nuevo negocio
/// </summary>
public class CreateBusinessDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}
