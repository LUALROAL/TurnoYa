namespace TurnoYa.Application.DTOs.Business;

public class BusinessImageDto
{
    public Guid Id { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
