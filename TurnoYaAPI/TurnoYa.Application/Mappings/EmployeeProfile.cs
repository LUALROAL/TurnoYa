using AutoMapper;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Core.Entities;

namespace TurnoYa.Application.Mappings;

/// <summary>
/// Perfil de mapeo para empleados
/// </summary>
public class EmployeeProfile : Profile
{
    public EmployeeProfile()
    {
        // CreateEmployeeDto → Employee
        CreateMap<CreateEmployeeDto, Employee>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.BusinessId, opt => opt.Ignore()) // Se setea manualmente
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Business, opt => opt.Ignore())
            .ForMember(dest => dest.Appointments, opt => opt.Ignore());

        // UpdateEmployeeDto → Employee
        CreateMap<UpdateEmployeeDto, Employee>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Employee → EmployeeDto
        CreateMap<Employee, EmployeeDto>();
    }
}
