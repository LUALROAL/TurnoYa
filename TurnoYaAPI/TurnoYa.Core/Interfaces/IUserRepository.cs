using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> FindByTelegramCodeAsync(string code);
        Task<IEnumerable<User>> GetUsersWithExpiredTelegramCodesAsync();
        Task UpdateAsync(User user);
    }
}