
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using TurnoYa.Application.DTOs.Business;
using TurnoYa.Core.Entities;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace TurnoYa.Infrastructure.Services
{
    public class BusinessService : IBusinessService
    {
        private readonly IBusinessRepository _businessRepository;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public BusinessService(IBusinessRepository businessRepository, ApplicationDbContext context, IMapper mapper)
        {
            _businessRepository = businessRepository;
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<BusinessListDto>> GetAllAsync()
        {
            var businesses = await _businessRepository.GetAllAsync();
            return _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        }

        public async Task<BusinessDetailDto?> GetByIdAsync(Guid id)
        {
            var business = await _businessRepository.GetByIdAsync(id);
            if (business == null) return null;
            return _mapper.Map<BusinessDetailDto>(business);
        }

        public async Task<IEnumerable<BusinessListDto>> GetByOwnerIdAsync(Guid ownerId)
        {
            var businesses = await _businessRepository.GetByOwnerIdAsync(ownerId);
            return _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        }

        public async Task<IEnumerable<BusinessListDto>> GetNearbyAsync(double latitude, double longitude, double radiusKm)
        {
            // El repositorio espera decimal, pero la firma aquí es double
            var businesses = await _businessRepository.GetNearbyAsync((decimal)latitude, (decimal)longitude, radiusKm);
            return _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        }

        public async Task<IEnumerable<BusinessListDto>> SearchAsync(string query, string city, string category)
        {
            var businesses = await _businessRepository.SearchAsync(query, city, category);
            return _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        }

        public async Task<IEnumerable<BusinessListDto>> GetByCategoryAsync(string category)
        {
            var businesses = await _businessRepository.GetByCategoryAsync(category);
            return _mapper.Map<IEnumerable<BusinessListDto>>(businesses);
        }


        public async Task<BusinessDetailDto> AddAsync(CreateBusinessDto businessDto, Guid ownerId, List<byte[]>? images = null)
        {
            var business = _mapper.Map<Business>(businessDto);
            business.OwnerId = ownerId;
            business.CreatedAt = DateTime.UtcNow;
            business.UpdatedAt = DateTime.UtcNow;

            var createdBusiness = await _businessRepository.AddAsync(business);

            // Guardar imágenes si existen
            if (images != null && images.Count > 0)
            {
                var imageEntities = images.Select(img => new BusinessImage
                {
                    BusinessId = createdBusiness.Id,
                    ImageData = img,
                    CreatedAt = DateTime.UtcNow
                }).ToList();
                _context.BusinessImages.AddRange(imageEntities);
                await _context.SaveChangesAsync();
            }

            // Recargar con imágenes
            var fullBusiness = await _businessRepository.GetByIdAsync(createdBusiness.Id);
            return _mapper.Map<BusinessDetailDto>(fullBusiness);
        }


        public async Task<BusinessDetailDto> UpdateAsync(Guid id, UpdateBusinessDto businessDto, Guid userId, List<byte[]>? images = null)
        {
            var business = await _businessRepository.GetByIdAsync(id);
            if (business == null)
                throw new KeyNotFoundException("Negocio no encontrado");
            if (business.OwnerId != userId)
                throw new UnauthorizedAccessException("No autorizado para modificar este negocio");

            _mapper.Map(businessDto, business);
            business.UpdatedAt = DateTime.UtcNow;
            var updatedBusiness = await _businessRepository.UpdateAsync(business);

            // Eliminar imágenes anteriores
            var oldImages = _context.BusinessImages.Where(img => img.BusinessId == updatedBusiness.Id).ToList();
            if (oldImages.Count > 0)
            {
                _context.BusinessImages.RemoveRange(oldImages);
                await _context.SaveChangesAsync();
            }

            // Guardar nuevas imágenes
            if (images != null && images.Count > 0)
            {
                var imageEntities = images.Select(img => new BusinessImage
                {
                    BusinessId = updatedBusiness.Id,
                    ImageData = img,
                    CreatedAt = DateTime.UtcNow
                }).ToList();
                _context.BusinessImages.AddRange(imageEntities);
                await _context.SaveChangesAsync();
            }

            var fullBusiness = await _businessRepository.GetByIdAsync(updatedBusiness.Id);
            return _mapper.Map<BusinessDetailDto>(fullBusiness);
        }

        public async Task<IEnumerable<string>> GetCategoriesAsync()
        {
            return await _context.Businesses
                .Where(b => !string.IsNullOrEmpty(b.Category))
                .Select(b => b.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
        }

        public async Task<BusinessSettingsDto?> GetSettingsAsync(Guid businessId)
        {
            var business = await _context.Businesses
                .Include(b => b.Settings)
                .FirstOrDefaultAsync(b => b.Id == businessId);
            if (business == null) return null;
            if (business.Settings == null)
            {
                business.Settings = new BusinessSettings
                {
                    BusinessId = business.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.BusinessSettings.Add(business.Settings);
                await _context.SaveChangesAsync();
            }
            return _mapper.Map<BusinessSettingsDto>(business.Settings);
        }

        public async Task<BusinessSettingsDto?> UpdateSettingsAsync(Guid businessId, BusinessSettingsDto dto, Guid userId)
        {
            var business = await _context.Businesses
                .Include(b => b.Settings)
                .FirstOrDefaultAsync(b => b.Id == businessId);
            if (business == null) return null;
            if (business.OwnerId != userId) throw new UnauthorizedAccessException();
            if (business.Settings == null)
            {
                business.Settings = new BusinessSettings
                {
                    BusinessId = business.Id,
                    CreatedAt = DateTime.UtcNow
                };
                _context.BusinessSettings.Add(business.Settings);
            }
            _mapper.Map(dto, business.Settings);
            business.Settings.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return _mapper.Map<BusinessSettingsDto>(business.Settings);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var exists = await _businessRepository.ExistsAsync(id);
            if (!exists) return false;
            await _businessRepository.DeleteAsync(id);
            return true;
        }
    }
}