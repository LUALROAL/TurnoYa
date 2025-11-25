namespace TurnoYa.Core.Entities;

public class Business : BaseEntity
{
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Country { get; set; } = "CO";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsVerified { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public string SubscriptionPlan { get; set; } = "Free";
    public string SubscriptionStatus { get; set; } = "Active";
    public DateTime? TrialEnds { get; set; }

    public User? Owner { get; set; }
    public BusinessSettings? Settings { get; set; }
    public ICollection<Service> Services { get; set; } = new List<Service>();
    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}