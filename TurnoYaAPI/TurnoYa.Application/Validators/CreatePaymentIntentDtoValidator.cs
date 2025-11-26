using FluentValidation;
using TurnoYa.Application.DTOs.Payment;

namespace TurnoYa.Application.Validators;

public class CreatePaymentIntentDtoValidator : AbstractValidator<CreatePaymentIntentDto>
{
    public CreatePaymentIntentDtoValidator()
    {
        RuleFor(x => x.AppointmentId)
            .NotEmpty().WithMessage("AppointmentId es requerido");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount debe ser mayor a 0");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency es requerido")
            .Length(3).WithMessage("Currency debe tener 3 caracteres");

        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("PaymentMethod es requerido");
    }
}
