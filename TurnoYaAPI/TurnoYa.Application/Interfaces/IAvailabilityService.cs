using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Availability;

namespace TurnoYa.Application.Interfaces
{
    public interface IAvailabilityService
    {
        Task<AvailabilityResponseDto> GetAvailableSlotsAsync(Guid businessId, Guid serviceId, Guid? employeeId, DateTime date, Guid? userId = null);
        Task<List<string>> GetAvailableDaysAsync(Guid businessId, Guid serviceId, Guid? employeeId, DateTime from, DateTime to, Guid? userId = null);
    }
}