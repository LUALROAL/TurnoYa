using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories
{
    public class EmployeeScheduleRepository : IEmployeeScheduleRepository
    {
        private readonly ApplicationDbContext _context;
        public EmployeeScheduleRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<EmployeeSchedule?> GetByEmployeeIdAsync(Guid employeeId)
        {
            return await _context.EmployeeSchedules
                .Include(s => s.WorkingDays)
                    .ThenInclude(wd => wd.TimeBlocks)
                .Include(s => s.WorkingDays)
                    .ThenInclude(wd => wd.BreakTimes)
                .FirstOrDefaultAsync(s => s.EmployeeId == employeeId);
        }
        public async Task AddAsync(EmployeeSchedule schedule)
        {
            _context.EmployeeSchedules.Add(schedule);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateAsync(EmployeeSchedule schedule)
        {
            _context.EmployeeSchedules.Update(schedule);
            await _context.SaveChangesAsync();
        }
        public async Task DeleteAsync(EmployeeSchedule schedule)
        {
            _context.EmployeeSchedules.Remove(schedule);
            await _context.SaveChangesAsync();
        }
    }
}
