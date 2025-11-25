namespace TurnoYa.Core.Entities;

public class Service : BaseEntity
{
    public Guid BusinessId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Duration { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "COP";
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
    public bool RequiresDeposit { get; set; }
    public decimal DepositAmount { get; set; }

    public Business? Business { get; set; }
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}