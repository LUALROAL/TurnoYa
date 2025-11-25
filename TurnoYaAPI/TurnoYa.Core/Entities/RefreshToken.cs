namespace TurnoYa.Core.Entities;

/// <summary>
/// Entidad para almacenar refresh tokens de autenticación
/// </summary>
public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    // Navegación
    public User? User { get; set; }
}
