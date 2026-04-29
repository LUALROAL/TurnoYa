using System;

namespace TurnoYa.Core.Entities;

public class BusinessValidation : BaseEntity
{
    public Guid BusinessId { get; set; }
    public Guid UserId { get; set; }
    public Guid AppointmentId { get; set; }
    public bool KnowsBusiness { get; set; }
    public int? Rating { get; set; } // 1-5
    
    // Navigation properties
    public Business? Business { get; set; }
    public User? User { get; set; }
    public Appointment? Appointment { get; set; }
}