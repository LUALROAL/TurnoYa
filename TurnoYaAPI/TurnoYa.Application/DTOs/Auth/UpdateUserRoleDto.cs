using System.ComponentModel.DataAnnotations;

namespace TurnoYa.Application.DTOs.Auth;

/// <summary>
/// DTO para actualizar el rol de un usuario
/// </summary>
public class UpdateUserRoleDto
{
    /// <summary>
    /// Nuevo rol del usuario (Customer, OwnerBusiness, Employee, Admin)
    /// </summary>
    [Required(ErrorMessage = "El rol es requerido")]
    [RegularExpression("^(Customer|OwnerBusiness|Employee|Admin)$", 
        ErrorMessage = "El rol debe ser: Customer, OwnerBusiness, Employee o Admin")]
    public string Role { get; set; } = string.Empty;
}
