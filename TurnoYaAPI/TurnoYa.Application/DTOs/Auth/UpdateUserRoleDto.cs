using System.ComponentModel.DataAnnotations;

namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para actualizar el rol de un usuario
/// </summary>
public class UpdateUserRoleDto
{
    /// <summary>
    /// Nuevo rol del usuario (Customer, BusinessOwner, Employee, Admin)
    /// </summary>
    [Required(ErrorMessage = "El rol es requerido")]
    [RegularExpression("^(Customer|BusinessOwner|Employee|Admin)$", 
        ErrorMessage = "El rol debe ser: Customer, BusinessOwner, Employee o Admin")]
    public string Role { get; set; } = string.Empty;
}
