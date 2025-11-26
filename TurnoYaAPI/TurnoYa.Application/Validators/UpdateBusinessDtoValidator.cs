using FluentValidation;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para UpdateBusinessDto
/// </summary>
public class UpdateBusinessDtoValidator : AbstractValidator<UpdateBusinessDto>
{
    public UpdateBusinessDtoValidator()
    {
        RuleFor(x => x.Name)
            .Length(3, 100).WithMessage("El nombre debe tener entre 3 y 100 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Category)
            .Length(3, 50).WithMessage("La categoría debe tener entre 3 y 50 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Category));

        RuleFor(x => x.Address)
            .Length(5, 200).WithMessage("La dirección debe tener entre 5 y 200 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Address));

        RuleFor(x => x.City)
            .Length(2, 50).WithMessage("La ciudad debe tener entre 2 y 50 caracteres")
            .When(x => !string.IsNullOrEmpty(x.City));

        RuleFor(x => x.Department)
            .Length(2, 50).WithMessage("El departamento debe tener entre 2 y 50 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Department));

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
