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
            .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
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
                src.Owner != null ? $"{src.Owner.FirstName} {src.Owner.LastName}" : string.Empty))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images));

        // Business → BusinessListDto (✅ NUEVO: incluir imagen)
        CreateMap<Business, BusinessListDto>()
            .ForMember(dest => dest.Distance, opt => opt.Ignore())
            .ForMember(dest => dest.ImageBase64, opt => opt.MapFrom(src =>
                src.Images != null && src.Images.Any() && src.Images.First().ImageData != null
                    ? Convert.ToBase64String(src.Images.First().ImageData)
                    : null));

        // Business → BusinessDetailDto
        CreateMap<Business, BusinessDetailDto>()
            .ForMember(dest => dest.Owner, opt => opt.MapFrom(src => src.Owner))
            .ForMember(dest => dest.Services, opt => opt.MapFrom(src => src.Services))
            .ForMember(dest => dest.Employees, opt => opt.MapFrom(src => src.Employees))
            .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images));

        // BusinessImage → BusinessImageDto (✅ CORREGIDO: solo base64, sin prefijo)
        CreateMap<BusinessImage, BusinessImageDto>()
            .ForMember(dest => dest.ImageBase64, opt => opt.MapFrom(src =>
                src.ImageData != null && src.ImageData.Length > 0
                    ? Convert.ToBase64String(src.ImageData)
                    : null));

        // BusinessSettings → BusinessSettingsDto
        CreateMap<BusinessSettings, BusinessSettingsDto>()
            .ForMember(dest => dest.BookingAdvanceDays, opt => opt.MapFrom(src => src.MaxAdvanceBookingDays))
            .ForMember(dest => dest.CancellationHours, opt => opt.MapFrom(src => src.FreeCancellationHours))
            .ForMember(dest => dest.RequiresDeposit, opt => opt.MapFrom(src => src.NoShowPolicyType == "Deposit"))
            .ForMember(dest => dest.NoShowPolicy, opt => opt.MapFrom(src => src.NoShowPolicyType))
            .ForMember(dest => dest.DefaultSlotDuration, opt => opt.MapFrom(src => src.SlotDuration))
            .ForMember(dest => dest.BufferTimeBetweenAppointments, opt => opt.MapFrom(src => src.BufferTime));

        // BusinessSettingsDto → BusinessSettings
        CreateMap<BusinessSettingsDto, BusinessSettings>()
            .ForMember(dest => dest.MaxAdvanceBookingDays, opt => opt.MapFrom(src => src.BookingAdvanceDays))
            .ForMember(dest => dest.FreeCancellationHours, opt => opt.MapFrom(src => src.CancellationHours))
            .ForMember(dest => dest.NoShowPolicyType, opt => opt.MapFrom(src => src.NoShowPolicy ?? "None"))
            .ForMember(dest => dest.SlotDuration, opt => opt.MapFrom(src => src.DefaultSlotDuration))
            .ForMember(dest => dest.BufferTime, opt => opt.MapFrom(src => src.BufferTimeBetweenAppointments))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.BusinessId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Business, opt => opt.Ignore())
            .ForMember(dest => dest.NoShowDepositAmount, opt => opt.Ignore())
            .ForMember(dest => dest.MaxNoShows, opt => opt.Ignore())
            .ForMember(dest => dest.BlockDurationDays, opt => opt.Ignore())
            .ForMember(dest => dest.AllowCancellation, opt => opt.Ignore())
            .ForMember(dest => dest.LateCancellationFee, opt => opt.Ignore())
            .ForMember(dest => dest.MinAdvanceBookingMinutes, opt => opt.Ignore())
            .ForMember(dest => dest.SimultaneousBookings, opt => opt.Ignore())
            .ForMember(dest => dest.AcceptWompi, opt => opt.Ignore())
            .ForMember(dest => dest.AcceptCash, opt => opt.Ignore())
            .ForMember(dest => dest.AcceptCards, opt => opt.Ignore())
            .ForMember(dest => dest.AcceptNequi, opt => opt.Ignore())
            .ForMember(dest => dest.AcceptDaviplata, opt => opt.Ignore())
            .ForMember(dest => dest.AcceptPSE, opt => opt.Ignore());
    }
}