using System;

namespace TurnoYa.Application.DTOs.BusinessValidation;

public class CreateBusinessValidationDto
{
    public Guid BusinessId { get; set; }
    public Guid AppointmentId { get; set; }
    public Guid CustomerId { get; set; }
    public bool KnowsBusiness { get; set; }
    public int? Rating { get; set; } // 1-5
}

public class BusinessValidationDto
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid UserId { get; set; }
    public Guid AppointmentId { get; set; }
    public bool KnowsBusiness { get; set; }
    public int? Rating { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BusinessCertificationResultDto
{
    public int ValidationCount { get; set; }
    public decimal AverageRating { get; set; }
    public bool IsVerified { get; set; }
}