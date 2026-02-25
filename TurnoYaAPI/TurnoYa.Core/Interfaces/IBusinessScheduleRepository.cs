using System;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces
{
    public interface IBusinessScheduleRepository
    {
        Task<BusinessSchedule?> GetByBusinessIdAsync(Guid businessId);
        Task AddAsync(BusinessSchedule schedule);
        Task UpdateAsync(BusinessSchedule schedule);
        Task DeleteAsync(BusinessSchedule schedule);
    }
}
