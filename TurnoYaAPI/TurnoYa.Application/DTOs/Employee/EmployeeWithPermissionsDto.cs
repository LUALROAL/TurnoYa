using System;

namespace TurnoYa.Application.DTOs.Employee
{
    public record EmployeeWithPermissionsDto(
        Guid Id,
        Guid BusinessId,
        Guid UserId,
        string Name,
        string? Position,
        string? Bio,
        string? Email,
        string? Phone,
        string? PhotoUrl,
        bool IsActive,
        bool HasInvitationPending,
        EmployeePermissionsDto? Permissions
    );
}
