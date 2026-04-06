using Moq;
using TurnoYa.Application.DTOs.Employee;
using TurnoYa.Application.Interfaces;
using TurnoYa.Application.Services;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Xunit;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace TurnoYa.Tests.UnitTests
{
    /// <summary>
    /// Unit tests for EmployeeService invitation functionality
    /// </summary>
    public class EmployeeServiceInvitationTests
    {
        private readonly Mock<IEmployeeRepository> _employeeRepositoryMock;
        private readonly Mock<IBusinessRepository> _businessRepositoryMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<ILogger<EmployeeService>> _loggerMock;
        private readonly EmployeeService _service;

        public EmployeeServiceInvitationTests()
        {
            _employeeRepositoryMock = new Mock<IEmployeeRepository>();
            _businessRepositoryMock = new Mock<IBusinessRepository>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<EmployeeService>>();
            
            _service = new EmployeeService(
                _employeeRepositoryMock.Object,
                _businessRepositoryMock.Object,
                _mapperMock.Object,
                _loggerMock.Object
            );
        }

        [Fact]
        public async Task GenerateInvitationAsync_WhenEmployeeExists_ReturnsInvitationLink()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var businessId = Guid.NewGuid();
            
            var business = new Business 
            { 
                Id = businessId, 
                OwnerId = ownerId, 
                Name = "Test Business" 
            };
            
            var employee = new Employee 
            { 
                Id = employeeId, 
                BusinessId = businessId, 
                Business = business,
                Name = "John Doe",
                IsInvitationUsed = false
            };

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync(employee);

            _employeeRepositoryMock
                .Setup(r => r.UpdateAsync(It.IsAny<Employee>()))
                .ReturnsAsync((Employee e) => e);

            // Act
            var result = await _service.GenerateInvitationAsync(employeeId, ownerId);

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.InvitationLink);
            Assert.Contains("token=", result.InvitationLink);
            Assert.Equal("John Doe", result.EmployeeName);
            Assert.True(result.ExpiresAt > DateTime.UtcNow);
        }

        [Fact]
        public async Task GenerateInvitationAsync_WhenEmployeeNotFound_ThrowsException()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync((Employee?)null);

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() => 
                _service.GenerateInvitationAsync(employeeId, ownerId));
        }

        [Fact]
        public async Task GenerateInvitationAsync_WhenNotOwner_ThrowsUnauthorizedException()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var ownerId = Guid.NewGuid();
            var otherOwnerId = Guid.NewGuid();
            var businessId = Guid.NewGuid();
            
            var business = new Business 
            { 
                Id = businessId, 
                OwnerId = otherOwnerId, 
                Name = "Test Business" 
            };
            
            var employee = new Employee 
            { 
                Id = employeeId, 
                BusinessId = businessId, 
                Business = business,
                Name = "John Doe"
            };

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync(employee);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => 
                _service.GenerateInvitationAsync(employeeId, ownerId));
        }

        [Fact]
        public async Task AcceptInvitationAsync_WithValidToken_ReturnsSuccess()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var token = "valid_token_123";
            
            var employee = new Employee 
            { 
                Id = employeeId, 
                InvitationToken = token,
                InvitationTokenExpiry = DateTime.UtcNow.AddDays(7),
                IsInvitationUsed = false,
                Name = "John Doe"
            };

            var dto = new AcceptInvitationDto(token, userId);

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync(employee);

            _employeeRepositoryMock
                .Setup(r => r.UpdateAsync(It.IsAny<Employee>()))
                .ReturnsAsync((Employee e) => e);

            // Act
            var result = await _service.AcceptInvitationAsync(dto);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Empleado vinculado exitosamente.", result.Message);
            Assert.Equal(employeeId, result.EmployeeId);
        }

        [Fact]
        public async Task AcceptInvitationAsync_WithExpiredToken_ReturnsError()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var token = "expired_token";
            
            var employee = new Employee 
            { 
                Id = employeeId, 
                InvitationToken = token,
                InvitationTokenExpiry = DateTime.UtcNow.AddDays(-1), // Expired
                IsInvitationUsed = false,
                Name = "John Doe"
            };

            var dto = new AcceptInvitationDto(token, userId);

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync(employee);

            // Act
            var result = await _service.AcceptInvitationAsync(dto);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("expirado", result.Message);
        }

        [Fact]
        public async Task AcceptInvitationAsync_WithUsedToken_ReturnsError()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var token = "used_token";
            
            var employee = new Employee 
            { 
                Id = employeeId, 
                InvitationToken = token,
                InvitationTokenExpiry = DateTime.UtcNow.AddDays(7),
                IsInvitationUsed = true, // Already used
                Name = "John Doe"
            };

            var dto = new AcceptInvitationDto(token, userId);

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync(employee);

            // Act
            var result = await _service.AcceptInvitationAsync(dto);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("ya ha sido utilizada", result.Message);
        }

        [Fact]
        public async Task AcceptInvitationAsync_WithInvalidToken_ReturnsError()
        {
            // Arrange
            var employeeId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var validToken = "valid_token";
            var invalidToken = "invalid_token";
            
            var employee = new Employee 
            { 
                Id = employeeId, 
                InvitationToken = validToken,
                InvitationTokenExpiry = DateTime.UtcNow.AddDays(7),
                IsInvitationUsed = false,
                Name = "John Doe"
            };

            var dto = new AcceptInvitationDto(invalidToken, userId);

            _employeeRepositoryMock
                .Setup(r => r.GetByIdAsync(employeeId))
                .ReturnsAsync(employee);

            // Act
            var result = await _service.AcceptInvitationAsync(dto);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("inválido", result.Message);
        }

        [Fact]
        public async Task GetByInvitationTokenAsync_WithValidToken_ReturnsEmployee()
        {
            // Arrange
            var token = "valid_token_123";
            var employee = new Employee 
            { 
                Id = Guid.NewGuid(), 
                InvitationToken = token,
                InvitationTokenExpiry = DateTime.UtcNow.AddDays(7),
                IsInvitationUsed = false,
                Name = "John Doe"
            };

            _employeeRepositoryMock
                .Setup(r => r.GetByInvitationTokenAsync(token))
                .ReturnsAsync(employee);

            // Act
            var result = await _service.GetByInvitationTokenAsync(token);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(token, result.InvitationToken);
        }

        [Fact]
        public async Task GetByInvitationTokenAsync_WithExpiredToken_ReturnsNull()
        {
            // Arrange
            var token = "expired_token";
            
            _employeeRepositoryMock
                .Setup(r => r.GetByInvitationTokenAsync(token))
                .ReturnsAsync((Employee?)null);

            // Act
            var result = await _service.GetByInvitationTokenAsync(token);

            // Assert
            Assert.Null(result);
        }
    }
}
