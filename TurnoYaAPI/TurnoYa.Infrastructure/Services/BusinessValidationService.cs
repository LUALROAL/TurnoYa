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
        // Log para debuggear
        Console.WriteLine($"[BusinessValidationService] CreateValidationAsync - AppointmentId: {dto.AppointmentId}, CustomerId: {dto.CustomerId}, BusinessId: {dto.BusinessId}, userId from JWT: {userId}");

        // Validar que el appointment existe y pertenece al usuario (cliente) y negocio
        var appointment = await _context.Appointments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId && a.UserId == dto.CustomerId && a.BusinessId == dto.BusinessId);
        
        if (appointment == null)
        {
            // Log más detallado para ver qué citas existen
            var allAppointments = await _context.Appointments
                .Where(a => a.Id == dto.AppointmentId || a.BusinessId == dto.BusinessId)
                .Select(a => new { a.Id, a.UserId, a.BusinessId, a.Status })
                .Take(10)
                .ToListAsync();
            
            Console.WriteLine($"[BusinessValidationService] Appointment not found. Trying to find with ID {dto.AppointmentId}");
            foreach (var appt in allAppointments)
            {
                Console.WriteLine($"[BusinessValidationService] Found appointment: ID={appt.Id}, UserId={appt.UserId}, BusinessId={appt.BusinessId}, Status={appt.Status}");
            }
            
            throw new InvalidOperationException("Cita no encontrada. Solo el cliente que reservó puede calificar.");
        }

        Console.WriteLine($"[BusinessValidationService] Found appointment: Status={appointment.Status}");

        // Validar que la cita esté completada
        if (appointment.Status != AppointmentStatus.Completed)
            throw new InvalidOperationException("Solo se pueden validar negocios con citas completadas");

        // Validar rating si se proporciona
        if (dto.Rating.HasValue && (dto.Rating < 1 || dto.Rating > 5))
            throw new InvalidOperationException("El rating debe estar entre 1 y 5");

        // Validar que el usuario actual es el cliente de la cita (del JWT debe ser igual al customerId)
        if (userId != dto.CustomerId)
            throw new InvalidOperationException("No tenés permiso para calificar esta cita");

        var existingValidation = await _context.BusinessValidations
            .FirstOrDefaultAsync(v => v.BusinessId == dto.BusinessId && v.UserId == userId);

        BusinessValidation savedValidation;

        if (existingValidation != null)
        {
            // Actualizar la validación existente
            existingValidation.Rating = dto.Rating;
            existingValidation.KnowsBusiness = dto.KnowsBusiness;
            existingValidation.UpdatedAt = DateTime.UtcNow;
            existingValidation.AppointmentId = dto.AppointmentId; // Referenciar la cita más reciente
            
            await _context.SaveChangesAsync();
            savedValidation = existingValidation;
        }
        else
        {
            var validation = new BusinessValidation
            {
                Id = Guid.NewGuid(),
                BusinessId = dto.BusinessId,
                UserId = userId,
                AppointmentId = dto.AppointmentId,
                KnowsBusiness = dto.KnowsBusiness,
                Rating = dto.Rating,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            savedValidation = await _repository.CreateAsync(validation);
        }

        // Recalcular certificación
        await CalculateAndUpdateCertificationAsync(dto.BusinessId);

        return _mapper.Map<BusinessValidationDto>(savedValidation);
    }

    public async Task<BusinessCertificationResultDto> CalculateCertificationAsync(Guid businessId)
    {
        var validations = await _repository.GetByBusinessIdAsync(businessId);
        var validationList = validations.ToList();

        var count = validationList.Count;
        var ratingsCount = validationList.Count(v => v.Rating.HasValue);
        var average = ratingsCount > 0 
            ? (decimal)validationList.Where(v => v.Rating.HasValue).Sum(v => v.Rating!.Value) / ratingsCount
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