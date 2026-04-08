using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces
{
    public interface IEmployeeRepository
    {
        Task<IEnumerable<Employee>> GetByBusinessIdAsync(Guid businessId);
        Task<IEnumerable<Employee>> GetByUserIdAsync(Guid userId);
        Task<Employee?> GetByIdAsync(Guid id);
        Task<Employee?> GetByInvitationTokenAsync(string token);
        Task<Employee?> GetByInvitationCodeAsync(string code);
        Task<Employee?> GetByUserIdAndBusinessIdAsync(Guid userId, Guid businessId);
        Task<Employee> AddAsync(Employee employee);
        Task<Employee> UpdateAsync(Employee employee);
        Task DeleteAsync(Guid id);
        Task<bool> ExistsAsync(Guid id);
    }
}