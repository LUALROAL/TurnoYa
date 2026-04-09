using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TurnoYa.Application.DTOs.Appointment;
using TurnoYa.Application.Interfaces;
using TurnoYa.Core.DTOs;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;
using TurnoYa.Infrastructure.Services;
using Xunit;

namespace TurnoYa.Tests.IntegrationTests;

/// <summary>
/// Integration tests para AppointmentService → INotificationsService (SignalR) flow.
/// Verifica que se llama INotificationsService en cada transición de estado de cita.
/// Ref: Spec — "Event Broadcasting" scenarios.
///
/// Nota: Los broadcasts SignalR son fire-and-forget via Task.Run.
/// Usamos Task.Delay(50) para dar tiempo al thread pool antes de verificar.
/// </summary>
public class AppointmentSignalRTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ITelegramBotService> _telegramMock;
    private readonly Mock<IPushNotificationService> _pushNotificationMock;
    private readonly Mock<INotificationsService> _notificationsServiceMock;
    private readonly Mock<IAppointmentRepository> _appointmentRepositoryMock;
    private readonly Mock<IEmployeeRepository> _employeeRepositoryMock;
    private readonly Mock<IEmployeeScheduleRepository> _scheduleRepositoryMock;
    private readonly AppointmentService _appointmentService;

    private readonly Guid _ownerId = Guid.NewGuid();
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _businessId = Guid.NewGuid();
    private readonly Guid _serviceId = Guid.NewGuid();
    private readonly Guid _employeeId = Guid.NewGuid();

    public AppointmentSignalRTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new ApplicationDbContext(options);

        _telegramMock = new Mock<ITelegramBotService>();
        _pushNotificationMock = new Mock<IPushNotificationService>();
        _notificationsServiceMock = new Mock<INotificationsService>();
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
            _pushNotificationMock.Object,
            _notificationsServiceMock.Object);

        SeedTestData();
    }

    private void SetupMocks()
    {
        // Telegram — fire-and-forget, setup to complete immediately
        _telegramMock
            .Setup(x => x.SendMessageWithButtonsAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        _telegramMock
            .Setup(x => x.SendStatusNotificationAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<AppointmentDto>()))
            .Returns(Task.CompletedTask);
        _telegramMock
            .Setup(x => x.AnswerCallbackQueryAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        // Push Notification — fire-and-forget
        _pushNotificationMock
            .Setup(x => x.SendToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()))
            .Returns(Task.CompletedTask);
        _pushNotificationMock
            .Setup(x => x.DeleteTokenAsync(It.IsAny<Guid>()))
            .Returns(Task.CompletedTask);
        _pushNotificationMock
            .Setup(x => x.DeleteUserTokensAsync(It.IsAny<Guid>()))
            .Returns(Task.CompletedTask);

        // SignalR Notifications — setup to complete immediately (mimics fire-and-forget)
        _notificationsServiceMock
            .Setup(x => x.BroadcastToUserAsync(It.IsAny<Guid>(), It.IsAny<AppointmentEventDto>()))
            .Returns(Task.CompletedTask);
        _notificationsServiceMock
            .Setup(x => x.BroadcastToBusinessAsync(It.IsAny<Guid>(), It.IsAny<AppointmentEventDto>()))
            .Returns(Task.CompletedTask);
        _notificationsServiceMock
            .Setup(x => x.BroadcastToBothAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<AppointmentEventDto>()))
            .Returns(Task.CompletedTask);
    }

    private void SeedTestData()
    {
        var user = new User
        {
            Id = _userId,
            FirstName = "Test",
            LastName = "User",
            Email = "test@test.com",
            TelegramChatId = "123456789"
        };

        var owner = new User
        {
            Id = _ownerId,
            FirstName = "Owner",
            LastName = "User",
            Email = "owner@test.com",
            TelegramChatId = "987654321"
        };

        var business = new Business
        {
            Id = _businessId,
            Name = "Test Business",
            OwnerId = _ownerId
        };

        var service = new Service
        {
            Id = _serviceId,
            Name = "Test Service",
            BusinessId = _businessId,
            IsActive = true,
            Duration = 60,
            Price = 100
        };

        var employee = new Employee
        {
            Id = _employeeId,
            BusinessId = _businessId,
            UserId = _ownerId,
            IsActive = true
        };

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

    #region Create Appointment - SignalR Broadcast to Business

    /// <summary>
    /// Scenario: Broadcast on Appointment Creation.
    /// Spec: "WHEN AppointmentService.Create() completes successfully
    ///       THEN BroadcastToBusinessAsync is called with AppointmentCreated event
    ///       AND FCM payload is prepared for app-closed fallback"
    /// </summary>
    [Fact]
    public async Task CreateAsync_TriggersSignalRBroadcastToBusiness()
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
            EmployeeId = _employeeId,
            ScheduledDate = DateTime.UtcNow.AddDays(1),
            Notes = "Test"
        };

        // Act
        var result = await _appointmentService.CreateAsync(dto, _userId);

        // Wait for fire-and-forget Task.Run to execute
        await Task.Delay(50);

        // Assert
        Assert.NotNull(result);
        _notificationsServiceMock.Verify(
            x => x.BroadcastToBusinessAsync(
                _businessId,
                It.Is<AppointmentEventDto>(e =>
                    e.EventType == AppointmentEventType.Created &&
                    e.AppointmentId == result.Id &&
                    e.BusinessId == _businessId &&
                    e.CustomerId == _userId)),
            Times.Once,
            "Create should broadcast to business group with AppointmentCreated event");
    }

    /// <summary>
    /// Verify that SignalR broadcast does NOT block appointment creation.
    /// The transaction commits even if SignalR throws.
    /// </summary>
    [Fact]
    public async Task CreateAsync_WithSignalRFailure_StillCreatesAppointment()
    {
        // Arrange
        _notificationsServiceMock
            .Setup(x => x.BroadcastToBusinessAsync(It.IsAny<Guid>(), It.IsAny<AppointmentEventDto>()))
            .ThrowsAsync(new Exception("SignalR connection lost"));

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

        // Act — should NOT throw even if SignalR fails
        var result = await _appointmentService.CreateAsync(dto, _userId);

        // Assert — appointment should be created
        Assert.NotNull(result);
        _appointmentRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Appointment>()), Times.Once);
    }

    #endregion

    #region Confirm Appointment - SignalR Broadcast to User

    /// <summary>
    /// Scenario: Broadcast on Confirmation.
    /// Spec: "WHEN business owner confirms appointment
    ///       THEN AppointmentConfirmed event is sent to user:{customerId}
    ///       AND FCM payload is prepared for app-closed fallback"
    /// </summary>
    [Fact]
    public async Task ConfirmAppointmentAsync_TriggersSignalRBroadcastToUser()
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

        // Wait for fire-and-forget
        await Task.Delay(50);

        // Assert
        Assert.True(result);
        _notificationsServiceMock.Verify(
            x => x.BroadcastToUserAsync(
                _userId,
                It.Is<AppointmentEventDto>(e =>
                    e.EventType == AppointmentEventType.Confirmed &&
                    e.AppointmentId == appointmentId &&
                    e.CustomerId == _userId &&
                    e.BusinessId == _businessId)),
            Times.Once,
            "Confirm should broadcast to user group with AppointmentConfirmed event");
    }

    #endregion

    #region Cancel Appointment - SignalR Broadcast to Both

    /// <summary>
    /// Scenario: Broadcast on Cancellation.
    /// Spec: "WHEN customer or owner cancels appointment
    ///       THEN AppointmentCancelled event is sent to business:{businessId} AND user:{customerId}"
    /// </summary>
    [Fact]
    public async Task CancelAppointmentAsync_TriggersSignalRBroadcastToBoth()
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
            ScheduledDate = DateTime.UtcNow.AddDays(2),
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

        // Wait for fire-and-forget
        await Task.Delay(50);

        // Assert
        Assert.True(result);
        _notificationsServiceMock.Verify(
            x => x.BroadcastToBothAsync(
                _userId,
                _businessId,
                It.Is<AppointmentEventDto>(e =>
                    e.EventType == AppointmentEventType.Cancelled &&
                    e.AppointmentId == appointmentId &&
                    e.CustomerId == _userId &&
                    e.BusinessId == _businessId &&
                    e.Reason == "User cancelled")),
            Times.Once,
            "Cancel should broadcast to both user and business groups with AppointmentCancelled event");
    }

    [Fact]
    public async Task CancelAppointmentAsync_PassesReasonInEventDto()
    {
        // Arrange
        var appointmentId = Guid.NewGuid();
        var reason = "Horario no disponible";
        var appointment = new Appointment
        {
            Id = appointmentId,
            UserId = _userId,
            BusinessId = _businessId,
            ServiceId = _serviceId,
            EmployeeId = _employeeId,
            Status = AppointmentStatus.Pending,
            ScheduledDate = DateTime.UtcNow.AddDays(2),
            EndDate = DateTime.UtcNow.AddDays(2).AddMinutes(60)
        };

        _appointmentRepositoryMock
            .Setup(x => x.GetByIdAsync(appointmentId))
            .ReturnsAsync(appointment);

        _appointmentRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<Appointment>()))
            .Returns(Task.CompletedTask);

        // Act
        await _appointmentService.CancelAppointmentAsync(appointmentId, _userId, reason);
        await Task.Delay(50);

        // Assert
        _notificationsServiceMock.Verify(
            x => x.BroadcastToBothAsync(
                _userId,
                _businessId,
                It.Is<AppointmentEventDto>(e => e.Reason == reason)),
            Times.Once);
    }

    #endregion

    #region Complete Appointment - SignalR Broadcast to User

    /// <summary>
    /// Scenario: Broadcast on Completion.
    /// Spec: "WHEN business owner marks appointment as completed
    ///       THEN AppointmentCompleted event is broadcast to both parties"
    /// </summary>
    [Fact]
    public async Task CompleteAppointmentAsync_TriggersSignalRBroadcastToUser()
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

        // Wait for fire-and-forget
        await Task.Delay(50);

        // Assert
        Assert.True(result);
        _notificationsServiceMock.Verify(
            x => x.BroadcastToUserAsync(
                _userId,
                It.Is<AppointmentEventDto>(e =>
                    e.EventType == AppointmentEventType.Completed &&
                    e.AppointmentId == appointmentId &&
                    e.CustomerId == _userId)),
            Times.Once,
            "Complete should broadcast to user group with AppointmentCompleted event");
    }

    #endregion

    #region NoShow Appointment - SignalR Broadcast to User

    /// <summary>
    /// Scenario: Broadcast on No-Show.
    /// Spec: "WHEN business owner marks appointment as no-show
    ///       THEN AppointmentNoShow event is broadcast to both parties"
    /// </summary>
    [Fact]
    public async Task MarkAsNoShowAppointmentAsync_TriggersSignalRBroadcastToUser()
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

        // Wait for fire-and-forget
        await Task.Delay(50);

        // Assert
        Assert.True(result);
        _notificationsServiceMock.Verify(
            x => x.BroadcastToUserAsync(
                _userId,
                It.Is<AppointmentEventDto>(e =>
                    e.EventType == AppointmentEventType.NoShow &&
                    e.AppointmentId == appointmentId &&
                    e.CustomerId == _userId)),
            Times.Once,
            "NoShow should broadcast to user group with AppointmentNoShow event");
    }

    #endregion

    #region Event DTO Content Verification

    /// <summary>
    /// Verify that the event DTO sent via SignalR contains all required fields.
    /// Spec: AppointmentEventDto must include AppointmentId, EventType, CustomerId,
    /// BusinessId, BusinessName, ServiceName, ScheduledDate, Status, Reason.
    /// </summary>
    [Fact]
    public async Task ConfirmAppointmentAsync_SendsCompleteEventDto()
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

        AppointmentEventDto? capturedDto = null;
        _notificationsServiceMock
            .Setup(x => x.BroadcastToUserAsync(It.IsAny<Guid>(), It.IsAny<AppointmentEventDto>()))
            .Callback<Guid, AppointmentEventDto>((_, dto) => capturedDto = dto)
            .Returns(Task.CompletedTask);

        // Act
        await _appointmentService.ConfirmAppointmentAsync(appointmentId, _ownerId);
        await Task.Delay(50);

        // Assert
        Assert.NotNull(capturedDto);
        Assert.Equal(appointmentId, capturedDto.AppointmentId);
        Assert.Equal(AppointmentEventType.Confirmed, capturedDto.EventType);
        Assert.Equal(_userId, capturedDto.CustomerId);
        Assert.Equal(_businessId, capturedDto.BusinessId);
        Assert.Equal("Test Business", capturedDto.BusinessName);
        Assert.Equal("Test Service", capturedDto.ServiceName);
        Assert.Equal(AppointmentStatus.Confirmed, Enum.Parse<AppointmentStatus>(capturedDto.Status));
        Assert.Null(capturedDto.Reason);
    }

    #endregion

    #region SignalR vs FCM — Both Are Independent

    /// <summary>
    /// Verify that SignalR and FCM are independent calls.
    /// Spec: "FCM remains the fallback when app is closed."
    /// Both should be triggered but neither should block the other.
    /// </summary>
    [Fact]
    public async Task ConfirmAppointmentAsync_TriggersBothSignalRAndPush()
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
        await Task.Delay(100); // Give both fire-and-forget tasks time

        // Assert
        Assert.True(result);
        _notificationsServiceMock.Verify(
            x => x.BroadcastToUserAsync(It.IsAny<Guid>(), It.IsAny<AppointmentEventDto>()),
            Times.Once,
            "SignalR should be called");
        _pushNotificationMock.Verify(
            x => x.SendToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, string>?>()),
            Times.AtLeastOnce,
            "Push notification should also be called (fallback for app-closed scenario)");
    }

    #endregion
}
