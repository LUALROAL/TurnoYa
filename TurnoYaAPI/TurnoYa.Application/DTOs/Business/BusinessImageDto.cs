namespace TurnoYa.Application.DTOs.Business;

public class BusinessImageDto
{
    public Guid Id { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public string? ImageBase64 { get; set; } // Nueva propiedad para base64
    public DateTime CreatedAt { get; set; }
}
