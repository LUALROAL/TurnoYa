using System;

namespace TurnoYa.Application.DTOs.Employee
{
    public record GenerateInvitationDto();

    public record InvitationResponseDto(
        string InvitationLink,
        string ShortCode,
        DateTime ExpiresAt,
        string EmployeeName,
        Guid EmployeeId
    );

    public record AcceptInvitationDto(
        string Token,
        Guid? UserId
    );

    public record AcceptInvitationByCodeDto(
        string Code
    );

    public record AcceptInvitationResponseDto(
        bool Success,
        string Message,
        Guid? EmployeeId
    );
}
