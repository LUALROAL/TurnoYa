using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;
using TurnoYa.Infrastructure.Repositories;
using TurnoYa.Infrastructure.Services;
using Xunit;

namespace TurnoYa.Tests.UnitTests
{
    /// <summary>
    /// Unit tests para PushNotificationService.
    /// Mockea IFirebaseMessagingClient y IUserDeviceTokenRepository.
    /// Tests: FCM response handling, error codes (InvalidRegistration, Unregistered), 
    ///        token cleanup logic, retry + circuit breaker.
    /// Ref: Spec — "Token Lifecycle Management" scenarios.
    /// </summary>
    public class PushNotificationServiceTests : IDisposable
    {
        private readonly Mock<IFirebaseMessagingClient> _firebaseClientMock;
        private readonly Mock<IUserDeviceTokenRepository> _repositoryMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<ILogger<PushNotificationService>> _loggerMock;
        private readonly ApplicationDbContext _context;
        private readonly UserDeviceTokenRepository _repository;
        private readonly PushNotificationService _service;

        public PushNotificationServiceTests()
        {
            _firebaseClientMock = new Mock<IFirebaseMessagingClient>();
            _repositoryMock = new Mock<IUserDeviceTokenRepository>();
            _configMock = new Mock<IConfiguration>();
            _loggerMock = new Mock<ILogger<PushNotificationService>>();

            // Configurar credentials path vacío para skip inicialización Firebase
            _configMock.Setup(x => x["Firebase:CredentialsPath"]).Returns((string?)null);

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new ApplicationDbContext(options);
            _repository = new UserDeviceTokenRepository(_context);

            // Reset static state antes de cada test
            ResetCircuitBreaker();

            _service = new PushNotificationService(
                _repository,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);
        }

        public void Dispose()
        {
            ResetCircuitBreaker();
            _context.Dispose();
        }

        private static void ResetCircuitBreaker()
        {
            // Reset static fields via reflection para isolation entre tests
            var type = typeof(PushNotificationService);
            var failureCountField = type.GetField("_failureCount", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var successCountField = type.GetField("_successCount", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var cbOpenField = type.GetField("_circuitBreakerOpen", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var fbInitField = type.GetField("_firebaseInitialized", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);

            if (failureCountField != null) failureCountField.SetValue(null, 0);
            if (successCountField != null) successCountField.SetValue(null, 0);
            if (cbOpenField != null) cbOpenField.SetValue(null, false);
            if (fbInitField != null) fbInitField.SetValue(null, false);
        }

        #region SendPushAsync - Success

        [Fact]
        public async Task SendPushAsync_WithSuccessfulDelivery_ReturnsSucceeded()
        {
            // Arrange
            _firebaseClientMock
                .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((true, "msg_123", (string?)null, (string?)null));

            // Act
            var result = await _service.SendPushAsync("fcm_token", "Test Title", "Test Body");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("msg_123", result.MessageId);
            Assert.Null(result.ErrorCode);
        }

        [Fact]
        public async Task SendPushAsync_WithDataPayload_PassesDataToFirebase()
        {
            // Arrange
            Dictionary<string, string>? capturedData = null;
            _firebaseClientMock
                .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .Callback<string, string, string, Dictionary<string, string>?>((token, title, body, data) => capturedData = data)
                .ReturnsAsync((true, "msg_456", (string?)null, (string?)null));

            var data = new Dictionary<string, string>
            {
                { "appointmentId", "abc-123" },
                { "type", "appointment_created" }
            };

            // Act
            await _service.SendPushAsync("fcm_token", "Title", "Body", data);

            // Assert
            Assert.NotNull(capturedData);
            Assert.Equal("abc-123", capturedData["appointmentId"]);
            Assert.Equal("appointment_created", capturedData["type"]);
        }

        #endregion

        #region SendPushAsync - FCM Error Codes

        /// <summary>
        /// Scenario: FCM returns "InvalidRegistration" — token is stale, must be deleted.
        /// Spec: "GIVEN IPushNotificationService receives error 'InvalidRegistration' from FCM
        ///       WHEN the push delivery fails
        ///       THEN the system SHALL delete the stale UserDeviceToken record
        ///       AND log a warning with userId and deviceId"
        /// </summary>
        [Fact]
        public async Task SendPushAsync_WithInvalidRegistration_ReturnsFailedWithoutRetry()
        {
            // Arrange — Firebase returns error WITHOUT throwing (handled in wrapper)
            _firebaseClientMock
                .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "InvalidArgument", "Invalid registration token"));

            // Act
            var result = await _service.SendPushAsync("stale_token", "Title", "Body");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("InvalidArgument", result.ErrorCode);
            
            // Should NOT retry (InvalidArgument is not retryable)
            _firebaseClientMock.Verify(
                x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Once);
        }

        /// <summary>
        /// Scenario: FCM returns "Unregistered" — token expired, must be deleted.
        /// Spec: "GIVEN a device token that FCM marks as unregistered
        ///       WHEN the push delivery fails with 'Unregistered'
        ///       THEN the system SHALL delete the stale token from database"
        /// </summary>
        [Fact]
        public async Task SendPushAsync_WithUnregistered_ReturnsFailedWithoutRetry()
        {
            // Arrange
            _firebaseClientMock
                .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "Unregistered", "App instance was unregistered"));

            // Act
            var result = await _service.SendPushAsync("expired_token", "Title", "Body");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Unregistered", result.ErrorCode);
            
            // Should NOT retry
            _firebaseClientMock.Verify(
                x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Once);
        }

        [Fact]
        public async Task SendPushAsync_WithQuotaExceeded_Retries()
        {
            // Arrange — QuotaExceeded IS retryable
            _firebaseClientMock
                .SetupSequence(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "QuotaExceeded", "Quota exceeded"))
                .ReturnsAsync((true, "msg_recovered", (string?)null, (string?)null));

            // Act
            var result = await _service.SendPushAsync("token", "Title", "Body");

            // Assert
            Assert.True(result.Success);
            Assert.Equal("msg_recovered", result.MessageId);
            _firebaseClientMock.Verify(
                x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Exactly(2));
        }

        [Fact]
        public async Task SendPushAsync_WithThrottled_Retries()
        {
            // Arrange — Throttled IS retryable
            _firebaseClientMock
                .SetupSequence(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "Throttled", "Device message rate exceeded"))
                .ReturnsAsync((true, "msg_ok", (string?)null, (string?)null));

            // Act
            var result = await _service.SendPushAsync("token", "Title", "Body");

            // Assert
            Assert.True(result.Success);
            _firebaseClientMock.Verify(
                x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Exactly(2));
        }

        [Fact]
        public async Task SendPushAsync_WithAllRetriesFailing_ReturnsMaxRetriesExceeded()
        {
            // Arrange
            _firebaseClientMock
                .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "Internal", "Internal server error"));

            // Act
            var result = await _service.SendPushAsync("token", "Title", "Body");

            // Assert
            Assert.False(result.Success);
            Assert.Equal("MAX_RETRIES_EXCEEDED", result.ErrorCode);
            _firebaseClientMock.Verify(
                x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Exactly(3)); // MaxRetries = 3
        }

        #endregion

        #region SendToUserAsync - Token Lifecycle

        /// <summary>
        /// Scenario: Notification attempted with no registered devices.
        /// Spec: "GIVEN user has NO registered devices
        ///       WHEN AppointmentService triggers any appointment event
        ///       THEN IPushNotificationService SHALL NOT attempt FCM delivery
        ///       AND the system SHALL NOT log an error"
        /// </summary>
        [Fact]
        public async Task SendToUserAsync_WithNoDevices_DoesNotCallFirebase()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(Enumerable.Empty<UserDeviceToken>());

            var service = new PushNotificationService(
                _repositoryMock.Object,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);

            // Act
            await service.SendToUserAsync(userId, "Title", "Body");

            // Assert
            _firebaseClientMock.Verify(
                x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Never);
        }

        /// <summary>
        /// Scenario: Notification sent to multiple devices.
        /// Spec: "GIVEN user has 3 registered devices (2 Android, 1 iOS)
        ///       WHEN AppointmentService triggers event 'AppointmentConfirmed'
        ///       THEN IPushNotificationService SHALL send FCM message to ALL 3 device tokens
        ///       AND failures on individual devices SHALL NOT block delivery to others"
        /// </summary>
        [Fact]
        public async Task SendToUserAsync_WithMultipleDevices_SendsToAll()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var devices = new List<UserDeviceToken>
            {
                new() { Id = Guid.NewGuid(), UserId = userId, Token = "token_1", Platform = "android" },
                new() { Id = Guid.NewGuid(), UserId = userId, Token = "token_2", Platform = "android" },
                new() { Id = Guid.NewGuid(), UserId = userId, Token = "token_3", Platform = "ios" }
            };

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(devices);

            _firebaseClientMock
                .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((true, "msg_id", (string?)null, (string?)null));

            var service = new PushNotificationService(
                _repositoryMock.Object,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);

            // Act
            await service.SendToUserAsync(userId, "Title", "Body");

            // Assert
            _firebaseClientMock.Verify(
                x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Exactly(3));
        }

        /// <summary>
        /// Scenario: Token cleanup on InvalidRegistration error.
        /// Spec: "WHEN the push delivery fails
        ///       THEN the system SHALL delete the stale UserDeviceToken record"
        /// </summary>
        [Fact]
        public async Task SendToUserAsync_WithInvalidToken_CleansUpStaleToken()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var deviceId = Guid.NewGuid();
            var devices = new List<UserDeviceToken>
            {
                new() { Id = deviceId, UserId = userId, Token = "stale_token", Platform = "android" }
            };

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(devices);

            _firebaseClientMock
                .Setup(x => x.SendAsync("stale_token", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "InvalidArgument", "Invalid token"));

            var service = new PushNotificationService(
                _repositoryMock.Object,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);

            // Act
            await service.SendToUserAsync(userId, "Title", "Body");

            // Assert
            _repositoryMock.Verify(
                x => x.DeleteAsync(deviceId), 
                Times.Once);
        }

        /// <summary>
        /// Scenario: One device fails but others succeed.
        /// Spec: "failures on individual devices SHALL NOT block delivery to others"
        /// </summary>
        [Fact]
        public async Task SendToUserAsync_WithOneDeviceFailing_ContinuesToOthers()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var devices = new List<UserDeviceToken>
            {
                new() { Id = Guid.NewGuid(), UserId = userId, Token = "failing_token", Platform = "android" },
                new() { Id = Guid.NewGuid(), UserId = userId, Token = "working_token", Platform = "ios" }
            };

            _repositoryMock
                .Setup(x => x.GetByUserIdAsync(userId))
                .ReturnsAsync(devices);

            _firebaseClientMock
                .Setup(x => x.SendAsync("failing_token", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "Internal", "Server error"));

            _firebaseClientMock
                .Setup(x => x.SendAsync("working_token", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((true, "msg_ok", (string?)null, (string?)null));

            var service = new PushNotificationService(
                _repositoryMock.Object,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);

            // Act
            await service.SendToUserAsync(userId, "Title", "Body");

            // Assert — working token should still be called even if failing one fails
            _firebaseClientMock.Verify(
                x => x.SendAsync("working_token", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Once);
        }

        #endregion

        #region DeleteTokenAsync / DeleteUserTokensAsync

        [Fact]
        public async Task DeleteTokenAsync_CallsRepository()
        {
            // Arrange
            var deviceId = Guid.NewGuid();
            _repositoryMock
                .Setup(x => x.DeleteAsync(deviceId))
                .Returns(Task.CompletedTask);

            var service = new PushNotificationService(
                _repositoryMock.Object,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);

            // Act
            await service.DeleteTokenAsync(deviceId);

            // Assert
            _repositoryMock.Verify(x => x.DeleteAsync(deviceId), Times.Once);
        }

        [Fact]
        public async Task DeleteUserTokensAsync_CallsRepository()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _repositoryMock
                .Setup(x => x.DeleteByUserIdAsync(userId))
                .Returns(Task.CompletedTask);

            var service = new PushNotificationService(
                _repositoryMock.Object,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);

            // Act
            await service.DeleteUserTokensAsync(userId);

            // Assert
            _repositoryMock.Verify(x => x.DeleteByUserIdAsync(userId), Times.Once);
        }

        #endregion

        #region Circuit Breaker

        [Fact]
        public async Task CircuitBreaker_OpensAfter5ConsecutiveFailures()
        {
            // Arrange
            _firebaseClientMock
                .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ReturnsAsync((false, (string?)null, "Internal", "Error"));

            var service = new PushNotificationService(
                _repositoryMock.Object,
                _firebaseClientMock.Object,
                _configMock.Object,
                _loggerMock.Object);

            // Act — 5 consecutive failures
            for (int i = 0; i < 5; i++)
            {
                await service.SendPushAsync($"token_{i}", "Title", "Body");
            }

            // Assert — Next call should be skipped (circuit open)
            var result = await service.SendPushAsync("token_after_open", "Title", "Body");
            Assert.False(result.Success);
            Assert.Equal("CIRCUIT_OPEN", result.ErrorCode);
            
            // Firebase should NOT be called when circuit is open
            _firebaseClientMock.Verify(
                x => x.SendAsync("token_after_open", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()), 
                Times.Never);
        }

        #endregion
    }
}
