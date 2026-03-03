using FluentValidation;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para BusinessSettingsDto
/// </summary>
public class BusinessSettingsDtoValidator : AbstractValidator<BusinessSettingsDto>
{
    public BusinessSettingsDtoValidator()
    {
        RuleFor(x => x.BookingAdvanceDays)
            .GreaterThanOrEqualTo(0).WithMessage("Los días de anticipación deben ser al menos 0")
            .LessThanOrEqualTo(365).WithMessage("Los días de anticipación no pueden exceder 365");

        RuleFor(x => x.CancellationHours)
            .GreaterThanOrEqualTo(0).WithMessage("Las horas de cancelación deben ser 0 o más")
            .LessThanOrEqualTo(168).WithMessage("Las horas de cancelación no pueden exceder 168 (7 días)");

        RuleFor(x => x.BufferTimeBetweenAppointments)
            .GreaterThanOrEqualTo(0).WithMessage("El tiempo de buffer debe ser 0 o más")
            .LessThanOrEqualTo(120).WithMessage("El tiempo de buffer no puede exceder 120 minutos");

        RuleFor(x => x.WorkingHours)
            .MaximumLength(2000).WithMessage("Los horarios de trabajo no pueden exceder 2000 caracteres")
            .When(x => !string.IsNullOrEmpty(x.WorkingHours));
    }
}
