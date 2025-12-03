using AutoMapper;
using TurnoYa.Application.DTOs.Auth;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Mappings;

/// <summary>
/// Perfil de mapeo para autenticación
/// </summary>
public class AuthProfile : Profile
{
    public AuthProfile()
    {
        // RegisterUserDto → User
        CreateMap<RegisterUserDto, User>()
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.ToLower()))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.Phone))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => string.IsNullOrWhiteSpace(src.Role) ? "Customer" : src.Role))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.IsEmailVerified, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.TotalNoShows, opt => opt.MapFrom(src => 0))
            .ForMember(dest => dest.NoShowCount, opt => opt.MapFrom(src => 0))
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore()) // Se setea manualmente
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.PhotoUrl, opt => opt.Ignore())
            .ForMember(dest => dest.DateOfBirth, opt => opt.Ignore())
            .ForMember(dest => dest.Gender, opt => opt.Ignore())
            .ForMember(dest => dest.IsBlocked, opt => opt.Ignore())
            .ForMember(dest => dest.BlockReason, opt => opt.Ignore())
            .ForMember(dest => dest.BlockUntil, opt => opt.Ignore())
            .ForMember(dest => dest.AverageRating, opt => opt.Ignore())
            .ForMember(dest => dest.CompletedAppointments, opt => opt.Ignore())
            .ForMember(dest => dest.LastLogin, opt => opt.Ignore())
            .ForMember(dest => dest.OwnedBusinesses, opt => opt.Ignore())
            .ForMember(dest => dest.Appointments, opt => opt.Ignore())
            .ForMember(dest => dest.Reviews, opt => opt.Ignore());

        // User → UserDto
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
            .ForMember(dest => dest.ProfilePictureUrl, opt => opt.MapFrom(src => src.PhotoUrl));

        // User → AuthResponseDto (no se usa directamente, solo UserDto)
        // Se construye manualmente en el servicio
    }
}
