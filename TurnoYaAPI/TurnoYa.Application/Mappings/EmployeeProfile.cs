using AutoMapper;
using System.Linq;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Mappings
{
    public class EmployeeProfile : Profile
    {
        public EmployeeProfile()
        {
            CreateMap<Employee, EmployeeDto>()
                .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => GetFirstName(src.Name)))
                .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => GetLastName(src.Name)))
                .ForMember(dest => dest.ProfilePictureUrl, opt => opt.MapFrom(src => src.PhotoUrl))
                .ForMember(dest => dest.ServiceIds, opt => opt.MapFrom(src => src.EmployeeServices.Select(es => es.ServiceId).ToList()))
                .ForMember(dest => dest.PhotoBase64, opt => opt.MapFrom(src => src.PhotoData != null ? Convert.ToBase64String(src.PhotoData) : null));

            CreateMap<CreateEmployeeDto, Employee>()
                .ForMember(dest => dest.Name, opt => opt.Ignore())
                .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => src.ProfilePictureUrl))
                .ForMember(dest => dest.PhotoData, opt => opt.MapFrom(src => src.PhotoBase64 != null ? Convert.FromBase64String(src.PhotoBase64) : null))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive ?? true));

            CreateMap<UpdateEmployeeDto, Employee>()
                .ForMember(dest => dest.Name, opt => opt.Ignore())
                .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => src.ProfilePictureUrl))
                .ForMember(dest => dest.PhotoData, opt => opt.MapFrom(src => src.PhotoBase64 != null ? Convert.FromBase64String(src.PhotoBase64) : null))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            // Mapping for EmployeeWithPermissionsDto
            CreateMap<Employee, EmployeeWithPermissionsDto>()
                .ForMember(dest => dest.Permissions, opt => opt.MapFrom(src => src.Permissions != null 
                    ? new EmployeePermissionsDto(
                        src.Permissions.EmployeeId,
                        src.Permissions.CanViewAppointments,
                        src.Permissions.CanAcceptAppointments,
                        src.Permissions.CanRejectAppointments,
                        src.Permissions.CanCancelAppointments,
                        src.Permissions.CanRescheduleAppointments,
                        src.Permissions.CanManageSchedule,
                        src.Permissions.CanViewServices,
                        src.Permissions.CanManageServices,
                        src.Permissions.CanViewEmployees)
                    : null));
        }

        private static string GetFirstName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName)) return string.Empty;
            var parts = fullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 0 ? parts[0] : string.Empty;
        }

        private static string GetLastName(string fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName)) return string.Empty;
            var parts = fullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 1 ? parts[1] : string.Empty;
        }
    }
}