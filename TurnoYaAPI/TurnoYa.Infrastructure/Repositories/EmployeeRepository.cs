using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories
{
    public class EmployeeRepository : IEmployeeRepository
    {
        private readonly ApplicationDbContext _context;

        public EmployeeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Employee>> GetByBusinessIdAsync(Guid businessId)
        {
            return await _context.Employees
                .Include(e => e.EmployeeServices)
                .Where(e => e.BusinessId == businessId)
                .ToListAsync();
        }

        public async Task<Employee?> GetByIdAsync(Guid id)
        {
            return await _context.Employees
                .Include(e => e.Business)
                .Include(e => e.EmployeeServices)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<IEnumerable<Employee>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Employees
                .Include(e => e.Business)
                .Include(e => e.EmployeeServices)
                .Where(e => e.UserId == userId)
                .ToListAsync();
        }

        public async Task<Employee?> GetByInvitationTokenAsync(string token)
        {
            return await _context.Employees
                .Include(e => e.Business)
                .FirstOrDefaultAsync(e => 
                    e.InvitationToken == token && 
                    !e.IsInvitationUsed &&
                    e.InvitationTokenExpiry != null &&
                    e.InvitationTokenExpiry > DateTime.UtcNow);
        }

        public async Task<Employee?> GetByInvitationCodeAsync(string code)
        {
            return await _context.Employees
                .Include(e => e.Business)
                .FirstOrDefaultAsync(e => 
                    e.InvitationCode == code && 
                    !e.IsInvitationUsed &&
                    e.InvitationTokenExpiry != null &&
                    e.InvitationTokenExpiry > DateTime.UtcNow);
        }

        public async Task<Employee> AddAsync(Employee employee)
        {
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            return employee;
        }

        public async Task<Employee> UpdateAsync(Employee employee)
        {
            _context.Employees.Update(employee);
            await _context.SaveChangesAsync();
            return employee;
        }

        public async Task DeleteAsync(Guid id)
        {
            var employee = await GetByIdAsync(id);
            if (employee != null)
            {
                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Employees.AnyAsync(e => e.Id == id);
        }

        public async Task<Employee?> GetByUserIdAndBusinessIdAsync(Guid userId, Guid businessId)
        {
            return await _context.Employees
                .Include(e => e.Business)
                .Include(e => e.EmployeeServices)
                .FirstOrDefaultAsync(e => e.UserId == userId && e.BusinessId == businessId);
        }
    }
}