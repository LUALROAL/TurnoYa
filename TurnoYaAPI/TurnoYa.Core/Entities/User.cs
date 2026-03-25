namespace TurnoYa.Core.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Phone { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public int NoShowCount { get; set; }
    public int TotalNoShows { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public DateTime? BlockUntil { get; set; }
    public decimal AverageRating { get; set; }
    public int CompletedAppointments { get; set; }
    public DateTime? LastLogin { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public string? PhotoUrl { get; set; }
    public byte[]? PhotoData { get; set; } // 👈 NUEVO

    // Integración de Telegram
    public string? TelegramChatId { get; set; }
    public string? TelegramLinkingCode { get; set; }
    public DateTime? TelegramLinkingCodeExpiry { get; set; }

    // Integración de Google
    public string? GoogleId { get; set; }
    public string? GooglePhotoUrl { get; set; }

    // Términos y condiciones
    public DateTime? TermsAcceptedAt { get; set; }

    public ICollection<Business> OwnedBusinesses { get; set; } = new List<Business>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}