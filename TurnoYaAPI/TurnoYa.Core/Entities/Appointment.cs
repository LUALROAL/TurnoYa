namespace TurnoYa.Core.Entities;

public enum AppointmentStatus { Pending, Confirmed, Completed, Cancelled, NoShow }
public enum PaymentMethod { Wompi, Cash }
public enum PaymentStatus { Pending, Paid, Unpaid, Refunded, PartiallyRefunded }

public class Appointment : BaseEntity
{
    public string ReferenceNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid BusinessId { get; set; }
    public Guid ServiceId { get; set; }
    public Guid? EmployeeId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public DateTime EndDate { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public PaymentMethod? PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public decimal TotalAmount { get; set; }
    public decimal DepositAmount { get; set; }
    public bool DepositPaid { get; set; }
    public string? Notes { get; set; }
    public string? WompiTransactionId { get; set; }
    public string? WompiReference { get; set; }
    public bool ReminderSent { get; set; }
    public bool ConfirmationSent { get; set; }

    public User? User { get; set; }
    public Business? Business { get; set; }
    public Service? Service { get; set; }
    public Employee? Employee { get; set; }
    public WompiTransaction? WompiTransaction { get; set; }
    public Review? Review { get; set; }
    public ICollection<AppointmentStatusHistory> StatusHistory { get; set; } = new List<AppointmentStatusHistory>();
}