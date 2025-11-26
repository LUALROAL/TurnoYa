namespace TurnoYa.Application.DTOs.Employee;

/// <summary>
/// DTO para actualizar un empleado
/// </summary>
public class UpdateEmployeeDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Position { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public bool? IsActive { get; set; }
}
