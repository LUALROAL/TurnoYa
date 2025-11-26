using FluentValidation;
using TurnoYa.Application.DTOs.Employee;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para CreateEmployeeDto
/// </summary>
public class CreateEmployeeDtoValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("El nombre es requerido")
            .Length(2, 50).WithMessage("El nombre debe tener entre 2 y 50 caracteres");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("El apellido es requerido")
            .Length(2, 50).WithMessage("El apellido debe tener entre 2 y 50 caracteres");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El formato del email no es válido")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .Matches(@"^[0-9]{7,15}$").WithMessage("El teléfono debe contener entre 7 y 15 dígitos")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.Position)
            .MaximumLength(100).WithMessage("El cargo no puede exceder 100 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Position));

        RuleFor(x => x.Bio)
            .MaximumLength(500).WithMessage("La biografía no puede exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Bio));

        RuleFor(x => x.ProfilePictureUrl)
            .Must(BeAValidUrl).WithMessage("La URL de la foto de perfil no es válida")
            .When(x => !string.IsNullOrEmpty(x.ProfilePictureUrl));
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}
