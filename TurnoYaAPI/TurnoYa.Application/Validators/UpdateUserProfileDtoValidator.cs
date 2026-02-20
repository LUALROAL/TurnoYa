using FluentValidation;
using TurnoYa.Application.DTOs.Auth;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para UpdateUserProfileDto
/// </summary>
public class UpdateUserProfileDtoValidator : AbstractValidator<UpdateUserProfileDto>
{
    public UpdateUserProfileDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .MaximumLength(50).WithMessage("El nombre no puede exceder 50 caracteres")
            .When(x => !string.IsNullOrEmpty(x.FirstName));

        RuleFor(x => x.LastName)
            .MaximumLength(50).WithMessage("El apellido no puede exceder 50 caracteres")
            .When(x => !string.IsNullOrEmpty(x.LastName));

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\d{7,15}$").WithMessage("El número de teléfono debe contener entre 7 y 15 dígitos")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

        RuleFor(x => x.Phone)
            .Matches(@"^\d{7,15}$").WithMessage("El teléfono debe contener entre 7 y 15 dígitos")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        RuleFor(x => x.PhotoUrl)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("La URL de la foto no es válida")
            .When(x => !string.IsNullOrEmpty(x.PhotoUrl));

        RuleFor(x => x.DateOfBirth)
            .Must(date => date < DateTime.UtcNow.AddYears(-13))
            .WithMessage("El usuario debe tener al menos 13 años")
            .When(x => x.DateOfBirth.HasValue);

        RuleFor(x => x.Gender)
            .Must(g => g == null || new[] { "M", "F", "Other" }.Contains(g))
            .WithMessage("El género debe ser M, F u Other")
            .When(x => !string.IsNullOrEmpty(x.Gender));
    }
}
