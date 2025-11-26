using FluentValidation;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para CreateBusinessDto
/// </summary>
public class CreateBusinessDtoValidator : AbstractValidator<CreateBusinessDto>
{
    public CreateBusinessDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del negocio es requerido")
            .Length(3, 100).WithMessage("El nombre debe tener entre 3 y 100 caracteres");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("La categoría es requerida")
            .Length(3, 50).WithMessage("La categoría debe tener entre 3 y 50 caracteres");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("La dirección es requerida")
            .Length(5, 200).WithMessage("La dirección debe tener entre 5 y 200 caracteres");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("La ciudad es requerida")
            .Length(2, 50).WithMessage("La ciudad debe tener entre 2 y 50 caracteres");

        RuleFor(x => x.Department)
            .NotEmpty().WithMessage("El departamento es requerido")
            .Length(2, 50).WithMessage("El departamento debe tener entre 2 y 50 caracteres");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El formato del email no es válido")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .Matches(@"^[0-9]{7,15}$").WithMessage("El teléfono debe contener entre 7 y 15 dígitos")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).WithMessage("La latitud debe estar entre -90 y 90")
            .When(x => x.Latitude.HasValue);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).WithMessage("La longitud debe estar entre -180 y 180")
            .When(x => x.Longitude.HasValue);

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("La descripción no puede exceder 1000 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Website)
            .Matches(@"^https?://.*").WithMessage("El sitio web debe comenzar con http:// o https://")
            .When(x => !string.IsNullOrEmpty(x.Website));
    }
}
