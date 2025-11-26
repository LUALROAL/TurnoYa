using FluentValidation;
using TurnoYa.Application.DTOs.Service;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para UpdateServiceDto
/// </summary>
public class UpdateServiceDtoValidator : AbstractValidator<UpdateServiceDto>
{
    public UpdateServiceDtoValidator()
    {
        RuleFor(x => x.Name)
            .Length(3, 100).WithMessage("El nombre debe tener entre 3 y 100 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("La descripción no puede exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("El precio debe ser 0 o mayor")
            .When(x => x.Price.HasValue);

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("La duración debe ser mayor a 0 minutos")
            .LessThanOrEqualTo(480).WithMessage("La duración no puede exceder 480 minutos (8 horas)")
            .When(x => x.Duration.HasValue);

        RuleFor(x => x.DepositAmount)
            .GreaterThanOrEqualTo(0).WithMessage("El monto del depósito debe ser 0 o mayor")
            .When(x => x.DepositAmount.HasValue);
    }
}
