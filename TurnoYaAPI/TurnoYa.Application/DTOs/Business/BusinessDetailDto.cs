using TurnoYa.Application.DTOs.Auth;

namespace TurnoYa.Application.DTOs.Business;

/// <summary>
/// DTO detallado de negocio con servicios y empleados
/// </summary>
public class BusinessDetailDto
{
    public Guid Id { get; set; }
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
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Owner
    public UserDto Owner { get; set; } = null!;
    
    // Services and Employees (se agregarán sus DTOs más adelante)
    public List<object> Services { get; set; } = new();
    public List<object> Employees { get; set; } = new();
}
