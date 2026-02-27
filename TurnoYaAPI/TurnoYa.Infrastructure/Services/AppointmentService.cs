using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly ApplicationDbContext _context; // Temporal para acceder a otras entidades (servicios, empleados, negocios)
        private readonly IMapper _mapper;

        public AppointmentService(
            IAppointmentRepository appointmentRepository,
            ApplicationDbContext context,
            IMapper mapper)
        {
            _appointmentRepository = appointmentRepository;
            _context = context;
            _mapper = mapper;
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto, Guid userId)
        {
            // Validar servicio y negocio
            var service = await _context.Services
                .Include(s => s.Business)
                .FirstOrDefaultAsync(s => s.Id == dto.ServiceId)
                ?? throw new InvalidOperationException("Servicio no encontrado");

            var business = service.Business
                ?? throw new InvalidOperationException("Negocio no encontrado");

            // Validar empleado si se especificó
            if (dto.EmployeeId.HasValue)
            {
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId.Value && e.BusinessId == business.Id);
                if (employee == null)
                    throw new InvalidOperationException("Empleado no encontrado o no pertenece al negocio");
            }

            // Calcular fecha de fin
            var endDate = dto.ScheduledDate.AddMinutes(service.Duration);

            // Validar disponibilidad (conflicto con otras citas)
            if (await _appointmentRepository.HasConflictAsync(service.Id, dto.ScheduledDate, endDate))
                throw new InvalidOperationException("El horario seleccionado no está disponible");

            // Crear la cita
            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                ServiceId = service.Id,
                EmployeeId = dto.EmployeeId,
                BusinessId = business.Id,
                UserId = userId,
                ScheduledDate = dto.ScheduledDate,
                EndDate = endDate,
                Status = AppointmentStatus.Pending,
                Notes = dto.Notes,
                TotalAmount = service.Price,
                ReferenceNumber = GenerateReferenceNumber(),
                CreatedAt = DateTime.UtcNow
            };

            var created = await _appointmentRepository.AddAsync(appointment);
            return _mapper.Map<AppointmentDto>(created);
        }

        public async Task<AppointmentDto?> GetByIdAsync(Guid id, Guid requesterId)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(id);
            if (appointment == null) return null;

            // Verificar permisos: el usuario dueño de la cita o el dueño del negocio
            if (appointment.UserId != requesterId)
            {
                var business = await _context.Businesses.FindAsync(appointment.BusinessId);
                if (business == null || business.OwnerId != requesterId)
                    return null;
            }

            return _mapper.Map<AppointmentDto>(appointment);
        }

        public async Task<IEnumerable<AppointmentDto>> GetMyAsync(Guid userId, DateTime? from = null, DateTime? to = null)
        {
            var appointments = await _appointmentRepository.GetByUserIdAsync(userId, from, to);
            return _mapper.Map<IEnumerable<AppointmentDto>>(appointments);
        }

        public async Task<IEnumerable<AppointmentDto>> GetBusinessAsync(Guid businessId, Guid ownerId, DateTime? from = null, DateTime? to = null)
        {
            // Verificar que el usuario sea el dueño del negocio
            var business = await _context.Businesses.FindAsync(businessId);
            if (business == null || business.OwnerId != ownerId)
                return Enumerable.Empty<AppointmentDto>();

            var appointments = await _appointmentRepository.GetByBusinessIdAsync(businessId, from, to);
            return _mapper.Map<IEnumerable<AppointmentDto>>(appointments);
        }

        public async Task<bool> ConfirmAsync(Guid id, Guid ownerId)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(id);
            if (appointment == null) return false;

            var business = await _context.Businesses.FindAsync(appointment.BusinessId);
            if (business == null || business.OwnerId != ownerId) return false;

            if (appointment.Status != AppointmentStatus.Pending) return false;

            appointment.Status = AppointmentStatus.Confirmed;
            await _appointmentRepository.UpdateAsync(appointment);
            return true;
        }

        public async Task<bool> CancelAsync(Guid id, Guid requesterId, string? reason)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(id);
            if (appointment == null) return false;

            var business = await _context.Businesses.FindAsync(appointment.BusinessId);
            bool isOwner = business?.OwnerId == requesterId;

            if (!isOwner && appointment.UserId != requesterId) return false;

            if (appointment.Status == AppointmentStatus.Cancelled || appointment.Status == AppointmentStatus.Completed)
                return false;

            appointment.Status = AppointmentStatus.Cancelled;
            // Opcional: guardar motivo en StatusHistory (pendiente de implementar)
            await _appointmentRepository.UpdateAsync(appointment);
            return true;
        }

        public async Task<bool> CompleteAsync(Guid id, Guid ownerId)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(id);
            if (appointment == null) return false;

            var business = await _context.Businesses.FindAsync(appointment.BusinessId);
            if (business == null || business.OwnerId != ownerId) return false;

            if (appointment.Status != AppointmentStatus.Confirmed) return false;

            appointment.Status = AppointmentStatus.Completed;
            await _appointmentRepository.UpdateAsync(appointment);
            return true;
        }

        public async Task<bool> MarkNoShowAsync(Guid id, Guid ownerId)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(id);
            if (appointment == null) return false;

            var business = await _context.Businesses.FindAsync(appointment.BusinessId);
            if (business == null || business.OwnerId != ownerId) return false;

            if (appointment.Status != AppointmentStatus.Confirmed && appointment.Status != AppointmentStatus.Pending)
                return false;

            appointment.Status = AppointmentStatus.NoShow;
            await _appointmentRepository.UpdateAsync(appointment);
            return true;
        }

        private static string GenerateReferenceNumber()
        {
            return $"AP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}";
        }
    }
}