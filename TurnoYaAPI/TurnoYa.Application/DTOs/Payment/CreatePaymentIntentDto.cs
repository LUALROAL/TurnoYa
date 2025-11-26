namespace TurnoYa.Application.DTOs.Payment;

public class CreatePaymentIntentDto
{
    public Guid AppointmentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "COP";
    public string PaymentMethod { get; set; } = "Wompi";
}
