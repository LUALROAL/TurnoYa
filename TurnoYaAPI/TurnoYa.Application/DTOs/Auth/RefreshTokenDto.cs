namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para renovar tokens de acceso
/// </summary>
public class RefreshTokenDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
