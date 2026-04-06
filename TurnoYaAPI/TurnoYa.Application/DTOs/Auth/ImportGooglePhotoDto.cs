namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para importar la foto de Google al perfil del usuario
/// </summary>
public class ImportGooglePhotoDto
{
    public string GooglePhotoUrl { get; set; } = string.Empty;
}
