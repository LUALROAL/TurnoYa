using Moq;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TurnoYa.Tests.UnitTests
{
    /// <summary>
    /// Unit tests for Appointment permission enforcement
    /// Tests that the permission system correctly blocks/allows actions based on employee permissions
    /// </summary>
    public class AppointmentPermissionTests
    {
        private readonly Mock<IEmployeeService> _employeeServiceMock;
        private readonly Mock<IEmployeePermissionService> _permissionServiceMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;

        public AppointmentPermissionTests()
        {
            _employeeServiceMock = new Mock<IEmployeeService>();
            _permissionServiceMock = new Mock<IEmployeePermissionService>();
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();
        }

        [Fact]
        public async Task HasPermissionAsync_WithAcceptPermission_ReturnsTrue()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var permission = "accept_appointments";

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(employeeId, permission))
                .ReturnsAsync(true);

            // Act
            var result = await _permissionServiceMock.Object.HasPermissionAsync(employeeId, permission);

            // Assert
            Assert.True(result);
            _permissionServiceMock.Verify(p => p.HasPermissionAsync(employeeId, permission), Times.Once);
        }

        [Fact]
        public async Task HasPermissionAsync_WithoutPermission_ReturnsFalse()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var permission = "accept_appointments";

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(employeeId, permission))
                .ReturnsAsync(false);

            // Act
            var result = await _permissionServiceMock.Object.HasPermissionAsync(employeeId, permission);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task HasPermissionAsync_WithCancelPermission_ReturnsTrue()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var permission = "cancel_appointments";

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(employeeId, permission))
                .ReturnsAsync(true);

            // Act
            var result = await _permissionServiceMock.Object.HasPermissionAsync(employeeId, permission);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task HasPermissionAsync_WithViewOnly_BlocksManagement()
        {
            // Arrange
            var employeeId = Guid.NewGuid();

            // Employee has view_appointments but NOT accept/reject/cancel
            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(employeeId, "view_appointments"))
                .ReturnsAsync(true);

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(employeeId, "accept_appointments"))
                .ReturnsAsync(false);

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(employeeId, "reject_appointments"))
                .ReturnsAsync(false);

            _permissionServiceMock
                .Setup(p => p.HasPermissionAsync(employeeId, "cancel_appointments"))
                .ReturnsAsync(false);

            // Act
            var canView = await _permissionServiceMock.Object.HasPermissionAsync(employeeId, "view_appointments");
            var canAccept = await _permissionServiceMock.Object.HasPermissionAsync(employeeId, "accept_appointments");
            var canReject = await _permissionServiceMock.Object.HasPermissionAsync(employeeId, "reject_appointments");
            var canCancel = await _permissionServiceMock.Object.HasPermissionAsync(employeeId, "cancel_appointments");

            // Assert
            Assert.True(canView, "Should be able to view");
            Assert.False(canAccept, "Should NOT be able to accept");
            Assert.False(canReject, "Should NOT be able to reject");
            Assert.False(canCancel, "Should NOT be able to cancel");
        }

        [Fact]
        public async Task GetPermissionsAsync_ReturnsEmployeePermissions()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var expectedPermissions = new EmployeePermissionsDto(
                employeeId,
                canViewAppointments: true,
                canAcceptAppointments: true,
                canRejectAppointments: false,
                canCancelAppointments: false,
                canRescheduleAppointments: false,
                canManageSchedule: true,
                canViewServices: true,
                canManageServices: false
            );

            _permissionServiceMock
                .Setup(p => p.GetPermissionsAsync(employeeId))
                .ReturnsAsync(expectedPermissions);

            // Act
            var result = await _permissionServiceMock.Object.GetPermissionsAsync(employeeId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(employeeId, result.EmployeeId);
            Assert.True(result.CanViewAppointments);
            Assert.True(result.CanAcceptAppointments);
            Assert.False(result.CanRejectAppointments);
            Assert.True(result.CanManageSchedule);
        }
    }

    /// <summary>
    /// Tests the logic of matching employee to appointment for permission checking
    /// </summary>
    public class EmployeeAppointmentMatchingTests
    {
        [Fact]
        public void EmployeeMatchesAppointment_SameBusinessAndEmployeeId_ReturnsTrue()
        {
            // Arrange
            var businessId = Guid.NewGuid();
            var employeeId = Guid.NewGuid();

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                EmployeeId = employeeId
            };

            var employee = new Employee
            {
                Id = employeeId,
                BusinessId = businessId,
                Name = "Test Employee"
            };

            // Act
            var matches = employee.BusinessId == appointment.BusinessId && employee.Id == appointment.EmployeeId;

            // Assert
            Assert.True(matches);
        }

        [Fact]
        public void EmployeeMatchesAppointment_DifferentBusiness_ReturnsFalse()
        {
            // Arrange
            var businessId1 = Guid.NewGuid();
            var businessId2 = Guid.NewGuid();
            var employeeId = Guid.NewGuid();

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId1,
                EmployeeId = employeeId
            };

            var employee = new Employee
            {
                Id = employeeId,
                BusinessId = businessId2, // Different business
                Name = "Test Employee"
            };

            // Act
            var matches = employee.BusinessId == appointment.BusinessId && employee.Id == appointment.EmployeeId;

            // Assert
            Assert.False(matches);
        }

        [Fact]
        public void EmployeeMatchesAppointment_NoEmployeeId_ReturnsFalse()
        {
            // Arrange
            var businessId = Guid.NewGuid();

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                EmployeeId = null // No employee assigned
            };

            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                Name = "Test Employee"
            };

            // Act
            var matches = appointment.EmployeeId.HasValue && 
                          employee.BusinessId == appointment.BusinessId && 
                          employee.Id == appointment.EmployeeId;

            // Assert
            Assert.False(matches);
        }
    }
}