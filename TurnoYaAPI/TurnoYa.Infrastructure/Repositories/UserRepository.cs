using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> FindByTelegramCodeAsync(string code)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.TelegramLinkingCode == code);
        }

        public async Task<IEnumerable<User>> GetUsersWithExpiredTelegramCodesAsync()
        {
            return await _context.Users
                .Where(u => u.TelegramLinkingCode != null 
                    && u.TelegramLinkingCodeExpiry.HasValue 
                    && u.TelegramLinkingCodeExpiry < DateTime.UtcNow)
                .ToListAsync();
        }

        public async Task UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }
    }
}