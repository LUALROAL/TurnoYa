using AutoMapper;
using TurnoYa.Application.DTOs.Service;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Mappings;

/// <summary>
/// Perfil de mapeo para servicios
/// </summary>
public class ServiceProfile : Profile
{
    public ServiceProfile()
    {
        // CreateServiceDto → Service
        CreateMap<CreateServiceDto, Service>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.BusinessId, opt => opt.Ignore()) // Se setea manualmente
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Business, opt => opt.Ignore())
            .ForMember(dest => dest.Appointments, opt => opt.Ignore())
            .ForMember(dest => dest.Currency, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.Ignore());

        // UpdateServiceDto → Service
        CreateMap<UpdateServiceDto, Service>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Service → ServiceDto
        CreateMap<Service, ServiceDto>();
    }
}
