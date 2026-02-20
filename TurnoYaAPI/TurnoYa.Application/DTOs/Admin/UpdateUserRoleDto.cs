namespace TurnoYa.Application.DTOs.Admin;

/// <summary>
/// DTO para actualizar el rol de un usuario
/// </summary>
public class UpdateUserRoleDto
{
    /// <summary>
    /// Nuevo rol del usuario (Customer, Owner, Admin)
    /// </summary>
    public string Role { get; set; } = string.Empty;
}
