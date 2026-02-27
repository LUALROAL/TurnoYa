using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces
{
    public interface IAppointmentRepository
    {
        Task<Appointment?> GetByIdAsync(Guid id);
        Task<IEnumerable<Appointment>> GetByUserIdAsync(Guid userId, DateTime? from = null, DateTime? to = null);
        Task<IEnumerable<Appointment>> GetByBusinessIdAsync(Guid businessId, DateTime? from = null, DateTime? to = null);
        Task<bool> HasConflictAsync(Guid serviceId, DateTime start, DateTime end, Guid? excludeAppointmentId = null);
        Task<Appointment> AddAsync(Appointment appointment);
        Task UpdateAsync(Appointment appointment);
        Task<bool> ExistsAsync(Guid id);
    }
}