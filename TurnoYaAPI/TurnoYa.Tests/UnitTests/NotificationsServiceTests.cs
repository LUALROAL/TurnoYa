using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using TurnoYa.API.Hubs;
using TurnoYa.API.Services;
using TurnoYa.Core.DTOs;
using Xunit;

namespace TurnoYa.Tests.UnitTests;

/// <summary>
/// Unit tests para NotificationsService.
/// Verifica: broadcasting a grupos user/business, nombres de grupos correctos,
/// manejo de excepciones en broadcasting, mapeo de AppointmentEventType → nombre de método SignalR.
/// Ref: Spec — "Event Broadcasting" scenarios.
/// </summary>
public class NotificationsServiceTests
{
    private readonly Mock<IHubContext<NotificationsHub>> _hubContextMock;
    private readonly Mock<IHubClients> _clientsMock;
    private readonly Mock<ILogger<NotificationsService>> _loggerMock;
    private readonly NotificationsService _service;

    public NotificationsServiceTests()
    {
        _hubContextMock = new Mock<IHubContext<NotificationsHub>>();
        _clientsMock = new Mock<IHubClients>();
        _loggerMock = new Mock<ILogger<NotificationsService>>();

        _hubContextMock.Setup(h => h.Clients).Returns(_clientsMock.Object);

        _service = new NotificationsService(_hubContextMock.Object, _loggerMock.Object);
    }

    #region BroadcastToUserAsync - Correct Group and Method

    [Fact]
    public async Task BroadcastToUserAsync_CallsCorrectGroupWithCorrectMethod()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.Created, userId, Guid.NewGuid());

        var (clientProxy, capture) = CreateGroupSendMock();
        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(clientProxy);

        // Act
        await _service.BroadcastToUserAsync(userId, eventDto);

        // Assert
        Assert.Equal("AppointmentCreated", capture.CapturedMethod);
        Assert.NotNull(capture.CapturedDto);
        Assert.Equal(AppointmentEventType.Created, capture.CapturedDto.EventType);
    }

    [Theory]
    [InlineData(AppointmentEventType.Created, "AppointmentCreated")]
    [InlineData(AppointmentEventType.Confirmed, "AppointmentConfirmed")]
    [InlineData(AppointmentEventType.Cancelled, "AppointmentCancelled")]
    [InlineData(AppointmentEventType.Completed, "AppointmentCompleted")]
    [InlineData(AppointmentEventType.NoShow, "AppointmentNoShow")]
    public async Task BroadcastToUserAsync_MapsEventTypeToCorrectSignalRMethod(
        AppointmentEventType eventType, string expectedMethodName)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(eventType, userId, businessId);

        var (clientProxy, capture) = CreateGroupSendMock();
        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(clientProxy);

        // Act
        await _service.BroadcastToUserAsync(userId, eventDto);

        // Assert
        Assert.Equal(expectedMethodName, capture.CapturedMethod);
    }

    #endregion

    #region BroadcastToBusinessAsync - Correct Group

    [Fact]
    public async Task BroadcastToBusinessAsync_CallsBusinessGroup()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.Created, userId, businessId);

        var (clientProxy, capture) = CreateGroupSendMock();
        _clientsMock.Setup(c => c.Group($"business:{businessId}")).Returns(clientProxy);

        // Act
        await _service.BroadcastToBusinessAsync(businessId, eventDto);

        // Assert
        _clientsMock.Verify(c => c.Group($"business:{businessId}"), Times.Once);
    }

    [Fact]
    public async Task BroadcastToBusinessAsync_WithNoShowEvent_CallsBusinessGroup()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.NoShow, userId, businessId);

        var (clientProxy, capture) = CreateGroupSendMock();
        _clientsMock.Setup(c => c.Group($"business:{businessId}")).Returns(clientProxy);

        // Act
        await _service.BroadcastToBusinessAsync(businessId, eventDto);

        // Assert
        Assert.Equal("AppointmentNoShow", capture.CapturedMethod);
    }

    #endregion

    #region BroadcastToBothAsync - Parallel Broadcast

    [Fact]
    public async Task BroadcastToBothAsync_SendsToBothUserAndBusinessGroups()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.Cancelled, userId, businessId);

        var (userClient, userCapture) = CreateGroupSendMock();
        var (bizClient, bizCapture) = CreateGroupSendMock();

        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(userClient);
        _clientsMock.Setup(c => c.Group($"business:{businessId}")).Returns(bizClient);

        // Act
        await _service.BroadcastToBothAsync(userId, businessId, eventDto);

        // Assert
        Assert.NotNull(userCapture.CapturedDto);
        Assert.NotNull(bizCapture.CapturedDto);
        Assert.Equal(eventDto.AppointmentId, userCapture.CapturedDto.AppointmentId);
        Assert.Equal(eventDto.AppointmentId, bizCapture.CapturedDto.AppointmentId);
    }

    [Fact]
    public async Task BroadcastToBothAsync_SendsSameEventDtoToBothGroups()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.Completed, userId, businessId);

        var (userClient, userCapture) = CreateGroupSendMock();
        var (bizClient, bizCapture) = CreateGroupSendMock();

        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(userClient);
        _clientsMock.Setup(c => c.Group($"business:{businessId}")).Returns(bizClient);

        // Act
        await _service.BroadcastToBothAsync(userId, businessId, eventDto);

        // Assert
        Assert.NotNull(userCapture.CapturedDto);
        Assert.NotNull(bizCapture.CapturedDto);
        Assert.Equal(eventDto.EventType, userCapture.CapturedDto.EventType);
        Assert.Equal(eventDto.EventType, bizCapture.CapturedDto.EventType);
    }

    #endregion

    #region Exception Handling - Fire-and-Forget Safety

    [Fact]
    public async Task BroadcastToUserAsync_WhenSendAsyncThrows_DoesNotRethrow()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.Created, userId, Guid.NewGuid());

        var failingMock = new Mock<IClientProxy>();
        failingMock.Setup(g => g.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("SignalR connection lost"));

        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(failingMock.Object);

        // Act & Assert
        var exception = await Record.ExceptionAsync(
            () => _service.BroadcastToUserAsync(userId, eventDto));
        Assert.Null(exception);
    }

    [Fact]
    public async Task BroadcastToBusinessAsync_WhenSendAsyncThrows_DoesNotRethrow()
    {
        // Arrange
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.Cancelled, Guid.NewGuid(), businessId);

        var failingMock = new Mock<IClientProxy>();
        failingMock.Setup(g => g.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Hub disconnected"));

        _clientsMock.Setup(c => c.Group($"business:{businessId}")).Returns(failingMock.Object);

        // Act & Assert
        var exception = await Record.ExceptionAsync(
            () => _service.BroadcastToBusinessAsync(businessId, eventDto));
        Assert.Null(exception);
    }

    [Fact]
    public async Task BroadcastToBothAsync_WhenOneGroupFails_StillSendsToOther()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.Cancelled, userId, businessId);

        var (successClient, successCapture) = CreateGroupSendMock();

        var failingMock = new Mock<IClientProxy>();
        failingMock.Setup(g => g.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Business group send failed"));

        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(successClient);
        _clientsMock.Setup(c => c.Group($"business:{businessId}")).Returns(failingMock.Object);

        // Act & Assert — should NOT throw even if one group fails
        var exception = await Record.ExceptionAsync(
            () => _service.BroadcastToBothAsync(userId, businessId, eventDto));
        Assert.Null(exception);
        Assert.NotNull(successCapture.CapturedDto);
    }

    [Fact]
    public async Task BroadcastToBothAsync_WhenBothFail_LogsWarningsAndDoesNotRethrow()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var eventDto = CreateEventDto(AppointmentEventType.NoShow, userId, businessId);

        var failingMock = new Mock<IClientProxy>();
        failingMock.Setup(g => g.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Send failed"));

        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(failingMock.Object);
        _clientsMock.Setup(c => c.Group($"business:{businessId}")).Returns(failingMock.Object);

        // Act
        var exception = await Record.ExceptionAsync(
            () => _service.BroadcastToBothAsync(userId, businessId, eventDto));

        // Assert
        Assert.Null(exception);
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeast(1));
    }

    #endregion

    #region Event DTO Content Verification

    [Fact]
    public async Task BroadcastToUserAsync_PassesCompleteEventDto()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var appointmentId = Guid.NewGuid();
        var scheduledDate = DateTime.UtcNow.AddDays(1);

        var eventDto = new AppointmentEventDto(
            appointmentId,
            AppointmentEventType.Confirmed,
            userId,
            businessId,
            "Barbería Central",
            "Corte de pelo",
            scheduledDate,
            "Confirmed",
            null);

        var (clientProxy, capture) = CreateGroupSendMock();
        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(clientProxy);

        // Act
        await _service.BroadcastToUserAsync(userId, eventDto);

        // Assert
        Assert.NotNull(capture.CapturedDto);
        Assert.Equal(appointmentId, capture.CapturedDto.AppointmentId);
        Assert.Equal(userId, capture.CapturedDto.CustomerId);
        Assert.Equal(businessId, capture.CapturedDto.BusinessId);
        Assert.Equal("Barbería Central", capture.CapturedDto.BusinessName);
        Assert.Equal("Corte de pelo", capture.CapturedDto.ServiceName);
        Assert.Equal(scheduledDate, capture.CapturedDto.ScheduledDate);
        Assert.Equal("Confirmed", capture.CapturedDto.Status);
        Assert.Null(capture.CapturedDto.Reason);
    }

    [Fact]
    public async Task BroadcastToUserAsync_PassesReasonForCancellation()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var businessId = Guid.NewGuid();
        var reason = "Cliente solicitó cancelación";

        var eventDto = new AppointmentEventDto(
            Guid.NewGuid(),
            AppointmentEventType.Cancelled,
            userId,
            businessId,
            "Spa Relax",
            "Masaje",
            DateTime.UtcNow,
            "Cancelled",
            reason);

        var (clientProxy, capture) = CreateGroupSendMock();
        _clientsMock.Setup(c => c.Group($"user:{userId}")).Returns(clientProxy);

        // Act
        await _service.BroadcastToUserAsync(userId, eventDto);

        // Assert
        Assert.NotNull(capture.CapturedDto);
        Assert.Equal(reason, capture.CapturedDto.Reason);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Creates a mock IClientProxy that captures the method name and DTO passed to SendCoreAsync.
    /// Uses a closure to capture values without ref/out parameters.
    /// </summary>
    private static (IClientProxy clientProxy, CaptureData capture) CreateGroupSendMock()
    {
        var capture = new CaptureData();
        var mock = new Mock<IClientProxy>();
        mock.Setup(g => g.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, object[], CancellationToken>((method, args, _) =>
            {
                capture.CapturedMethod = method;
                if (args.Length > 0)
                {
                    capture.CapturedDto = args[0] as AppointmentEventDto;
                }
            })
            .Returns(Task.CompletedTask);

        return (mock.Object, capture);
    }

    private class CaptureData
    {
        public string CapturedMethod { get; set; } = string.Empty;
        public AppointmentEventDto? CapturedDto { get; set; }
    }

    private static AppointmentEventDto CreateEventDto(AppointmentEventType type, Guid userId, Guid businessId)
    {
        return new AppointmentEventDto(
            Guid.NewGuid(),
            type,
            userId,
            businessId,
            "Test Business",
            "Test Service",
            DateTime.UtcNow.AddDays(1),
            "Pending"
        );
    }

    #endregion
}
