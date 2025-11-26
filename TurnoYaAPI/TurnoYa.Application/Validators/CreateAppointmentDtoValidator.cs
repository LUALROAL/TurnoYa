using FluentValidation;
using TurnoYa.Application.DTOs.Appointment;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para CreateAppointmentDto
/// </summary>
public class CreateAppointmentDtoValidator : AbstractValidator<CreateAppointmentDto>
{
    public CreateAppointmentDtoValidator()
    {
        RuleFor(x => x.BusinessId)
            .NotEmpty().WithMessage("El ID del negocio es requerido");

        RuleFor(x => x.ServiceId)
            .NotEmpty().WithMessage("El ID del servicio es requerido");

        RuleFor(x => x.ScheduledDate)
            .NotEmpty().WithMessage("La fecha programada es requerida")
            .Must(date => date > DateTime.UtcNow).WithMessage("La fecha debe ser futura");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("Las notas no pueden exceder 500 caracteres")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
