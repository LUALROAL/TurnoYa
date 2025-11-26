using FluentValidation;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Validators;

/// <summary>
/// Validador para UpdateAppointmentStatusDto
/// </summary>
public class UpdateAppointmentStatusDtoValidator : AbstractValidator<UpdateAppointmentStatusDto>
{
    public UpdateAppointmentStatusDtoValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Estado de cita inválido");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("La razón es requerida para cancelaciones")
            .When(x => x.Status == AppointmentStatus.Cancelled)
            .MaximumLength(300).WithMessage("La razón no puede exceder 300 caracteres");
    }
}
