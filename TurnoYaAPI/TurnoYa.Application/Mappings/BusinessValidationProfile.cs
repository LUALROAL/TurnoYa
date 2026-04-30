using AutoMapper;
using TurnoYa.Application.DTOs.BusinessValidation;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Mappings;

public class BusinessValidationProfile : Profile
{
    public BusinessValidationProfile()
    {
        CreateMap<BusinessValidation, BusinessValidationDto>();
        CreateMap<CreateBusinessValidationDto, BusinessValidation>();
    }
}
