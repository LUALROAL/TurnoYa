namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para cambiar contraseña del usuario
/// </summary>
public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
