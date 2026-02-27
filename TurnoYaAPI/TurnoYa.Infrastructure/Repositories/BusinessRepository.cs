using Microsoft.EntityFrameworkCore;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories;

/// <summary>
/// Implementación del repositorio de negocios con búsqueda geolocalizada
/// </summary>
public class BusinessRepository : IBusinessRepository
{
    private readonly ApplicationDbContext _context;

    public BusinessRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Business?> GetByIdAsync(Guid id)
    {
        return await _context.Businesses
            .Include(b => b.Owner)
            .Include(b => b.Services)
            .Include(b => b.Employees)
            .Include(b => b.Images) // 👈 AÑADIDO
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<IEnumerable<Business>> GetAllAsync()
    {
        return await _context.Businesses
            .Include(b => b.Owner)
            .Include(b => b.Images) // 👈 AÑADIDO
            .Where(b => b.IsActive)
            .ToListAsync();
    }

    public async Task<IEnumerable<Business>> GetByOwnerIdAsync(Guid ownerId)
    {
        return await _context.Businesses
            .Where(b => b.OwnerId == ownerId)
            .Include(b => b.Images) // 👈 AÑADIDO
            .ToListAsync();
    }

    public async Task<IEnumerable<Business>> GetByCategoryAsync(string category)
    {
        return await _context.Businesses
            .Where(b => b.Category == category && b.IsActive)
            .Include(b => b.Owner)
            .Include(b => b.Images) // 👈 AÑADIDO
            .ToListAsync();
    }

    /// <summary>
    /// Búsqueda de negocios cercanos usando la fórmula de Haversine
    /// </summary>
    public async Task<IEnumerable<Business>> GetNearbyAsync(decimal latitude, decimal longitude, double radiusKm)
    {
        var businesses = await _context.Businesses
            .Where(b => b.IsActive && b.Latitude.HasValue && b.Longitude.HasValue)
            .Include(b => b.Owner)
            .Include(b => b.Images) // 👈 AÑADIDO
            .ToListAsync();

        // Calcular distancia usando fórmula de Haversine
        var nearbyBusinesses = businesses
            .Select(b => new
            {
                Business = b,
                Distance = CalculateDistance(
                    (double)latitude, (double)longitude,
                    (double)b.Latitude!.Value, (double)b.Longitude!.Value)
            })
            .Where(x => x.Distance <= radiusKm)
            .OrderBy(x => x.Distance)
            .Select(x => x.Business);

        return nearbyBusinesses;
    }

    public async Task<IEnumerable<Business>> SearchAsync(string? query, string? city, string? category)
    {
        var businessesQuery = _context.Businesses
            .Where(b => b.IsActive)
            .Include(b => b.Owner)
            .Include(b => b.Images) // 👈 AÑADIDO
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            businessesQuery = businessesQuery.Where(b =>
                b.Name.Contains(query) ||
                (b.Description != null && b.Description.Contains(query)));
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            businessesQuery = businessesQuery.Where(b => b.City == city);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            businessesQuery = businessesQuery.Where(b => b.Category == category);
        }

        return await businessesQuery.ToListAsync();
    }
    public async Task<Business> AddAsync(Business business)
    {
        await _context.Businesses.AddAsync(business);
        await _context.SaveChangesAsync();
        return business;
    }

    public async Task<Business> UpdateAsync(Business business)
    {
        _context.Businesses.Update(business);
        await _context.SaveChangesAsync();
        return business;
    }

    public async Task DeleteAsync(Guid id)
    {
        var business = await _context.Businesses.FindAsync(id);
        if (business != null)
        {
            _context.Businesses.Remove(business);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Businesses.AnyAsync(b => b.Id == id);
    }

    /// <summary>
    /// Calcula la distancia entre dos puntos usando la fórmula de Haversine
    /// </summary>
    /// <returns>Distancia en kilómetros</returns>
    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Radio de la Tierra en kilómetros

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }
}
