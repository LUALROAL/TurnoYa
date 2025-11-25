namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO de respuesta para autenticación exitosa
/// </summary>
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; } // En segundos
    public UserDto User { get; set; } = null!;
}
