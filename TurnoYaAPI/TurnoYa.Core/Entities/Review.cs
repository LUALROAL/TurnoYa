namespace TurnoYa.Core.Entities;

public class Review : BaseEntity
{
    public Guid AppointmentId { get; set; }
    public Guid UserId { get; set; }
    public Guid BusinessId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string? BusinessReply { get; set; }
    public DateTime? RepliedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool Reported { get; set; }

    public Appointment? Appointment { get; set; }
    public Business? Business { get; set; }
    public User? User { get; set; }
}