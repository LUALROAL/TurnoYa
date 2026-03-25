namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para iniciar sesión o registrarse con Google
/// </summary>
public class GoogleLoginDto
{
    /// <summary>
    /// ID Token recibido del cliente móvil tras autenticarse con Google
    /// </summary>
    public string IdToken { get; set; } = string.Empty;

    /// <summary>
    /// Nombre completo del usuario (opcional, proviene de Google)
    /// </summary>
    public string? FullName { get; set; }

    /// <summary>
    /// Primer nombre (given name) del usuario
    /// </summary>
    public string? GivenName { get; set; }

    /// <summary>
    /// Apellido (family name) del usuario
    /// </summary>
    public string? FamilyName { get; set; }

    /// <summary>
    /// URL de la foto de perfil del usuario
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Fecha de aceptación de términos y condiciones (enviada desde el cliente)
    /// </summary>
    public DateTime? TermsAcceptedAt { get; set; }
}