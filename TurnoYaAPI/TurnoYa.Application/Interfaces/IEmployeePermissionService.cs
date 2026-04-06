using System;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Employee;

namespace TurnoYa.Application.Interfaces
{
    public interface IEmployeePermissionService
    {
        Task<EmployeePermissionsDto?> GetPermissionsAsync(Guid employeeId);
        Task<EmployeePermissionsDto> UpdatePermissionsAsync(Guid employeeId, UpdateEmployeePermissionsDto dto);
        Task<bool> HasPermissionAsync(Guid employeeId, string permission);
    }
}
