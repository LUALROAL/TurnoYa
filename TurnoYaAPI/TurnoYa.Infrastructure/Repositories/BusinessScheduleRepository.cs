using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories
{
    public class BusinessScheduleRepository : IBusinessScheduleRepository
    {
        private readonly ApplicationDbContext _context;
        public BusinessScheduleRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<BusinessSchedule?> GetByBusinessIdAsync(Guid businessId)
        {
            return await _context.BusinessSchedules
                .Include(s => s.WorkingDays)
                    .ThenInclude(wd => wd.TimeBlocks)
                .Include(s => s.WorkingDays)
                    .ThenInclude(wd => wd.BreakTimes)
                .FirstOrDefaultAsync(s => s.BusinessId == businessId);
        }
        public async Task AddAsync(BusinessSchedule schedule)
        {
            _context.BusinessSchedules.Add(schedule);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateAsync(BusinessSchedule schedule)
        {
            _context.BusinessSchedules.Update(schedule);
            await _context.SaveChangesAsync();
        }
        public async Task DeleteAsync(BusinessSchedule schedule)
        {
            _context.BusinessSchedules.Remove(schedule);
            await _context.SaveChangesAsync();
        }
    }
}
