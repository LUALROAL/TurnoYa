using System;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces
{
    public interface IEmployeeScheduleRepository
    {
        Task<EmployeeSchedule?> GetByEmployeeIdAsync(Guid employeeId);
        Task AddAsync(EmployeeSchedule schedule);
        Task UpdateAsync(EmployeeSchedule schedule);
        Task DeleteAsync(EmployeeSchedule schedule);
    }
}
