using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using TurnoYa.API.Controllers;
using TurnoYa.Application.DTOs.Device;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;
using Xunit;

namespace TurnoYa.Tests.IntegrationTests
{
    /// <summary>
    /// Integration tests para DevicesController.
    /// Tests: POST/DELETE endpoints con JWT auth y ownership check.
    /// Ref: Spec — "Device Token Registration" and "Device Token Cleanup" scenarios.
    /// </summary>
    public class DevicesControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IUserDeviceTokenRepository> _repositoryMock;
        private readonly Mock<ILogger<DevicesController>> _loggerMock;
        private readonly DevicesController _controller;

        public DevicesControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _repositoryMock = new Mock<IUserDeviceTokenRepository>();
            _loggerMock = new Mock<ILogger<DevicesController>>();

            _controller = new DevicesController(
                _repositoryMock.Object,
                _loggerMock.Object);

            // Setup authenticated user by default
            SetupAuthenticatedUser(Guid.NewGuid());
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        private void SetupAuthenticatedUser(Guid userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        private void SetupUnauthenticatedUser()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
            };
        }

        #region RegisterDevice - Success Scenarios

        /// <summary>
        /// Scenario: Successful device registration.
        /// Spec: "GIVEN an authenticated user with valid FCM token
        ///       WHEN the user calls POST /devices/register with valid token
        ///       THEN the system SHALL store UserDeviceToken
        ///       AND return HTTP 201 with deviceId"
        /// </summary>
        [Fact]
        public async Task RegisterDevice_WithValidRequest_Returns201Created()
        {
            // Arrange
            var userId = Guid.NewGuid();
            SetupAuthenticatedUser(userId);

            _repositoryMock
                .Setup(x => x.GetByTokenAsync(It.IsAny<string>()))
                .ReturnsAsync((UserDeviceToken?)null);

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(new List<UserDeviceToken>());

            _repositoryMock
                .Setup(x => x.AddAsync(It.IsAny<UserDeviceToken>()))
                .ReturnsAsync((UserDeviceToken entity) => entity);

            var dto = new RegisterDeviceDto("valid_fcm_token", "android");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(201, createdResult.StatusCode);
            var response = Assert.IsType<DeviceRegistrationResponse>(createdResult.Value);
            Assert.False(response.IsExisting);
            Assert.NotEqual(Guid.Empty, response.DeviceId);
        }

        /// <summary>
        /// Scenario: Duplicate token from same device — idempotent.
        /// Spec: "GIVEN a user who already registered token 'abc123'
        ///       WHEN the same token is submitted again
        ///       THEN the system SHALL return HTTP 200 (idempotent) with existing deviceId
        ///       AND NOT create a duplicate record"
        /// </summary>
        [Fact]
        public async Task RegisterDevice_WithExistingToken_Returns200Idempotent()
        {
            // Arrange
            var userId = Guid.NewGuid();
            SetupAuthenticatedUser(userId);

            var existingDevice = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = "existing_fcm_token",
                Platform = "android",
                IsActive = true
            };

            _repositoryMock
                .Setup(x => x.GetByTokenAsync("existing_fcm_token"))
                .ReturnsAsync(existingDevice);

            var dto = new RegisterDeviceDto("existing_fcm_token", "android");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(200, okResult.StatusCode);
            var response = Assert.IsType<DeviceRegistrationResponse>(okResult.Value);
            Assert.True(response.IsExisting);
            Assert.Equal(existingDevice.Id, response.DeviceId);

            // Should NOT call AddAsync (no duplicate created)
            _repositoryMock.Verify(x => x.AddAsync(It.IsAny<UserDeviceToken>()), Times.Never);
        }

        [Fact]
        public async Task RegisterDevice_WithIosPlatform_Returns201Created()
        {
            // Arrange
            var userId = Guid.NewGuid();
            SetupAuthenticatedUser(userId);

            _repositoryMock
                .Setup(x => x.GetByTokenAsync(It.IsAny<string>()))
                .ReturnsAsync((UserDeviceToken?)null);

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(new List<UserDeviceToken>());

            _repositoryMock
                .Setup(x => x.AddAsync(It.IsAny<UserDeviceToken>()))
                .ReturnsAsync((UserDeviceToken entity) => entity);

            var dto = new RegisterDeviceDto("ios_fcm_token", "ios");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal(201, createdResult.StatusCode);
        }

        [Fact]
        public async Task RegisterDevice_WithUppercasePlatform_NormalizesToLowercase()
        {
            // Arrange
            var userId = Guid.NewGuid();
            SetupAuthenticatedUser(userId);

            UserDeviceToken? capturedEntity = null;
            _repositoryMock
                .Setup(x => x.GetByTokenAsync(It.IsAny<string>()))
                .ReturnsAsync((UserDeviceToken?)null);

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(new List<UserDeviceToken>());

            _repositoryMock
                .Setup(x => x.AddAsync(It.IsAny<UserDeviceToken>()))
                .Callback<UserDeviceToken>(t => capturedEntity = t)
                .ReturnsAsync((UserDeviceToken entity) => entity);

            var dto = new RegisterDeviceDto("token", "ANDROID"); // uppercase

            // Act
            await _controller.RegisterDevice(dto);

            // Assert
            Assert.NotNull(capturedEntity);
            Assert.Equal("android", capturedEntity.Platform); // normalized to lowercase
        }

        #endregion

        #region RegisterDevice - Validation Errors

        [Fact]
        public async Task RegisterDevice_WithInvalidPlatform_Returns400()
        {
            // Arrange
            var dto = new RegisterDeviceDto("fcm_token", "windows");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);
            var problemDetails = Assert.IsType<ProblemDetails>(badRequestResult.Value);
            Assert.Equal("Plataforma inválida", problemDetails.Title);
        }

        [Fact]
        public async Task RegisterDevice_WithEmptyToken_Returns400()
        {
            // Arrange
            var dto = new RegisterDeviceDto("", "android");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);
            var problemDetails = Assert.IsType<ProblemDetails>(badRequestResult.Value);
            Assert.Equal("Token requerido", problemDetails.Title);
        }

        [Fact]
        public async Task RegisterDevice_WithWhitespaceToken_Returns400()
        {
            // Arrange
            var dto = new RegisterDeviceDto("   ", "ios");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(400, badRequestResult.StatusCode);
        }

        /// <summary>
        /// Scenario: Token rejected — unauthenticated.
        /// Spec: "GIVEN a request without valid JWT Bearer token
        ///       WHEN the user calls POST /devices/register
        ///       THEN the system SHALL return HTTP 401 Unauthorized"
        /// </summary>
        [Fact]
        public async Task RegisterDevice_WithoutAuthentication_Returns401()
        {
            // Arrange
            SetupUnauthenticatedUser();
            var dto = new RegisterDeviceDto("fcm_token", "android");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal(401, unauthorizedResult.StatusCode);
        }

        /// <summary>
        /// Scenario: Token belongs to another user — conflict.
        /// </summary>
        [Fact]
        public async Task RegisterDevice_WithTokenOwnedByOtherUser_Returns422()
        {
            // Arrange
            var currentUserId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            SetupAuthenticatedUser(currentUserId);

            var otherUserToken = new UserDeviceToken
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId, // different user
                Token = "shared_token",
                Platform = "android",
                IsActive = true
            };

            _repositoryMock
                .Setup(x => x.GetByTokenAsync("shared_token"))
                .ReturnsAsync(otherUserToken);

            var dto = new RegisterDeviceDto("shared_token", "android");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var unprocessableResult = Assert.IsType<UnprocessableEntityObjectResult>(result);
            Assert.Equal(422, unprocessableResult.StatusCode);
            var problemDetails = Assert.IsType<ProblemDetails>(unprocessableResult.Value);
            Assert.Equal("Token en uso", problemDetails.Title);
        }

        /// <summary>
        /// Scenario: Maximum devices limit exceeded.
        /// </summary>
        [Fact]
        public async Task RegisterDevice_AtDeviceLimit_Returns422()
        {
            // Arrange
            var userId = Guid.NewGuid();
            SetupAuthenticatedUser(userId);

            var existingDevices = new List<UserDeviceToken>();
            for (int i = 0; i < 5; i++)
            {
                existingDevices.Add(new UserDeviceToken
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Token = $"existing_token_{i}",
                    Platform = "android",
                    IsActive = true
                });
            }

            _repositoryMock
                .Setup(x => x.GetByTokenAsync(It.IsAny<string>()))
                .ReturnsAsync((UserDeviceToken?)null);

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(existingDevices);

            var dto = new RegisterDeviceDto("new_token", "android");

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var unprocessableResult = Assert.IsType<UnprocessableEntityObjectResult>(result);
            Assert.Equal(422, unprocessableResult.StatusCode);
            var problemDetails = Assert.IsType<ProblemDetails>(unprocessableResult.Value);
            Assert.Contains("5 dispositivos", problemDetails.Detail);
        }

        #endregion

        #region DeleteDevice - Success Scenarios

        /// <summary>
        /// Scenario: Explicit token deletion.
        /// Spec: "GIVEN an authenticated user with registered device
        ///       WHEN the user calls DELETE /devices/register/{deviceId}
        ///       THEN the system SHALL remove the UserDeviceToken record
        ///       AND return HTTP 204"
        /// </summary>
        [Fact]
        public async Task DeleteDevice_WithOwnedDevice_Returns204()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var deviceId = Guid.NewGuid();
            SetupAuthenticatedUser(userId);

            var userDevice = new UserDeviceToken
            {
                Id = deviceId,
                UserId = userId,
                Token = "token_to_delete",
                Platform = "android",
                IsActive = true
            };

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(new List<UserDeviceToken> { userDevice });

            _repositoryMock
                .Setup(x => x.DeleteAsync(deviceId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteDevice(deviceId);

            // Assert
            Assert.IsType<NoContentResult>(result);
            _repositoryMock.Verify(x => x.DeleteAsync(deviceId), Times.Once);
        }

        /// <summary>
        /// Scenario: Deletion of non-owned device.
        /// Spec: "GIVEN user A is authenticated
        ///       WHEN user A attempts DELETE /devices/register/{deviceId} belonging to user B
        ///       THEN the system SHALL return HTTP 404 Not Found"
        /// </summary>
        [Fact]
        public async Task DeleteDevice_WithOtherUsersDevice_Returns404()
        {
            // Arrange
            var currentUserId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            SetupAuthenticatedUser(currentUserId);

            // Current user has NO devices in the repository
            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(currentUserId))
                .ReturnsAsync(new List<UserDeviceToken>());

            var otherUsersDeviceId = Guid.NewGuid();

            // Act
            var result = await _controller.DeleteDevice(otherUsersDeviceId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal(404, notFoundResult.StatusCode);
            
            // Should NOT call DeleteAsync (security: don't reveal device exists)
            _repositoryMock.Verify(x => x.DeleteAsync(It.IsAny<Guid>()), Times.Never);
        }

        [Fact]
        public async Task DeleteDevice_WithoutAuthentication_Returns401()
        {
            // Arrange
            SetupUnauthenticatedUser();

            // Act
            var result = await _controller.DeleteDevice(Guid.NewGuid());

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.Equal(401, unauthorizedResult.StatusCode);
        }

        [Fact]
        public async Task DeleteDevice_WithNonExistentDevice_Returns404()
        {
            // Arrange
            var userId = Guid.NewGuid();
            SetupAuthenticatedUser(userId);

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(new List<UserDeviceToken>());

            // Act
            var result = await _controller.DeleteDevice(Guid.NewGuid());

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal(404, notFoundResult.StatusCode);
        }

        #endregion

        #region ProblemDetails Format

        [Fact]
        public async Task RegisterDevice_ReturnsProblemDetails_WithCorrectFormat()
        {
            // Arrange
            var dto = new RegisterDeviceDto("", "invalid");
            SetupAuthenticatedUser(Guid.NewGuid());

            // Act
            var result = await _controller.RegisterDevice(dto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var problemDetails = Assert.IsType<ProblemDetails>(badRequestResult.Value);
            
            Assert.NotNull(problemDetails.Type);
            Assert.Contains("httpstatuses.com", problemDetails.Type);
            Assert.NotNull(problemDetails.Instance);
        }

        #endregion
    }
}
