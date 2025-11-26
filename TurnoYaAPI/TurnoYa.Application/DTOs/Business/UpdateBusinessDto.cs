namespace TurnoYa.Application.DTOs.Business;

/// <summary>
/// DTO para actualizar un negocio existente
/// </summary>
public class UpdateBusinessDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Department { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool? IsActive { get; set; }
}
