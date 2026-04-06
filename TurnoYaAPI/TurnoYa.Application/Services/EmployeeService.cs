using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;

namespace TurnoYa.Application.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IBusinessRepository _businessRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<EmployeeService> _logger;
        private const int InvitationTokenExpiryDays = 7;

        public EmployeeService(
            IEmployeeRepository employeeRepository,
            IBusinessRepository businessRepository,
            IMapper mapper,
            ILogger<EmployeeService> logger)
        {
            _employeeRepository = employeeRepository;
            _businessRepository = businessRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<EmployeeDto>> GetByBusinessIdAsync(Guid businessId)
        {
            var employees = await _employeeRepository.GetByBusinessIdAsync(businessId);
            return _mapper.Map<IEnumerable<EmployeeDto>>(employees);
        }

        public async Task<EmployeeDto?> GetByIdAsync(Guid id)
        {
            var employee = await _employeeRepository.GetByIdAsync(id);
            return employee == null ? null : _mapper.Map<EmployeeDto>(employee);
        }

        public async Task<IEnumerable<EmployeeDto>> GetEmployeesByUserIdAsync(Guid userId)
        {
            var employees = await _employeeRepository.GetByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<EmployeeDto>>(employees);
        }

        public async Task<EmployeeDto> CreateAsync(Guid businessId, Guid ownerId, CreateEmployeeDto dto, byte[]? photoData = null)
        {
            // Verificar que el negocio existe y pertenece al owner
            var business = await _businessRepository.GetByIdAsync(businessId);
            if (business == null)
                throw new KeyNotFoundException("Negocio no encontrado");
            if (business.OwnerId != ownerId)
                throw new UnauthorizedAccessException("No autorizado para modificar este negocio");

            var employee = _mapper.Map<Employee>(dto);
            employee.BusinessId = businessId;
            employee.UserId = ownerId;
            employee.Name = $"{dto.FirstName} {dto.LastName}".Trim();
            employee.CreatedAt = DateTime.UtcNow;
            employee.UpdatedAt = DateTime.UtcNow;
            employee.PhotoData = photoData;

            var requestedServiceIds = (dto.ServiceIds ?? new List<Guid>()).Distinct().ToList();
            ValidateBusinessServices(requestedServiceIds, business.Services.Select(s => s.Id));
            employee.EmployeeServices = requestedServiceIds
                .Select(serviceId => new EmployeeServiceAssignment
                {
                    EmployeeId = employee.Id,
                    ServiceId = serviceId
                })
                .ToList();

            var created = await _employeeRepository.AddAsync(employee);
            return _mapper.Map<EmployeeDto>(created);
        }

        public async Task<EmployeeDto> UpdateAsync(Guid id, Guid ownerId, UpdateEmployeeDto dto, byte[]? photoData = null)
        {
            var employee = await _employeeRepository.GetByIdAsync(id);
            if (employee == null)
                throw new KeyNotFoundException("Empleado no encontrado");

            // Verificar que el negocio pertenece al owner
            if (employee.Business?.OwnerId != ownerId)
                throw new UnauthorizedAccessException("No autorizado para modificar este empleado");

            var business = await _businessRepository.GetByIdAsync(employee.BusinessId);
            if (business == null)
                throw new KeyNotFoundException("Negocio no encontrado");

            if (dto.IsActive.HasValue && !dto.IsActive.Value && employee.IsActive && business.IsActive)
            {
                var activeEmployees = (await _employeeRepository.GetByBusinessIdAsync(employee.BusinessId))
                    .Count(e => e.IsActive);

                if (activeEmployees <= 1)
                    throw new InvalidOperationException("Tu negocio debe tener al menos un empleado activo para poder continuar.");
            }

            // Actualizar campos
            if (dto.FirstName != null || dto.LastName != null)
            {
                var currentNames = (employee.Name ?? string.Empty).Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var currentFirstName = currentNames.Length > 0 ? currentNames[0] : string.Empty;
                var currentLastName = currentNames.Length > 1 ? currentNames[1] : string.Empty;

                var firstName = dto.FirstName ?? currentFirstName;
                var lastName = dto.LastName ?? currentLastName;

                employee.Name = $"{firstName} {lastName}".Trim();
            }

            if (dto.Phone != null) employee.Phone = dto.Phone;
            if (dto.Email != null) employee.Email = dto.Email;
            if (dto.Position != null) employee.Position = dto.Position;
            if (dto.Bio != null) employee.Bio = dto.Bio;
            if (dto.IsActive.HasValue) employee.IsActive = dto.IsActive.Value;
            if (photoData != null) employee.PhotoData = photoData;

            if (dto.ServiceIds != null)
            {
                var requestedServiceIds = dto.ServiceIds.Distinct().ToList();
                ValidateBusinessServices(requestedServiceIds, business.Services.Select(s => s.Id));

                employee.EmployeeServices.Clear();
                foreach (var serviceId in requestedServiceIds)
                {
                    employee.EmployeeServices.Add(new EmployeeServiceAssignment
                    {
                        EmployeeId = employee.Id,
                        ServiceId = serviceId
                    });
                }
            }

            employee.UpdatedAt = DateTime.UtcNow;

            var updated = await _employeeRepository.UpdateAsync(employee);
            return _mapper.Map<EmployeeDto>(updated);
        }

        public async Task DeleteAsync(Guid id, Guid ownerId)
        {
            var employee = await _employeeRepository.GetByIdAsync(id);
            if (employee == null)
                throw new KeyNotFoundException("Empleado no encontrado");

            if (employee.Business?.OwnerId != ownerId)
                throw new UnauthorizedAccessException("No autorizado para eliminar este empleado");

            var business = employee.Business ?? await _businessRepository.GetByIdAsync(employee.BusinessId);
            if (business == null)
                throw new KeyNotFoundException("Negocio no encontrado");

            if (business.IsActive && employee.IsActive)
            {
                var activeEmployees = (await _employeeRepository.GetByBusinessIdAsync(employee.BusinessId))
                    .Count(e => e.IsActive);

                if (activeEmployees <= 1)
                    throw new InvalidOperationException("Tu negocio debe tener al menos un empleado activo para poder continuar.");
            }

            await _employeeRepository.DeleteAsync(id);
        }

        public async Task<InvitationResponseDto> GenerateInvitationAsync(Guid employeeId, Guid ownerId)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            if (employee == null)
                throw new KeyNotFoundException("Empleado no encontrado");

            if (employee.Business?.OwnerId != ownerId)
                throw new UnauthorizedAccessException("No autorizado para generar invitación para este empleado");

            // Generate secure token (long para seguridad)
            var token = GenerateSecureToken();
            // Generate short code (6 chars, easy to share)
            var shortCode = GenerateShortCode();
            
            employee.InvitationCode = shortCode;
            employee.InvitationToken = token;
            employee.InvitationTokenExpiry = DateTime.UtcNow.AddDays(InvitationTokenExpiryDays);
            employee.IsInvitationUsed = false;

            await _employeeRepository.UpdateAsync(employee);
            _logger.LogInformation("Invitación generada para empleado {EmployeeId}, código: {ShortCode}", employeeId, shortCode);

            // Generate invitation link - web URL that works in browser AND mobile app
            var webBaseUrl = "https://turnoya.app/auth/accept-invitation"; // Web and Capacitor browser
            var deepLinkBase = "turnoya://auth/accept-invitation"; // Native mobile app deep link
            
            // Generate both URLs - frontend can use appropriate one based on platform
            var webInvitationLink = $"{webBaseUrl}?token={token}&employeeId={employeeId}";
            var mobileInvitationLink = $"{deepLinkBase}?token={token}&employeeId={employeeId}";
            
            // Return web URL as primary (works everywhere), with mobile as alternative
            // The frontend should use the web URL and handle deep linking if needed
            var invitationLink = webInvitationLink;

            return new InvitationResponseDto(
                invitationLink,
                shortCode,
                employee.InvitationTokenExpiry.Value,
                employee.Name,
                employee.Id
            );
        }

        /// <summary>
        /// Genera un código corto de 6 caracteres para compartir fácilmente
        /// </summary>
        private string GenerateShortCode()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sin vocales para evitar palabras
            var random = new Random();
            var code = new char[6];
            for (int i = 0; i < 6; i++)
            {
                code[i] = chars[random.Next(chars.Length)];
            }
            return new string(code);
        }

        public async Task<AcceptInvitationResponseDto> AcceptInvitationAsync(AcceptInvitationDto dto)
        {
            // Find employee by token
            var employee = await _employeeRepository.GetByInvitationTokenAsync(dto.Token);
            if (employee == null)
                return new AcceptInvitationResponseDto(false, "Token de invitación inválido.", null);

            // Validate token
            if (employee.IsInvitationUsed)
                return new AcceptInvitationResponseDto(false, "Esta invitación ya ha sido utilizada.", null);

            if (employee.InvitationTokenExpiry.HasValue && employee.InvitationTokenExpiry.Value < DateTime.UtcNow)
                return new AcceptInvitationResponseDto(false, "El enlace de invitación ha expirado. Solicitá uno nuevo a tu empleador.", null);

            if (employee.InvitationToken != dto.Token)
                return new AcceptInvitationResponseDto(false, "Token de invitación inválido.", null);

            // Link the user to the employee
            if (dto.UserId.HasValue)
            {
                employee.UserId = dto.UserId.Value;
            }
            
            employee.IsInvitationUsed = true;
            employee.InvitationToken = null;
            employee.InvitationTokenExpiry = null;
            employee.IsActive = true;

            await _employeeRepository.UpdateAsync(employee);
            _logger.LogInformation("Empleado {EmployeeId} vinculado a usuario {UserId}", employee.Id, dto.UserId);

            return new AcceptInvitationResponseDto(true, "Empleado vinculado exitosamente.", employee.Id);
        }

        /// <summary>
        /// Acepta una invitación usando el código corto
        /// </summary>
        public async Task<AcceptInvitationResponseDto> AcceptInvitationByCodeAsync(string code, Guid userId)
        {
            var employee = await _employeeRepository.GetByInvitationCodeAsync(code);
            if (employee == null)
                return new AcceptInvitationResponseDto(false, "Código de invitación inválido.", null);

            if (employee.IsInvitationUsed)
                return new AcceptInvitationResponseDto(false, "Este código ya ha sido utilizado.", null);

            if (employee.InvitationTokenExpiry.HasValue && employee.InvitationTokenExpiry.Value < DateTime.UtcNow)
                return new AcceptInvitationResponseDto(false, "El código de invitación ha expirado. Solicitá uno nuevo a tu empleador.", null);

            // Link the user to the employee
            employee.UserId = userId;
            employee.IsInvitationUsed = true;
            employee.InvitationToken = null;
            employee.InvitationCode = null;
            employee.InvitationTokenExpiry = null;
            employee.IsActive = true;

            await _employeeRepository.UpdateAsync(employee);
            _logger.LogInformation("Empleado {EmployeeId} vinculado a usuario {UserId} por código {Code}", employee.Id, userId, code);

            return new AcceptInvitationResponseDto(true, "Te has asociado al negocio exitosamente.", employee.Id);
        }

        public async Task<Employee?> GetByInvitationTokenAsync(string token)
        {
            return await _employeeRepository.GetByInvitationTokenAsync(token);
        }

        private static string GenerateSecureToken()
        {
            var bytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }

        private static void ValidateBusinessServices(IEnumerable<Guid> requestedServiceIds, IEnumerable<Guid> businessServiceIds)
        {
            var businessServiceIdsSet = businessServiceIds.ToHashSet();
            var invalidServiceIds = requestedServiceIds.Where(serviceId => !businessServiceIdsSet.Contains(serviceId)).ToList();

            if (invalidServiceIds.Count > 0)
                throw new InvalidOperationException("Uno o más servicios seleccionados no pertenecen al negocio.");
        }
    }
}