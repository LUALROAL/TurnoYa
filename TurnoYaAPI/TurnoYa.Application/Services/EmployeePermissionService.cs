using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;

namespace TurnoYa.Application.Services
{
    public class EmployeePermissionService : IEmployeePermissionService
    {
        private readonly IEmployeePermissionRepository _permissionRepository;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly ILogger<EmployeePermissionService> _logger;

        public EmployeePermissionService(
            IEmployeePermissionRepository permissionRepository,
            IEmployeeRepository employeeRepository,
            ILogger<EmployeePermissionService> logger)
        {
            _permissionRepository = permissionRepository;
            _employeeRepository = employeeRepository;
            _logger = logger;
        }

        public async Task<EmployeePermissionsDto?> GetPermissionsAsync(Guid employeeId)
        {
            var permission = await _permissionRepository.GetByEmployeeIdAsync(employeeId);
            if (permission == null) return null;

            return new EmployeePermissionsDto(
                permission.EmployeeId,
                permission.CanViewAppointments,
                permission.CanAcceptAppointments,
                permission.CanRejectAppointments,
                permission.CanCancelAppointments,
                permission.CanRescheduleAppointments,
                permission.CanManageSchedule,
                permission.CanViewServices,
                permission.CanManageServices
            );
        }

        public async Task<EmployeePermissionsDto> UpdatePermissionsAsync(Guid employeeId, UpdateEmployeePermissionsDto dto)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId);
            if (employee == null)
                throw new KeyNotFoundException($"Empleado con ID {employeeId} no encontrado");

            var existingPermission = await _permissionRepository.GetByEmployeeIdAsync(employeeId);
            
            EmployeePermission permission;
            if (existingPermission == null)
            {
                permission = new EmployeePermission
                {
                    EmployeeId = employeeId,
                    CanViewAppointments = dto.CanViewAppointments,
                    CanAcceptAppointments = dto.CanAcceptAppointments,
                    CanRejectAppointments = dto.CanRejectAppointments,
                    CanCancelAppointments = dto.CanCancelAppointments,
                    CanRescheduleAppointments = dto.CanRescheduleAppointments,
                    CanManageSchedule = dto.CanManageSchedule,
                    CanViewServices = dto.CanViewServices,
                    CanManageServices = dto.CanManageServices
                };
                await _permissionRepository.CreateAsync(permission);
                _logger.LogInformation("Permisos creados para empleado {EmployeeId}", employeeId);
            }
            else
            {
                existingPermission.CanViewAppointments = dto.CanViewAppointments;
                existingPermission.CanAcceptAppointments = dto.CanAcceptAppointments;
                existingPermission.CanRejectAppointments = dto.CanRejectAppointments;
                existingPermission.CanCancelAppointments = dto.CanCancelAppointments;
                existingPermission.CanRescheduleAppointments = dto.CanRescheduleAppointments;
                existingPermission.CanManageSchedule = dto.CanManageSchedule;
                existingPermission.CanViewServices = dto.CanViewServices;
                existingPermission.CanManageServices = dto.CanManageServices;
                
                await _permissionRepository.UpdateAsync(existingPermission);
                _logger.LogInformation("Permisos actualizados para empleado {EmployeeId}", employeeId);
                permission = existingPermission;
            }

            return new EmployeePermissionsDto(
                permission.EmployeeId,
                permission.CanViewAppointments,
                permission.CanAcceptAppointments,
                permission.CanRejectAppointments,
                permission.CanCancelAppointments,
                permission.CanRescheduleAppointments,
                permission.CanManageSchedule,
                permission.CanViewServices,
                permission.CanManageServices
            );
        }

        public async Task<bool> HasPermissionAsync(Guid employeeId, string permission)
        {
            var permissions = await GetPermissionsAsync(employeeId);
            if (permissions == null) return false;

            return permission.ToLower() switch
            {
                "view_appointments" => permissions.CanViewAppointments,
                "accept_appointments" => permissions.CanAcceptAppointments,
                "reject_appointments" => permissions.CanRejectAppointments,
                "cancel_appointments" => permissions.CanCancelAppointments,
                "reschedule_appointments" => permissions.CanRescheduleAppointments,
                "manage_schedule" => permissions.CanManageSchedule,
                "view_services" => permissions.CanViewServices,
                "manage_services" => permissions.CanManageServices,
                _ => false
            };
        }
    }
}
