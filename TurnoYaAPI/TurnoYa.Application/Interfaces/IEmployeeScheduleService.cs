using System;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.Application.Interfaces
{
    public interface IEmployeeScheduleService
    {
        Task<WorkingHoursDto?> GetByEmployeeIdAsync(Guid employeeId);
        Task CreateAsync(Guid employeeId, WorkingHoursDto dto);
        Task UpdateAsync(Guid employeeId, WorkingHoursDto dto);
        Task DeleteAsync(Guid employeeId);
    }
}
