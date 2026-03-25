namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para vincular una cuenta existente con Google
/// </summary>
public class LinkGoogleDto
{
    /// <summary>
    /// ID Token recibido del cliente móvil tras autenticarse con Google
    /// </summary>
    public string IdToken { get; set; } = string.Empty;
}