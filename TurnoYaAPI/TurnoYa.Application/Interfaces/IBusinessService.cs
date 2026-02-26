using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Business;

namespace TurnoYa.Application.Interfaces
{
    public interface IBusinessService
    {
        Task<IEnumerable<BusinessListDto>> GetAllAsync();
        Task<BusinessDetailDto?> GetByIdAsync(Guid id);
        Task<IEnumerable<BusinessListDto>> GetByOwnerIdAsync(Guid ownerId);
        Task<IEnumerable<BusinessListDto>> GetNearbyAsync(double latitude, double longitude, double radiusKm);
        Task<IEnumerable<BusinessListDto>> SearchAsync(string query, string city, string category);
        Task<IEnumerable<BusinessListDto>> GetByCategoryAsync(string category);
        Task<BusinessDetailDto> AddAsync(CreateBusinessDto businessDto, Guid ownerId, List<byte[]>? images = null);
        Task<BusinessDetailDto> UpdateAsync(Guid id, UpdateBusinessDto businessDto, Guid userId, List<byte[]>? images = null);
        Task DeleteAsync(Guid id, Guid ownerId);
        //Task<bool> DeleteAsync(Guid id , Guid ownerId);
        Task<IEnumerable<string>> GetCategoriesAsync();
        Task<BusinessSettingsDto?> GetSettingsAsync(Guid businessId);
        Task<BusinessSettingsDto?> UpdateSettingsAsync(Guid businessId, BusinessSettingsDto dto, Guid userId);
    }
}
