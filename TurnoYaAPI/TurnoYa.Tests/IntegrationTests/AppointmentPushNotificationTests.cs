using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;
using TurnoYa.Infrastructure.Services;
using Xunit;

namespace TurnoYa.Tests.IntegrationTests
{
    /// <summary>
    /// Integration tests para AppointmentService → IPushNotificationService flow.
    /// Verifica que se llama IPushNotificationService en cada transición de estado.
    /// Ref: Spec — "Push Notification Sending" scenarios.
    /// </summary>
    public class AppointmentPushNotificationTests : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<ITelegramBotService> _telegramMock;
        private readonly Mock<IPushNotificationService> _pushNotificationMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
        private readonly Mock<IEmployeeRepository> _employeeRepositoryMock;
        private readonly Mock<IEmployeeScheduleRepository> _scheduleRepositoryMock;
        private readonly AppointmentService _appointmentService;

        private readonly Guid _ownerId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();
        private readonly Guid _businessId = Guid.NewGuid();
        private readonly Guid _serviceId = Guid.NewGuid();
        private readonly Guid _employeeId = Guid.NewGuid();

        public AppointmentPushNotificationTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            _context = new ApplicationDbContext(options);

            _telegramMock = new Mock<ITelegramBotService>();
            _pushNotificationMock = new Mock<IPushNotificationService>();
            _appointmentRepositoryMock = new Mock<IAppointmentRepository>();
            _employeeRepositoryMock = new Mock<IEmployeeRepository>();
            _scheduleRepositoryMock = new Mock<IEmployeeScheduleRepository>();

            SetupMocks();

            _appointmentService = new AppointmentService(
                _appointmentRepositoryMock.Object,
                _employeeRepositoryMock.Object,
                _scheduleRepositoryMock.Object,
                _context,
                new AutoMapper.MapperConfiguration(cfg => cfg.AddProfile<Application.Mappings.AppointmentProfile>()).CreateMapper(),
                _telegramMock.Object,
                _pushNotificationMock.Object);

            SeedTestData();
        }

        private void SetupMocks()
        {
            // Setup Telegram mock
            _telegramMock
                .Setup(x => x.SendMessageWithButtonsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);
            _telegramMock
                .Setup(x => x.SendStatusNotificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<AppointmentDto>()))
                .Returns(Task.CompletedTask);
            _telegramMock
                .Setup(x => x.AnswerCallbackQueryAsync(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Setup PushNotification mock (fire-and-forget behavior)
            _pushNotificationMock
                .Setup(x => x.SendToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .Returns(Task.CompletedTask);
            _pushNotificationMock
                .Setup(x => x.DeleteTokenAsync(It.IsAny<Guid>()))
                .Returns(Task.CompletedTask);
            _pushNotificationMock
                .Setup(x => x.DeleteUserTokensAsync(It.IsAny<Guid>()))
                .Returns(Task.CompletedTask);
        }

        private void SeedTestData()
        {
            // Seed User
            var user = new User
            {
                Id = _userId,
                FirstName = "Test",
                LastName = "User",
                Email = "test@test.com",
                TelegramChatId = "123456789"
            };

            // Seed Business Owner
            var owner = new User
            {
                Id = _ownerId,
                FirstName = "Owner",
                LastName = "User",
                Email = "owner@test.com",
                TelegramChatId = "987654321"
            };

            // Seed Business
            var business = new Business
            {
                Id = _businessId,
                Name = "Test Business",
                OwnerId = _ownerId
            };

            // Seed Service
            var service = new Service
            {
                Id = _serviceId,
                Name = "Test Service",
                BusinessId = _businessId,
                IsActive = true,
                Duration = 60,
                Price = 100
            };

            // Seed Employee
            var employee = new Employee
            {
                Id = _employeeId,
                BusinessId = _businessId,
                UserId = _ownerId,
                IsActive = true
            };

            // Seed BusinessSettings
            var businessSettings = new BusinessSettings
            {
                BusinessId = _businessId,
                MaxAdvanceBookingDays = 0,
                FreeCancellationHours = 24,
                BufferTime = 0
            };

            _context.Users.AddRange(user, owner);
            _context.Businesses.Add(business);
            _context.Services.Add(service);
            _context.Employees.Add(employee);
            _context.BusinessSettings.Add(businessSettings);
            _context.SaveChanges();
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        #region Create Appointment - Push to Business Owner

        /// <summary>
        /// Scenario: Notification sent when appointment is created.
        /// Spec: AppointmentCreated triggers push to business owner.
        /// </summary>
        [Fact]
        public async Task CreateAsync_WithValidAppointment_SendsPushToOwner()
        {
            // Arrange
            _appointmentRepositoryMock
                .Setup(x => x.HasConflictAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid?>()))
                .ReturnsAsync(false);

            _appointmentRepositoryMock
                .Setup(x => x.GetActiveAppointmentsByUserAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                .ReturnsAsync(new List<Appointment>());

            _appointmentRepositoryMock
                .Setup(x => x.AddAsync(It.IsAny<Appointment>()))
                .ReturnsAsync((Appointment a) => a);

            _scheduleRepositoryMock
                .Setup(x => x.GetByEmployeeIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((EmployeeSchedule?)null);

            var dto = new CreateAppointmentDto
            {
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId, // Specify employee to skip FindAvailableEmployeeAsync
                ScheduledDate = DateTime.UtcNow.AddDays(1),
                Notes = "Test appointment"
            };

            // Act
            var result = await _appointmentService.CreateAsync(dto, _userId);

            // Assert
            Assert.NotNull(result);
            _pushNotificationMock.Verify(
                x => x.SendToUserAsync(
                    _ownerId,
                    "¡Nueva Cita!",
                    It.Is<string>(s => s.Contains("Test Service")),
                    It.Is<Dictionary<string, string>?>(d => d != null && d.ContainsKey("type") && d["type"] == "appointment_created")),
                Times.Once);
        }

        #endregion

        #region Confirm Appointment - Push to User

        /// <summary>
        /// Scenario: AppointmentConfirmed triggers push to user.
        /// Spec: "WHEN AppointmentService triggers event 'AppointmentConfirmed'
        ///       THEN IPushNotificationService SHALL send FCM message"
        /// </summary>
        [Fact]
        public async Task ConfirmAppointmentAsync_TriggersPushToUser()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = _userId,
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId,
                Status = AppointmentStatus.Pending,
                ScheduledDate = DateTime.UtcNow.AddDays(1),
                EndDate = DateTime.UtcNow.AddDays(1).AddMinutes(60)
            };

            _appointmentRepositoryMock
                .Setup(x => x.GetByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            _appointmentRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<Appointment>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _appointmentService.ConfirmAppointmentAsync(appointmentId, _ownerId);

            // Assert
            Assert.True(result);
            _pushNotificationMock.Verify(
                x => x.SendToUserAsync(
                    _userId,
                    It.Is<string>(s => s.Contains("confirmada")),
                    It.IsAny<string>(),
                    It.Is<Dictionary<string, string>?>(d => d != null && d.ContainsKey("type") && d["type"] == "appointment_confirmada")),
                Times.Once);
        }

        #endregion

        #region Cancel Appointment - Push to User

        /// <summary>
        /// Scenario: AppointmentCancelled triggers push to user.
        /// </summary>
        [Fact]
        public async Task CancelAppointmentAsync_TriggersPushToUser()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = _userId,
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId,
                Status = AppointmentStatus.Pending,
                ScheduledDate = DateTime.UtcNow.AddDays(2), // far enough to pass cancellation check
                EndDate = DateTime.UtcNow.AddDays(2).AddMinutes(60)
            };

            _appointmentRepositoryMock
                .Setup(x => x.GetByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            _appointmentRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<Appointment>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _appointmentService.CancelAppointmentAsync(appointmentId, _userId, "User cancelled");

            // Assert
            Assert.True(result);
            _pushNotificationMock.Verify(
                x => x.SendToUserAsync(
                    _userId,
                    It.Is<string>(s => s.Contains("cancelada")),
                    It.IsAny<string>(),
                    It.Is<Dictionary<string, string>?>(d => d != null && d.ContainsKey("type") && d["type"] == "appointment_cancelada")),
                Times.Once);
        }

        #endregion

        #region Complete Appointment - Push to User

        /// <summary>
        /// Scenario: AppointmentCompleted triggers push to user.
        /// </summary>
        [Fact]
        public async Task CompleteAppointmentAsync_TriggersPushToUser()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = _userId,
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId,
                Status = AppointmentStatus.Confirmed,
                ScheduledDate = DateTime.UtcNow.AddHours(-1),
                EndDate = DateTime.UtcNow
            };

            _appointmentRepositoryMock
                .Setup(x => x.GetByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            _appointmentRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<Appointment>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _appointmentService.CompleteAppointmentAsync(appointmentId, _ownerId);

            // Assert
            Assert.True(result);
            _pushNotificationMock.Verify(
                x => x.SendToUserAsync(
                    _userId,
                    It.Is<string>(s => s.Contains("completada")),
                    It.IsAny<string>(),
                    It.Is<Dictionary<string, string>?>(d => d != null && d.ContainsKey("type") && d["type"] == "appointment_completada")),
                Times.Once);
        }

        #endregion

        #region NoShow - Push to User

        /// <summary>
        /// Scenario: NoShow triggers push to user.
        /// </summary>
        [Fact]
        public async Task MarkAsNoShowAppointmentAsync_TriggersPushToUser()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = _userId,
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId,
                Status = AppointmentStatus.Confirmed,
                ScheduledDate = DateTime.UtcNow.AddHours(-1),
                EndDate = DateTime.UtcNow
            };

            _appointmentRepositoryMock
                .Setup(x => x.GetByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            _appointmentRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<Appointment>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _appointmentService.MarkAsNoShowAppointmentAsync(appointmentId, _ownerId);

            // Assert
            Assert.True(result);
            _pushNotificationMock.Verify(
                x => x.SendToUserAsync(
                    _userId,
                    It.Is<string>(s => s.Contains("no se presentó")),
                    It.IsAny<string>(),
                    It.Is<Dictionary<string, string>?>(d => d != null && d.ContainsKey("type") && d["type"] == "appointment_no_se_presentó")),
                Times.Once);
        }

        #endregion

        #region Push Does Not Block Transaction

        /// <summary>
        /// Scenario: Push notification failure does not block the main transaction.
        /// Spec: Both services are fire-and-forget with try/catch that don't break the flow.
        /// </summary>
        [Fact]
        public async Task CreateAsync_WithPushFailure_StillCreatesAppointment()
        {
            // Arrange
            _pushNotificationMock
                .Setup(x => x.SendToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .ThrowsAsync(new Exception("FCM error"));

            _appointmentRepositoryMock
                .Setup(x => x.HasConflictAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid?>()))
                .ReturnsAsync(false);

            _appointmentRepositoryMock
                .Setup(x => x.GetActiveAppointmentsByUserAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                .ReturnsAsync(new List<Appointment>());

            _appointmentRepositoryMock
                .Setup(x => x.AddAsync(It.IsAny<Appointment>()))
                .ReturnsAsync((Appointment a) => a);

            _scheduleRepositoryMock
                .Setup(x => x.GetByEmployeeIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((EmployeeSchedule?)null);

            var dto = new CreateAppointmentDto
            {
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId,
                ScheduledDate = DateTime.UtcNow.AddDays(1)
            };

            // Act — should NOT throw even if push fails
            var result = await _appointmentService.CreateAsync(dto, _userId);

            // Assert — appointment should be created successfully
            Assert.NotNull(result);
            _appointmentRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Appointment>()), Times.Once);
        }

        /// <summary>
        /// Verify that push is fire-and-forget (not awaited) in CreateAsync.
        /// The mock setup returns immediately, so we verify the push was called.
        /// </summary>
        [Fact]
        public async Task CreateAsync_PushNotificationIsFireAndForget()
        {
            // Arrange
            var pushCallCount = 0;
            _appointmentRepositoryMock
                .Setup(x => x.HasConflictAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<Guid?>()))
                .ReturnsAsync(false);

            _appointmentRepositoryMock
                .Setup(x => x.GetActiveAppointmentsByUserAsync(It.IsAny<Guid>(), It.IsAny<DateTime>(), It.IsAny<DateTime>()))
                .ReturnsAsync(new List<Appointment>());

            _appointmentRepositoryMock
                .Setup(x => x.AddAsync(It.IsAny<Appointment>()))
                .ReturnsAsync((Appointment a) => a);

            _scheduleRepositoryMock
                .Setup(x => x.GetByEmployeeIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((EmployeeSchedule?)null);

            _pushNotificationMock
                .Setup(x => x.SendToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
                .Callback(() => pushCallCount++)
                .Returns(Task.CompletedTask);

            var dto = new CreateAppointmentDto
            {
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId,
                ScheduledDate = DateTime.UtcNow.AddDays(1)
            };

            // Act
            var result = await _appointmentService.CreateAsync(dto, _userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, pushCallCount);
        }

        #endregion

        #region Multiple Devices Notification

        /// <summary>
        /// Scenario: Notification sent to multiple devices.
        /// The push service is responsible for iterating devices.
        /// Here we verify that SendToUserAsync is called once per appointment event.
        /// </summary>
        [Fact]
        public async Task ConfirmAppointmentAsync_CallsSendToUserOnce()
        {
            // Arrange
            var appointmentId = Guid.NewGuid();
            var appointment = new Appointment
            {
                Id = appointmentId,
                UserId = _userId,
                BusinessId = _businessId,
                ServiceId = _serviceId,
                EmployeeId = _employeeId,
                Status = AppointmentStatus.Pending,
                ScheduledDate = DateTime.UtcNow.AddDays(1),
                EndDate = DateTime.UtcNow.AddDays(1).AddMinutes(60)
            };

            _appointmentRepositoryMock
                .Setup(x => x.GetByIdAsync(appointmentId))
                .ReturnsAsync(appointment);

            _appointmentRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<Appointment>()))
                .Returns(Task.CompletedTask);

            // Act
            await _appointmentService.ConfirmAppointmentAsync(appointmentId, _ownerId);

            // Assert — called once with userId
            _pushNotificationMock.Verify(
                x => x.SendToUserAsync(
                    _userId,
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<Dictionary<string, string>?>()),
                Times.Once);
        }

        #endregion
    }
}
