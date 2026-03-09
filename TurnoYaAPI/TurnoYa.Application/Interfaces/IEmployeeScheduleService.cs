using System;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Employee;

namespace TurnoYa.Application.Interfaces
{
    public interface IEmployeeScheduleService
    {
        Task<EmployeeWorkingHoursDto?> GetByEmployeeIdAsync(Guid employeeId);
        Task CreateAsync(Guid employeeId, EmployeeWorkingHoursDto dto);
        Task UpdateAsync(Guid employeeId, EmployeeWorkingHoursDto dto);
        Task DeleteAsync(Guid employeeId);
    }
}
