using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly ApplicationDbContext _context;

        public AppointmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Appointment?> GetByIdAsync(Guid id)
        {
            return await _context.Appointments
                .Include(a => a.Service)
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<IEnumerable<Appointment>> GetByUserIdAsync(Guid userId, DateTime? from = null, DateTime? to = null)
        {
            var query = _context.Appointments
                .Include(a => a.Service)
                .Include(a => a.Employee)
                .Where(a => a.UserId == userId);

            if (from.HasValue)
                query = query.Where(a => a.ScheduledDate >= from.Value);
            if (to.HasValue)
                query = query.Where(a => a.ScheduledDate <= to.Value);

            return await query
                .OrderByDescending(a => a.ScheduledDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Appointment>> GetByBusinessIdAsync(Guid businessId, DateTime? from = null, DateTime? to = null)
        {
            var query = _context.Appointments
                .Include(a => a.Service)
                .Include(a => a.Employee)
                .Where(a => a.BusinessId == businessId);

            if (from.HasValue)
                query = query.Where(a => a.ScheduledDate >= from.Value);
            if (to.HasValue)
                query = query.Where(a => a.ScheduledDate <= to.Value);

            return await query
                .OrderByDescending(a => a.ScheduledDate)
                .ToListAsync();
        }

        public async Task<bool> HasConflictAsync(Guid businessId, Guid employeeId, DateTime start, DateTime end, Guid? excludeAppointmentId = null)
        {
            var query = _context.Appointments
            .Where(a => a.BusinessId == businessId)
            .Where(a => a.EmployeeId == employeeId)
                .Where(a => a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Completed)
                .Where(a => start < a.EndDate && end > a.ScheduledDate);

            if (excludeAppointmentId.HasValue)
                query = query.Where(a => a.Id != excludeAppointmentId.Value);

            return await query.AnyAsync();
        }

        public async Task<Dictionary<Guid, List<Appointment>>> GetActiveAppointmentsByEmployeesAsync(Guid businessId, IEnumerable<Guid> employeeIds, DateTime from, DateTime to)
        {
            var employeeIdList = employeeIds.Distinct().ToList();
            if (!employeeIdList.Any())
                return new Dictionary<Guid, List<Appointment>>();

            var appointments = await _context.Appointments
                .Where(a => a.BusinessId == businessId)
                .Where(a => a.EmployeeId.HasValue && employeeIdList.Contains(a.EmployeeId.Value))
                .Where(a => a.Status != AppointmentStatus.Cancelled && a.Status != AppointmentStatus.Completed)
                .Where(a => a.ScheduledDate < to && a.EndDate > from)
                .OrderBy(a => a.ScheduledDate)
                .ToListAsync();

            return appointments
                .GroupBy(a => a.EmployeeId!.Value)
                .ToDictionary(g => g.Key, g => g.ToList());
        }

        public async Task<Appointment> AddAsync(Appointment appointment)
        {
            await _context.Appointments.AddAsync(appointment);
            await _context.SaveChangesAsync();
            return appointment;
        }

        public async Task UpdateAsync(Appointment appointment)
        {
            _context.Appointments.Update(appointment);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Appointments.AnyAsync(a => a.Id == id);
        }
    }
}