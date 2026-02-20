namespace TurnoYa.Application.DTOs.Admin;

/// <summary>
/// DTO para listar y gestionar usuarios desde admin
/// </summary>
public class UserManageDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsActive { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public DateTime? BlockUntil { get; set; }
    public bool IsEmailVerified { get; set; }
    public decimal AverageRating { get; set; }
    public int CompletedAppointments { get; set; }
    public int NoShowCount { get; set; }
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; }
}
