using FluentValidation;
using TurnoYa.Application.DTOs.Auth;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para ChangePasswordDto
/// </summary>
public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordDtoValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("La contraseña actual es requerida")
            .MinimumLength(8).WithMessage("La contraseña actual debe tener al menos 8 caracteres");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("La contraseña nueva es requerida")
            .MinimumLength(8).WithMessage("La contraseña nueva debe tener al menos 8 caracteres")
            .Must(pass => HasUpperCase(pass)).WithMessage("La contraseña debe contener al menos una mayúscula")
            .Must(pass => HasLowerCase(pass)).WithMessage("La contraseña debe contener al menos una minúscula")
            .Must(pass => HasDigit(pass)).WithMessage("La contraseña debe contener al menos un dígito");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Debe confirmar la contraseña")
            .Equal(x => x.NewPassword).WithMessage("Las contraseñas no coinciden");

        RuleFor(x => x.NewPassword)
            .NotEqual(x => x.CurrentPassword).WithMessage("La contraseña nueva debe ser diferente de la actual");
    }

    private static bool HasUpperCase(string password) => password.Any(char.IsUpper);
    private static bool HasLowerCase(string password) => password.Any(char.IsLower);
    private static bool HasDigit(string password) => password.Any(char.IsDigit);
}
