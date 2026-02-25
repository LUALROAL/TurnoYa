using System;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.Application.Interfaces
{
    public interface IBusinessScheduleService
    {
        Task<WorkingHoursDto?> GetByBusinessIdAsync(Guid businessId);
        Task CreateAsync(Guid businessId, WorkingHoursDto dto);
        Task UpdateAsync(Guid businessId, WorkingHoursDto dto);
        Task DeleteAsync(Guid businessId);
    }
}
