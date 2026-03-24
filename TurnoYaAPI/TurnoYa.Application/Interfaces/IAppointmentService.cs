using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Appointment;

namespace TurnoYa.Application.Interfaces
{
    public interface IAppointmentService
    {
        Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto, Guid userId);
        Task<AppointmentDto?> GetByIdAsync(Guid id, Guid requesterId);
        Task<IEnumerable<AppointmentDto>> GetMyAsync(Guid userId, DateTime? from = null, DateTime? to = null);
        Task<IEnumerable<AppointmentDto>> GetBusinessAsync(Guid businessId, Guid ownerId, DateTime? from = null, DateTime? to = null);
        Task<bool> ConfirmAsync(Guid id, Guid ownerId);
        Task<bool> CancelAsync(Guid id, Guid requesterId, string? reason);
        Task<bool> CompleteAsync(Guid id, Guid ownerId);
        Task<bool> MarkNoShowAsync(Guid id, Guid ownerId);
    }
}
