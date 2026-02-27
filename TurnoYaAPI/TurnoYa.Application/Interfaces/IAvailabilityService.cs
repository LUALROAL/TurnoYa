using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Availability;

namespace TurnoYa.Application.Interfaces
{
    public interface IAvailabilityService
    {
        /// <summary>
        /// Obtiene los horarios disponibles para una fecha, servicio y opcionalmente empleado.
        /// </summary>
        /// <param name="businessId">ID del negocio</param>
        /// <param name="serviceId">ID del servicio</param>
        /// <param name="employeeId">ID del empleado (opcional)</param>
        /// <param name="date">Fecha en formato YYYY-MM-DD</param>
        /// <returns>Lista de horarios disponibles en formato HH:mm</returns>
        Task<AvailabilityResponseDto> GetAvailableSlotsAsync(Guid businessId, Guid serviceId, Guid? employeeId, DateTime date);
    }
}