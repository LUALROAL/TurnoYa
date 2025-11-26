namespace TurnoYa.Application.DTOs.Payment;

public class PaymentDto
{
    public string Id { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "COP";
    public string Status { get; set; } = "PENDING";
    public string PaymentMethod { get; set; } = "Wompi";
}
