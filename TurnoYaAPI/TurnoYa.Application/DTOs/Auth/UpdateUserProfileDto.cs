namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para actualizar información del perfil de usuario
/// </summary>
public class UpdateUserProfileDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
}
