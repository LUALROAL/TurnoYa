using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Data;
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
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmployeeScheduleRepository _employeeScheduleRepository;
        private readonly ApplicationDbContext _context; // Temporal para acceder a otras entidades (servicios, empleados, negocios)
        private readonly IMapper _mapper;

        public AppointmentService(
            IAppointmentRepository appointmentRepository,
            IEmployeeRepository employeeRepository,
            IEmployeeScheduleRepository employeeScheduleRepository,
            ApplicationDbContext context,
            IMapper mapper)
        {
            _appointmentRepository = appointmentRepository;
            _employeeRepository = employeeRepository;
            _employeeScheduleRepository = employeeScheduleRepository;
            _context = context;
            _mapper = mapper;
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto, Guid userId)
        {
            // Validar servicio activo y coherencia con negocio
            var service = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == dto.ServiceId && s.BusinessId == dto.BusinessId && s.IsActive)
                ?? throw new InvalidOperationException("Servicio no encontrado");

            var businessExists = await _context.Businesses
                .AsNoTracking()
                .AnyAsync(b => b.Id == dto.BusinessId);

            if (!businessExists)
                throw new InvalidOperationException("Negocio no encontrado");

            var businessSettings = await _context.BusinessSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(bs => bs.BusinessId == dto.BusinessId);
            var bufferTime = businessSettings?.BufferTime ?? 0;

            Guid assignedEmployeeId;
            if (dto.EmployeeId.HasValue)
            {
                var employee = await _context.Employees
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId.Value && e.BusinessId == dto.BusinessId && e.IsActive);

                if (employee == null)
                    throw new InvalidOperationException("Empleado no encontrado o no pertenece al negocio");

                assignedEmployeeId = employee.Id;
            }
            else
            {
                var employeeId = await FindAvailableEmployeeAsync(
                    dto.BusinessId,
                    dto.ScheduledDate,
                    service.Duration,
                    bufferTime);

                if (!employeeId.HasValue)
                    throw new InvalidOperationException("No hay empleados disponibles para el horario seleccionado");

                assignedEmployeeId = employeeId.Value;
            }

            var effectiveStart = dto.ScheduledDate;
            var effectiveEnd = dto.ScheduledDate.AddMinutes(service.Duration + bufferTime);
            var endDate = dto.ScheduledDate.AddMinutes(service.Duration);

            await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            if (await _appointmentRepository.HasConflictAsync(dto.BusinessId, assignedEmployeeId, effectiveStart, effectiveEnd))
                throw new InvalidOperationException("El horario seleccionado no está disponible");

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                ServiceId = service.Id,
                EmployeeId = assignedEmployeeId,
                BusinessId = dto.BusinessId,
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
            await tx.CommitAsync();
            return _mapper.Map<AppointmentDto>(created);
        }

        public async Task<AppointmentDto?> GetByIdAsync(Guid id, Guid requesterId)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(id);
            if (appointment == null) return null;

            // Verificar permisos: el usuario due�o de la cita o el due�o del negocio
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
            // Verificar que el usuario sea el due�o del negocio
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

        private async Task<Guid?> FindAvailableEmployeeAsync(Guid businessId, DateTime startDate, int serviceDurationMinutes, int bufferTimeMinutes)
        {
            var effectiveEnd = startDate.AddMinutes(serviceDurationMinutes + bufferTimeMinutes);
            var dayStart = startDate.Date;
            var dayEnd = dayStart.AddDays(1);

            var employees = (await _employeeRepository.GetByBusinessIdAsync(businessId))
                .Where(e => e.IsActive)
                .ToList();

            if (!employees.Any())
                return null;

            var eligibleBySchedule = new List<Guid>();
            var scheduleByEmployeeId = new Dictionary<Guid, EmployeeSchedule>();

            foreach (var employee in employees)
            {
                var schedule = await _employeeScheduleRepository.GetByEmployeeIdAsync(employee.Id);
                if (schedule == null)
                    continue;

                var ranges = GetWorkingRangesForEmployeeDate(schedule, startDate.Date);
                var canAttend = ranges.Any(r => startDate >= r.Start && effectiveEnd <= r.End);

                if (canAttend)
                {
                    eligibleBySchedule.Add(employee.Id);
                    scheduleByEmployeeId[employee.Id] = schedule;
                }
            }

            if (!eligibleBySchedule.Any())
                return null;

            var appointmentsByEmployee = await _appointmentRepository.GetActiveAppointmentsByEmployeesAsync(
                businessId,
                eligibleBySchedule,
                dayStart,
                dayEnd);

            var availableCandidates = eligibleBySchedule
                .Where(employeeId =>
                {
                    if (!appointmentsByEmployee.TryGetValue(employeeId, out var existingAppointments))
                        return true;

                    return !existingAppointments.Any(a => startDate < a.EndDate && effectiveEnd > a.ScheduledDate);
                })
                .Select(employeeId => new
                {
                    EmployeeId = employeeId,
                    Workload = appointmentsByEmployee.TryGetValue(employeeId, out var items) ? items.Count : 0
                })
                .OrderBy(x => x.Workload)
                .ThenBy(x => x.EmployeeId)
                .ToList();

            return availableCandidates.FirstOrDefault()?.EmployeeId;
        }

        private List<TimeRange> GetWorkingRangesForEmployeeDate(EmployeeSchedule schedule, DateTime date)
        {
            int mappedDay = MapDayOfWeek(date.DayOfWeek);
            var workingDay = schedule.WorkingDays.FirstOrDefault(wd => wd.DayOfWeek == mappedDay);
            if (workingDay == null || !workingDay.IsOpen)
                return new List<TimeRange>();

            var ranges = new List<TimeRange>();
            foreach (var block in workingDay.TimeBlocks)
            {
                var blockStart = date.Date.Add(block.StartTime);
                var blockEnd = date.Date.Add(block.EndTime);

                var breaks = workingDay.BreakTimes
                    .Where(b => b.StartTime >= block.StartTime && b.EndTime <= block.EndTime)
                    .OrderBy(b => b.StartTime)
                    .ToList();

                var currentStart = blockStart;
                foreach (var br in breaks)
                {
                    var breakStart = date.Date.Add(br.StartTime);
                    var breakEnd = date.Date.Add(br.EndTime);
                    if (currentStart < breakStart)
                        ranges.Add(new TimeRange { Start = currentStart, End = breakStart });
                    currentStart = breakEnd;
                }

                if (currentStart < blockEnd)
                    ranges.Add(new TimeRange { Start = currentStart, End = blockEnd });
            }

            return ranges;
        }

        private int MapDayOfWeek(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => 0,
                DayOfWeek.Tuesday => 1,
                DayOfWeek.Wednesday => 2,
                DayOfWeek.Thursday => 3,
                DayOfWeek.Friday => 4,
                DayOfWeek.Saturday => 5,
                DayOfWeek.Sunday => 6,
                _ => 0
            };
        }

        private class TimeRange
        {
            public DateTime Start { get; set; }
            public DateTime End { get; set; }
        }

        private static string GenerateReferenceNumber()
        {
            return $"AP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}";
        }
    }
}