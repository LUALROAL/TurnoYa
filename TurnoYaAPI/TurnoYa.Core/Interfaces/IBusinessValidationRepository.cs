using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces;

public interface IBusinessValidationRepository
{
    Task<BusinessValidation> CreateAsync(BusinessValidation validation);
    Task<IEnumerable<BusinessValidation>> GetByAppointmentIdAsync(Guid appointmentId);
    Task<IEnumerable<BusinessValidation>> GetByBusinessIdAsync(Guid businessId);
    Task<BusinessValidation?> GetByIdAsync(Guid id);
}