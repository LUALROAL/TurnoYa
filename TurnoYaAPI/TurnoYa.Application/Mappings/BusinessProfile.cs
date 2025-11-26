using AutoMapper;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Mappings;

/// <summary>
/// Perfil de mapeo para negocios
/// </summary>
public class BusinessProfile : Profile
{
    public BusinessProfile()
    {
        // CreateBusinessDto → Business
        CreateMap<CreateBusinessDto, Business>()
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src => 0m))
            .ForMember(dest => dest.TotalReviews, opt => opt.MapFrom(src => 0))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.OwnerId, opt => opt.Ignore()) // Se setea manualmente
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Owner, opt => opt.Ignore())
            .ForMember(dest => dest.Services, opt => opt.Ignore())
            .ForMember(dest => dest.Employees, opt => opt.Ignore())
            .ForMember(dest => dest.Appointments, opt => opt.Ignore())
            .ForMember(dest => dest.Reviews, opt => opt.Ignore())
            .ForMember(dest => dest.Settings, opt => opt.Ignore())
            .ForMember(dest => dest.IsVerified, opt => opt.Ignore())
            .ForMember(dest => dest.LogoUrl, opt => opt.Ignore())
            .ForMember(dest => dest.CoverPhotoUrl, opt => opt.Ignore())
            .ForMember(dest => dest.Country, opt => opt.Ignore())
            .ForMember(dest => dest.SubscriptionPlan, opt => opt.Ignore())
            .ForMember(dest => dest.SubscriptionStatus, opt => opt.Ignore())
            .ForMember(dest => dest.TrialEnds, opt => opt.Ignore());

        // UpdateBusinessDto → Business (solo actualiza campos no nulos)
        CreateMap<UpdateBusinessDto, Business>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Business → BusinessDto
        CreateMap<Business, BusinessDto>()
            .ForMember(dest => dest.OwnerName, opt => opt.MapFrom(src => 
                src.Owner != null ? $"{src.Owner.FirstName} {src.Owner.LastName}" : string.Empty));

        // Business → BusinessListDto
        CreateMap<Business, BusinessListDto>()
            .ForMember(dest => dest.Distance, opt => opt.Ignore()); // Se calcula manualmente

        // Business → BusinessDetailDto
        CreateMap<Business, BusinessDetailDto>()
            .ForMember(dest => dest.Owner, opt => opt.MapFrom(src => src.Owner))
            .ForMember(dest => dest.Services, opt => opt.Ignore()) // Pendiente cuando se creen DTOs de servicios
            .ForMember(dest => dest.Employees, opt => opt.Ignore()); // Pendiente cuando se creen DTOs de empleados
    }
}
