using System;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.BusinessValidation;

namespace TurnoYa.Application.Interfaces;

public interface IBusinessValidationService
{
    Task<BusinessValidationDto> CreateValidationAsync(CreateBusinessValidationDto dto, Guid userId);
    Task<BusinessCertificationResultDto> CalculateCertificationAsync(Guid businessId);
}