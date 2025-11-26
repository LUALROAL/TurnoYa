using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly ApplicationDbContext _db;
        private readonly IMapper _mapper;

        public AppointmentService(ApplicationDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        public async Task<AppointmentDto> CreateAsync(CreateAppointmentDto dto, Guid userId)
        {
            var service = await _db.Services.Include(s => s.Business).FirstOrDefaultAsync(s => s.Id == dto.ServiceId);
            var employee = dto.EmployeeId.HasValue ? await _db.Employees.FirstOrDefaultAsync(e => e.Id == dto.EmployeeId.Value) : null;
            var business = service?.Business;
            if (service == null || business == null)
                throw new InvalidOperationException("Service or Business not found");

            // Validate requested slot availability: no overlap
            var endDate = dto.ScheduledDate.AddMinutes(service.Duration);
            var conflicts = await _db.Appointments.AnyAsync(a => a.ServiceId == service.Id && a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Completed && dto.ScheduledDate < a.EndDate && endDate > a.ScheduledDate);
            if (conflicts)
                throw new InvalidOperationException("Selected time slot is not available");

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                ServiceId = service.Id,
                EmployeeId = employee?.Id,
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

            _db.Appointments.Add(appointment);
            await _db.SaveChangesAsync();
            return _mapper.Map<AppointmentDto>(appointment);
        }

        public async Task<AppointmentDto?> GetByIdAsync(Guid id, Guid requesterId)
        {
            var appt = await _db.Appointments.Include(a => a.Service).Include(a => a.Employee).FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return null;
            if (appt.UserId != requesterId)
            {
                var business = await _db.Businesses.FirstOrDefaultAsync(b => b.Id == appt.BusinessId);
                if (business == null || business.OwnerId != requesterId) return null;
            }
            return _mapper.Map<AppointmentDto>(appt);
        }

        public async Task<IEnumerable<AppointmentDto>> GetMyAsync(Guid userId, DateTime? from = null, DateTime? to = null)
        {
            var query = _db.Appointments.AsQueryable().Where(a => a.UserId == userId);
            if (from.HasValue) query = query.Where(a => a.ScheduledDate >= from.Value);
            if (to.HasValue) query = query.Where(a => a.ScheduledDate <= to.Value);
            var list = await query.Include(a => a.Service).Include(a => a.Employee).OrderByDescending(a => a.ScheduledDate).ToListAsync();
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<IEnumerable<AppointmentDto>> GetBusinessAsync(Guid businessId, Guid ownerId, DateTime? from = null, DateTime? to = null)
        {
            var business = await _db.Businesses.FirstOrDefaultAsync(b => b.Id == businessId);
            if (business == null || business.OwnerId != ownerId) return Enumerable.Empty<AppointmentDto>();
            var query = _db.Appointments.AsQueryable().Where(a => a.BusinessId == businessId);
            if (from.HasValue) query = query.Where(a => a.ScheduledDate >= from.Value);
            if (to.HasValue) query = query.Where(a => a.ScheduledDate <= to.Value);
            var list = await query.Include(a => a.Service).Include(a => a.Employee).OrderByDescending(a => a.ScheduledDate).ToListAsync();
            return _mapper.Map<IEnumerable<AppointmentDto>>(list);
        }

        public async Task<bool> ConfirmAsync(Guid id, Guid ownerId)
        {
            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return false;
            var business = await _db.Businesses.FirstOrDefaultAsync(b => b.Id == appt.BusinessId);
            if (business == null || business.OwnerId != ownerId) return false;
            if (appt.Status != AppointmentStatus.Pending) return false;
            appt.Status = AppointmentStatus.Confirmed;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelAsync(Guid id, Guid requesterId, string? reason)
        {
            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return false;
            var isOwner = (await _db.Businesses.FirstOrDefaultAsync(b => b.Id == appt.BusinessId))?.OwnerId == requesterId;
            if (!isOwner && appt.UserId != requesterId) return false;
            if (appt.Status == AppointmentStatus.Cancelled || appt.Status == AppointmentStatus.Completed) return false;
            appt.Status = AppointmentStatus.Cancelled;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CompleteAsync(Guid id, Guid ownerId)
        {
            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return false;
            var business = await _db.Businesses.FirstOrDefaultAsync(b => b.Id == appt.BusinessId);
            if (business == null || business.OwnerId != ownerId) return false;
            if (appt.Status != AppointmentStatus.Confirmed) return false;
            appt.Status = AppointmentStatus.Completed;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkNoShowAsync(Guid id, Guid ownerId)
        {
            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == id);
            if (appt == null) return false;
            var business = await _db.Businesses.FirstOrDefaultAsync(b => b.Id == appt.BusinessId);
            if (business == null || business.OwnerId != ownerId) return false;
            if (appt.Status != AppointmentStatus.Confirmed && appt.Status != AppointmentStatus.Pending) return false;
            appt.Status = AppointmentStatus.NoShow;
            await _db.SaveChangesAsync();
            return true;
        }

        private static string GenerateReferenceNumber()
        {
            return $"AP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0,6).ToUpper()}";
        }
    }
}
