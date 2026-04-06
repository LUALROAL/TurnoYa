using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories
{
    public class EmployeePermissionRepository : IEmployeePermissionRepository
    {
        private readonly ApplicationDbContext _context;

        public EmployeePermissionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<EmployeePermission?> GetByEmployeeIdAsync(Guid employeeId)
        {
            return await _context.EmployeePermissions
                .FirstOrDefaultAsync(p => p.EmployeeId == employeeId);
        }

        public async Task<EmployeePermission> CreateAsync(EmployeePermission permission)
        {
            _context.EmployeePermissions.Add(permission);
            await _context.SaveChangesAsync();
            return permission;
        }

        public async Task<EmployeePermission> UpdateAsync(EmployeePermission permission)
        {
            _context.EmployeePermissions.Update(permission);
            await _context.SaveChangesAsync();
            return permission;
        }

        public async Task<bool> DeleteAsync(Guid employeeId)
        {
            var permission = await GetByEmployeeIdAsync(employeeId);
            if (permission == null) return false;

            _context.EmployeePermissions.Remove(permission);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
