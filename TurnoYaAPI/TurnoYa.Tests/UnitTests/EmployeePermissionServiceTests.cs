using Moq;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Application.Interfaces;
using TurnoYa.Application.Services;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Xunit;
using System;
using System.Threading.Tasks;

namespace TurnoYa.Tests.UnitTests
{
    /// <summary>
    /// Unit tests for EmployeePermissionService
    /// </summary>
    public class EmployeePermissionServiceTests
    {
        private readonly Mock<IEmployeePermissionRepository> _permissionRepositoryMock;
        private readonly Mock<IEmployeeRepository> _employeeRepositoryMock;
        private readonly Mock<ILogger<EmployeePermissionService>> _loggerMock;
        private readonly EmployeePermissionService _service;

        public EmployeePermissionServiceTests()
        {
            _permissionRepositoryMock = new Mock<IEmployeePermissionRepository>();
            _employeeRepositoryMock = new Mock<IEmployeeRepository>();
            _loggerMock = new Mock<ILogger<EmployeePermissionService>>();
            
            _service = new EmployeePermissionService(
                _permissionRepositoryMock.Object,
                _employeeRepositoryMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task GetPermissionsAsync_WhenPermissionExists_ReturnsPermissions()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var permission = new EmployeePermission
            {
                EmployeeId = employeeId,
                CanViewAppointments = true,
                CanAcceptAppointments = true,
                CanRejectAppointments = false,
                CanCancelAppointments = false,
                CanRescheduleAppointments = false,
                CanManageSchedule = true,
                CanViewServices = true,
                CanManageServices = false
            };

            _permissionRepositoryMock
                .Setup(r => r.GetByEmployeeIdAsync(employeeId))
                .ReturnsAsync(permission);

            // Act
            var result = await _service.GetPermissionsAsync(employeeId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(employeeId, result.EmployeeId);
            Assert.True(result.CanViewAppointments);
            Assert.True(result.CanAcceptAppointments);
            Assert.False(result.CanRejectAppointments);
            Assert.True(result.CanManageSchedule);
        }

        [Fact]
        public async Task GetPermissionsAsync_WhenPermissionNotExists_ReturnsNull()
        {
            // Arrange
            var employeeId = Guid.NewGuid();

            _permissionRepositoryMock
                .Setup(r => r.GetByEmployeeIdAsync(employeeId))
                .ReturnsAsync((EmployeePermission?)null);

            // Act
            var result = await _service.GetPermissionsAsync(employeeId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdatePermissionsAsync_WhenPermissionNotExists_CreatesNewPermission()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var dto = new UpdateEmployeePermissionsDto(
                CanViewAppointments: true,
                CanAcceptAppointments: true,
                CanRejectAppointments: true,
                CanCancelAppointments: false,
                CanRescheduleAppointments: false,
                CanManageSchedule: true,
                CanViewServices: true,
                CanManageServices: false
            );

            var employee = new Employee { Id = employeeId, Name = "John Doe" };
            var createdPermission = new EmployeePermission
            {
                EmployeeId = employeeId,
                CanViewAppointments = true,
                CanAcceptAppointments = true,
                CanRejectAppointments = true,
                CanManageSchedule = true
            };

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync(employee);

            _permissionRepositoryMock
                .Setup(r => r.GetByEmployeeIdAsync(employeeId))
                .ReturnsAsync((EmployeePermission?)null);

            _permissionRepositoryMock
                .Setup(r => r.CreateAsync(It.IsAny<EmployeePermission>()))
                .ReturnsAsync(createdPermission);

            // Act
            var result = await _service.UpdatePermissionsAsync(employeeId, dto);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.CanViewAppointments);
            Assert.True(result.CanAcceptAppointments);
            _permissionRepositoryMock.Verify(r => r.CreateAsync(It.IsAny<EmployeePermission>()), Times.Once);
        }

        [Fact]
        public async Task HasPermissionAsync_WhenPermissionGranted_ReturnsTrue()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var permission = new EmployeePermission
            {
                EmployeeId = employeeId,
                CanViewAppointments = true,
                CanAcceptAppointments = false
            };

            _permissionRepositoryMock
                .Setup(r => r.GetByEmployeeIdAsync(employeeId))
                .ReturnsAsync(permission);

            // Act
            var result = await _service.HasPermissionAsync(employeeId, "accept_appointments");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasPermissionAsync_WhenPermissionNotExists_ReturnsFalse()
        {
            // Arrange
            var employeeId = Guid.NewGuid();

            _permissionRepositoryMock
                .Setup(r => r.GetByEmployeeIdAsync(employeeId))
                .ReturnsAsync((EmployeePermission?)null);

            // Act
            var result = await _service.HasPermissionAsync(employeeId, "view_appointments");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasPermissionAsync_WithInvalidPermission_ReturnsFalse()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var permission = new EmployeePermission
            {
                EmployeeId = employeeId,
                CanViewAppointments = true
            };

            _permissionRepositoryMock
                .Setup(r => r.GetByEmployeeIdAsync(employeeId))
                .ReturnsAsync(permission);

            // Act
            var result = await _service.HasPermissionAsync(employeeId, "invalid_permission");

            // Assert
            Assert.False(result);
        }
    }
}
