using System;

namespace TurnoYa.Application.DTOs.Employee
{
    public record EmployeePermissionsDto(
        Guid EmployeeId,
        bool CanViewAppointments,
        bool CanAcceptAppointments,
        bool CanRejectAppointments,
        bool CanCancelAppointments,
        bool CanRescheduleAppointments,
        bool CanManageSchedule,
        bool CanViewServices,
        bool CanManageServices,
        bool CanViewEmployees
    );

    public record UpdateEmployeePermissionsDto(
        bool CanViewAppointments,
        bool CanAcceptAppointments,
        bool CanRejectAppointments,
        bool CanCancelAppointments,
        bool CanRescheduleAppointments,
        bool CanManageSchedule,
        bool CanViewServices,
        bool CanManageServices,
        bool CanViewEmployees
    );

    public record EmployeePermissionsResponseDto(
        Guid EmployeeId,
        string EmployeeName,
        EmployeePermissionsDto Permissions
    );
}
