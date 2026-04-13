
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
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IEmployeePermissionService _permissionService;

        public BusinessService(
            IBusinessRepository businessRepository, 
            ApplicationDbContext context, 
            IMapper mapper, 
            IEmployeeRepository employeeRepository,
            IEmployeePermissionService permissionService)
        {
            _businessRepository = businessRepository;
            _context = context;
            _mapper = mapper;
            _employeeRepository = employeeRepository;
            _permissionService = permissionService;
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
            var dtos = _mapper.Map<IEnumerable<BusinessListDto>>(businesses).ToList();
            
            // Asignar tipo de relación "owner" a todos los negocios
            foreach (var dto in dtos)
            {
                dto.RelationshipType = "owner";
            }
            
            return dtos;
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
            business.IsActive = false;
            business.CreatedAt = DateTime.UtcNow;
            business.UpdatedAt = DateTime.UtcNow;

            // Validar si es el primer negocio del usuario
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == ownerId);
            if (user != null)
            {
                var negociosActuales = await _context.Businesses.CountAsync(b => b.OwnerId == ownerId);
                if (user.Role == "Customer" && negociosActuales == 0)
                {
                    user.Role = "OwnerBusiness";
                    await _context.SaveChangesAsync();
                }
            }

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

            var wasActive = business.IsActive;
            _mapper.Map(businessDto, business);

            if (!wasActive && business.IsActive)
            {
                var activeEmployees = (await _context.Employees
                    .Where(e => e.BusinessId == business.Id && e.IsActive)
                    .Select(e => e.Id)
                    .ToListAsync())
                    .Count;

                if (activeEmployees == 0)
                {
                    throw new InvalidOperationException("Tu negocio debe tener al menos un empleado activo para poder continuar.");
                }
            }

            business.UpdatedAt = DateTime.UtcNow;
            var updatedBusiness = await _businessRepository.UpdateAsync(business);

            // Solo eliminar y reemplazar imágenes si se suben nuevas
            if (images != null && images.Count > 0)
            {
                // Eliminar imágenes anteriores
                var oldImages = _context.BusinessImages.Where(img => img.BusinessId == updatedBusiness.Id).ToList();
                if (oldImages.Count > 0)
                {
                    _context.BusinessImages.RemoveRange(oldImages);
                    await _context.SaveChangesAsync();
                }

                // Guardar nuevas imágenes
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

        public async Task<IEnumerable<string>> GetCitiesAsync()
        {
            return await _context.Businesses
                .Where(b => !string.IsNullOrEmpty(b.City) && b.IsActive)
                .Select(b => b.City)
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

        public async Task DeleteAsync(Guid id, Guid ownerId)
        {
            var business = await _businessRepository.GetByIdAsync(id);

            if (business == null)
                throw new KeyNotFoundException();

            if (business.OwnerId != ownerId)
                throw new UnauthorizedAccessException();

            await _businessRepository.DeleteAsync(id);

            // Validar si el usuario ya no tiene negocios
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == ownerId);
            if (user != null)
            {
                var negociosRestantes = await _context.Businesses.CountAsync(b => b.OwnerId == ownerId);
                if (user.Role == "OwnerBusiness" && negociosRestantes == 0)
                {
                    user.Role = "Customer";
                    await _context.SaveChangesAsync();
                }
            }
        }

        /// <summary>
        /// Obtiene los negocios donde el usuario es empleado (no owner)
        /// </summary>
        public async Task<IEnumerable<BusinessListDto>> GetBusinessesAsEmployeeAsync(Guid userId)
        {
            // Obtener empleados del usuario
            var employees = await _employeeRepository.GetByUserIdAsync(userId);
            
            if (employees == null || !employees.Any())
            {
                return Enumerable.Empty<BusinessListDto>();
            }

            // Obtener los negocios de esos empleados
            var businessIds = employees.Select(e => e.BusinessId).Distinct().ToList();
            var businesses = await _context.Businesses
                .Include(b => b.Images)
                .Where(b => businessIds.Contains(b.Id))
                .ToListAsync();

            // Mapear a DTOs
            var dtos = _mapper.Map<IEnumerable<BusinessListDto>>(businesses).ToList();

            // Cargar permisos para cada empleado y asignar al negocio correspondiente
            foreach (var employee in employees)
            {
                var businessDto = dtos.FirstOrDefault(b => b.Id == employee.BusinessId);
                if (businessDto != null)
                {
                    var permissions = await _permissionService.GetPermissionsAsync(employee.Id);
                    if (permissions != null)
                    {
                        // Asignar tipo de relación
                        businessDto.RelationshipType = "employee";
                        
                        // Convertir EmployeePermissionsDto a Dictionary<string, bool>
                        businessDto.Permissions = new Dictionary<string, bool>
                        {
                            { "canViewAppointments", permissions.CanViewAppointments },
                            { "canAcceptAppointments", permissions.CanAcceptAppointments },
                            { "canRejectAppointments", permissions.CanRejectAppointments },
                            { "canCancelAppointments", permissions.CanCancelAppointments },
                            { "canRescheduleAppointments", permissions.CanRescheduleAppointments },
                            { "canManageSchedule", permissions.CanManageSchedule },
                            { "canViewServices", permissions.CanViewServices },
                            { "canManageServices", permissions.CanManageServices },
                            { "canViewEmployees", permissions.CanViewEmployees }
                        };
                    }
                }
            }

            return dtos;
        }
    }
}