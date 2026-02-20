namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO con información completa del perfil de usuario
/// </summary>
public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string? PhotoUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLogin { get; set; }
    public decimal AverageRating { get; set; }
    public int CompletedAppointments { get; set; }
    public DateTime CreatedAt { get; set; }
}
