using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Interfaces
{
    public interface IEmployeeService
    {
        Task<IEnumerable<EmployeeDto>> GetByBusinessIdAsync(Guid businessId);
        Task<EmployeeDto?> GetByIdAsync(Guid id);
        Task<IEnumerable<EmployeeDto>> GetEmployeesByUserIdAsync(Guid userId);
        Task<EmployeeDto> CreateAsync(Guid businessId, Guid ownerId, CreateEmployeeDto dto, byte[]? photoData = null);
        Task<EmployeeDto> UpdateAsync(Guid id, Guid ownerId, UpdateEmployeeDto dto, byte[]? photoData = null);
        Task DeleteAsync(Guid id, Guid ownerId);
        
        // Invitation methods
        Task<InvitationResponseDto> GenerateInvitationAsync(Guid employeeId, Guid ownerId);
        Task<AcceptInvitationResponseDto> AcceptInvitationAsync(AcceptInvitationDto dto);
        Task<AcceptInvitationResponseDto> AcceptInvitationByCodeAsync(string code, Guid userId);
        Task<Employee?> GetByInvitationTokenAsync(string token);
        Task<EmployeeDto?> GetByUserIdAndBusinessIdAsync(Guid userId, Guid businessId);
    }
}