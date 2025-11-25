namespace TurnoYa.Core.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public int NoShowCount { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public DateTime? BlockUntil { get; set; }
    public decimal AverageRating { get; set; }
    public int CompletedAppointments { get; set; }
    public DateTime? LastLogin { get; set; }

    public ICollection<Business> OwnedBusinesses { get; set; } = new List<Business>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}