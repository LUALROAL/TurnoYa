using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
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

        public EmployeeService(
            IEmployeeRepository employeeRepository,
            IBusinessRepository businessRepository,
            IMapper mapper)
        {
            _employeeRepository = employeeRepository;
            _businessRepository = businessRepository;
            _mapper = mapper;
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

            await _employeeRepository.DeleteAsync(id);
        }
    }
}