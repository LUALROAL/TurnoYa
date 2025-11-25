namespace TurnoYa.Core.Entities;

public class WompiTransaction : BaseEntity
{
    public Guid AppointmentId { get; set; }
    public string WompiId { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "COP";
    public string Status { get; set; } = string.Empty; // PENDING | APPROVED | DECLINED | ERROR | VOIDED
    public string? PaymentMethodType { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerName { get; set; }
    public bool WebhookReceived { get; set; }
    public string? WebhookData { get; set; }

    public Appointment? Appointment { get; set; }
}