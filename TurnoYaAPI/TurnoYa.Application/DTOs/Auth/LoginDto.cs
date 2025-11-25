namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para inicio de sesión
/// </summary>
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
