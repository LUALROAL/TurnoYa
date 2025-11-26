using TurnoYa.Core.Entities;

namespace TurnoYa.Core.Interfaces;

/// <summary>
/// Repositorio para operaciones de negocios
/// </summary>
public interface IBusinessRepository
{
    Task<Business?> GetByIdAsync(Guid id);
    Task<IEnumerable<Business>> GetAllAsync();
    Task<IEnumerable<Business>> GetByOwnerIdAsync(Guid ownerId);
    Task<IEnumerable<Business>> GetByCategoryAsync(string category);
    Task<IEnumerable<Business>> GetNearbyAsync(decimal latitude, decimal longitude, double radiusKm);
    Task<IEnumerable<Business>> SearchAsync(string? query, string? city, string? category);
    Task<Business> AddAsync(Business business);
    Task<Business> UpdateAsync(Business business);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
}
