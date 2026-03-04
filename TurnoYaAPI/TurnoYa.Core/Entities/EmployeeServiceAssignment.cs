namespace TurnoYa.Core.Entities;

public class EmployeeServiceAssignment
{
    public Guid EmployeeId { get; set; }
    public Guid ServiceId { get; set; }

    public Employee Employee { get; set; } = null!;
    public Service Service { get; set; } = null!;
}