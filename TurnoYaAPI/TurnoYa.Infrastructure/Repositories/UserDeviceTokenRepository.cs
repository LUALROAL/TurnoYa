using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories;

/// <summary>
/// Implementación EF Core de IUserDeviceTokenRepository.
/// </summary>
public class UserDeviceTokenRepository : IUserDeviceTokenRepository
{
    private readonly ApplicationDbContext _context;

    public UserDeviceTokenRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDeviceToken?> GetByTokenAsync(string token)
    {
        return await _context.UserDeviceTokens
            .FirstOrDefaultAsync(t => t.Token == token);
    }

    public async Task<UserDeviceToken> AddAsync(UserDeviceToken entity)
    {
        _context.UserDeviceTokens.Add(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task<IEnumerable<UserDeviceToken>> GetByUserIdAsync(Guid userId)
    {
        return await _context.UserDeviceTokens
            .Where(t => t.UserId == userId && t.IsActive)
            .ToListAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _context.UserDeviceTokens.FindAsync(id);
        if (entity != null)
        {
            _context.UserDeviceTokens.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteByUserIdAsync(Guid userId)
    {
        var tokens = await _context.UserDeviceTokens
            .Where(t => t.UserId == userId)
            .ToListAsync();
        _context.UserDeviceTokens.RemoveRange(tokens);
        await _context.SaveChangesAsync();
    }
}
