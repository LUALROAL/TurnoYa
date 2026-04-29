using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.BusinessValidation;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services;

public class BusinessValidationService : IBusinessValidationService
{
    private readonly IBusinessValidationRepository _repository;
    private readonly IBusinessRepository _businessRepository;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public BusinessValidationService(
        IBusinessValidationRepository repository,
        IBusinessRepository businessRepository,
        ApplicationDbContext context,
        IMapper mapper)
    {
        _repository = repository;
        _businessRepository = businessRepository;
        _context = context;
        _mapper = mapper;
    }

    public async Task<BusinessValidationDto> CreateValidationAsync(CreateBusinessValidationDto dto, Guid userId)
    {
        // Validar que el appointment existe y pertenece al usuario y negocio
        var appointment = await _context.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId && a.UserId == userId && a.BusinessId == dto.BusinessId)
            ?? throw new InvalidOperationException("Cita no encontrada o no pertenece al usuario");

        // Validar que la cita esté completada
        if (appointment.Status != AppointmentStatus.Completed)
            throw new InvalidOperationException("Solo se pueden validar negocios con citas completadas");

        // Validar rating si se proporciona
        if (dto.Rating.HasValue && (dto.Rating < 1 || dto.Rating > 5))
            throw new InvalidOperationException("El rating debe estar entre 1 y 5");

        var validation = new BusinessValidation
        {
            Id = Guid.NewGuid(),
            BusinessId = dto.BusinessId,
            UserId = userId,
            AppointmentId = dto.AppointmentId,
            KnowsBusiness = dto.KnowsBusiness,
            Rating = dto.Rating,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateAsync(validation);

        // Recalcular certificación
        await CalculateAndUpdateCertificationAsync(dto.BusinessId);

        return _mapper.Map<BusinessValidationDto>(created);
    }

    public async Task<BusinessCertificationResultDto> CalculateCertificationAsync(Guid businessId)
    {
        var validations = await _repository.GetByBusinessIdAsync(businessId);
        var validationList = validations.ToList();

        var count = validationList.Count;
        var average = count > 0 
            ? (decimal)validationList.Where(v => v.Rating.HasValue).Sum(v => v.Rating!.Value) / validationList.Where(v => v.Rating.HasValue).Count()
            : 0;
        var isVerified = count >= 5 && average >= 4;

        return new BusinessCertificationResultDto
        {
            ValidationCount = count,
            AverageRating = Math.Round(average, 2),
            IsVerified = isVerified
        };
    }

    private async Task CalculateAndUpdateCertificationAsync(Guid businessId)
    {
        var result = await CalculateCertificationAsync(businessId);

        var business = await _context.Businesses.FindAsync(businessId);
        if (business != null)
        {
            business.IsVerified = result.IsVerified;
            await _businessRepository.UpdateAsync(business);
        }
    }
}