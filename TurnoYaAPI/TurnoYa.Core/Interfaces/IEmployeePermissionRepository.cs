using System;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces
{
    public interface IEmployeePermissionRepository
    {
        Task<EmployeePermission?> GetByEmployeeIdAsync(Guid employeeId);
        Task<EmployeePermission> CreateAsync(EmployeePermission permission);
        Task<EmployeePermission> UpdateAsync(EmployeePermission permission);
        Task<bool> DeleteAsync(Guid employeeId);
    }
}
