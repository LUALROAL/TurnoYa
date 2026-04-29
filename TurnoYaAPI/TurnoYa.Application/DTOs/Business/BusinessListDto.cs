using System.Collections.Generic;

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
    public bool IsVerified { get; set; } // Certificación de negocios
    public decimal? Distance { get; set; } // En kilómetros
    public string? ImageBase64 { get; set; } // 👈 NUEVO: imagen en base64
    
    // NUEVO: Permisos del empleado para este negocio
    public Dictionary<string, bool>? Permissions { get; set; }
    
    // NUEVO: Tipo de relación del usuario con el negocio
    public string? RelationshipType { get; set; } // "owner" o "employee"
}
