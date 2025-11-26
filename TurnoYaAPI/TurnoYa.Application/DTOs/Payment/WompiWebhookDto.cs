namespace TurnoYa.Application.DTOs.Payment;

public class WompiWebhookDto
{
    public string Event { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public object? Data { get; set; }
}
