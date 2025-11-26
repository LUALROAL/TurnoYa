using AutoMapper;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Mappings;

/// <summary>
/// Perfil de mapeo para citas
/// </summary>
public class AppointmentProfile : Profile
{
    public AppointmentProfile()
    {
        // CreateAppointmentDto → Appointment
        CreateMap<CreateAppointmentDto, Appointment>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ReferenceNumber, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore()) // Se setea con usuario autenticado
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => AppointmentStatus.Pending))
            .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
            .ForMember(dest => dest.DepositAmount, opt => opt.Ignore())
            .ForMember(dest => dest.DepositPaid, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.EndDate, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.Business, opt => opt.Ignore())
            .ForMember(dest => dest.Service, opt => opt.Ignore())
            .ForMember(dest => dest.Employee, opt => opt.Ignore())
            .ForMember(dest => dest.WompiTransaction, opt => opt.Ignore())
            .ForMember(dest => dest.Review, opt => opt.Ignore())
            .ForMember(dest => dest.StatusHistory, opt => opt.Ignore());

        // Appointment → AppointmentDto
        CreateMap<Appointment, AppointmentDto>();
    }
}
