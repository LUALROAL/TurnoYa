using FluentValidation;
using TurnoYa.Application.DTOs.Service;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para CreateServiceDto
/// </summary>
public class CreateServiceDtoValidator : AbstractValidator<CreateServiceDto>
{
    public CreateServiceDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del servicio es requerido")
            .Length(3, 100).WithMessage("El nombre debe tener entre 3 y 100 caracteres");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("La descripción no puede exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("El precio debe ser 0 o mayor");

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("La duración debe ser mayor a 0 minutos")
            .LessThanOrEqualTo(480).WithMessage("La duración no puede exceder 480 minutos (8 horas)");

        RuleFor(x => x.DepositAmount)
            .GreaterThanOrEqualTo(0).WithMessage("El monto del depósito debe ser 0 o mayor")
            .LessThanOrEqualTo(x => x.Price).WithMessage("El depósito no puede ser mayor al precio del servicio")
            .When(x => x.RequiresDeposit && x.DepositAmount.HasValue);

        RuleFor(x => x.DepositAmount)
            .NotNull().WithMessage("El monto del depósito es requerido cuando RequiresDeposit es true")
            .When(x => x.RequiresDeposit);
    }
}
