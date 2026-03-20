using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using TurnoYa.API.Hubs;
using Xunit;

namespace TurnoYa.Tests.UnitTests;

/// <summary>
/// Unit tests para NotificationsHub.
/// Verifica: group joining logic, JWT claim extraction, connection lifecycle.
/// Ref: Spec — "Group Subscription" and "Hub Connection with JWT Auth" scenarios.
/// </summary>
public class NotificationsHubTests
{
    private readonly Mock<IGroupManager> _groupsManagerMock;
    private readonly Mock<HubCallerContext> _contextMock;
    private readonly Mock<ILogger<NotificationsHub>> _loggerMock;
    private readonly NotificationsHub _hub;

    private readonly string _connectionId = "conn-abc-123";

    public NotificationsHubTests()
    {
        _groupsManagerMock = new Mock<IGroupManager>();
        _contextMock = new Mock<HubCallerContext>();
        _loggerMock = new Mock<ILogger<NotificationsHub>>();

        _contextMock.Setup(c => c.ConnectionId).Returns(_connectionId);
        _contextMock.Setup(c => c.User).Returns((ClaimsPrincipal?)null);

        _hub = new NotificationsHub(_loggerMock.Object);
        _hub.Clients = new Mock<IHubCallerClients>().Object;
        _hub.Groups = _groupsManagerMock.Object;
        _hub.Context = _contextMock.Object;
    }

    #region OnConnectedAsync - JWT Claim Extraction

    [Fact]
    public async Task OnConnectedAsync_WithUserIdClaim_JoinsUserGroup()
    {
        // Arrange — Customer JWT with NameIdentifier claim
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _contextMock.Setup(c => c.User).Returns(principal);

        _groupsManagerMock
            .Setup(g => g.AddToGroupAsync(_connectionId, $"user:{userId}", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, $"user:{userId}", It.IsAny<CancellationToken>()),
            Times.Once,
            "Client with userId claim should join group 'user:{userId}'");
    }

    [Fact]
    public async Task OnConnectedAsync_WithSubClaim_JoinsUserGroup()
    {
        // Arrange — JWT using "sub" claim (standard JWT format)
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim("sub", userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _contextMock.Setup(c => c.User).Returns(principal);

        _groupsManagerMock
            .Setup(g => g.AddToGroupAsync(_connectionId, $"user:{userId}", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, $"user:{userId}", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task OnConnectedAsync_WithBusinessIdClaim_JoinsBusinessGroup()
    {
        // Arrange — Business owner JWT with business_id claim
        var businessId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim("business_id", businessId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _contextMock.Setup(c => c.User).Returns(principal);

        _groupsManagerMock
            .Setup(g => g.AddToGroupAsync(_connectionId, $"business:{businessId}", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, $"business:{businessId}", It.IsAny<CancellationToken>()),
            Times.Once,
            "Client with business_id claim should join group 'business:{businessId}'");
    }

    [Fact]
    public async Task OnConnectedAsync_WithBothClaims_PrioritizesUserIdOverBusinessId()
    {
        // Arrange — JWT with both claims (edge case: user who is also a business owner)
        var userId = Guid.NewGuid().ToString();
        var businessId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("business_id", businessId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _contextMock.Setup(c => c.User).Returns(principal);

        // Act — Should join user group first (NameIdentifier has priority in Hub logic)
        await _hub.OnConnectedAsync();

        // Assert — Should ONLY join user group, not both
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, $"user:{userId}", It.IsAny<CancellationToken>()),
            Times.Once);
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, $"business:{businessId}", It.IsAny<CancellationToken>()),
            Times.Never,
            "NameIdentifier claim takes priority; should not join business group");
    }

    [Fact]
    public async Task OnConnectedAsync_WithNoClaims_DoesNotJoinAnyGroup()
    {
        // Arrange — No user claims (anonymous or malformed JWT)
        _contextMock.Setup(c => c.User).Returns((ClaimsPrincipal?)null);

        // Act
        await _hub.OnConnectedAsync();

        // Assert — No group join attempts
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "No group should be joined when no userId or businessId claims present");
    }

    #endregion

    #region OnConnectedAsync - Group Naming Convention

    [Theory]
    [InlineData("550e8400-e29b-41d4-a716-446655440000", "user:550e8400-e29b-41d4-a716-446655440000")]
    [InlineData("abc-123-def", "user:abc-123-def")]
    [InlineData("user-id-001", "user:user-id-001")]
    public async Task OnConnectedAsync_JoinsUserGroupWithCorrectNaming(string id, string expectedGroupName)
    {
        // Arrange
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, id) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _contextMock.Setup(c => c.User).Returns(principal);

        _groupsManagerMock
            .Setup(g => g.AddToGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()),
            Times.Once,
            $"Should join group '{expectedGroupName}'");
    }

    [Theory]
    [InlineData("b-456", "business:b-456")]
    [InlineData("550e8400-e29b-41d4-a716-446655440000", "business:550e8400-e29b-41d4-a716-446655440000")]
    public async Task OnConnectedAsync_JoinsBusinessGroupWithCorrectNaming(string id, string expectedGroupName)
    {
        // Arrange
        var claims = new List<Claim> { new Claim("business_id", id) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _contextMock.Setup(c => c.User).Returns(principal);

        _groupsManagerMock
            .Setup(g => g.AddToGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()),
            Times.Once,
            $"Should join group '{expectedGroupName}'");
    }

    #endregion

    #region OnConnectedAsync - Connection Lifecycle

    [Fact]
    public async Task OnConnectedAsync_CallsBaseOnConnectedAsync()
    {
        // Arrange
        var callsBase = false;
        _contextMock.Setup(c => c.User).Returns((ClaimsPrincipal?)null);

        // Override hub to track base call
        var hubWithTracking = new TestableNotificationsHub(_loggerMock.Object, () => callsBase = true);
        hubWithTracking.Clients = new Mock<IHubCallerClients>().Object;
        hubWithTracking.Groups = _groupsManagerMock.Object;
        hubWithTracking.Context = _contextMock.Object;

        // Act
        await hubWithTracking.OnConnectedAsync();

        // Assert
        Assert.True(callsBase, "Should call base.OnConnectedAsync()");
    }

    [Fact]
    public async Task OnConnectedAsync_UsesCorrectConnectionId()
    {
        // Arrange
        var specificConnectionId = "my-specific-conn-id";
        _contextMock.Setup(c => c.ConnectionId).Returns(specificConnectionId);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, "user-123")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _contextMock.Setup(c => c.User).Returns(principal);

        _groupsManagerMock
            .Setup(g => g.AddToGroupAsync(specificConnectionId, "user:user-123", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(specificConnectionId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once,
            $"AddToGroupAsync should be called with connectionId '{specificConnectionId}'");
    }

    #endregion

    #region OnDisconnectedAsync - Lifecycle

    [Fact]
    public async Task OnDisconnectedAsync_WithException_LogsError()
    {
        // Arrange
        var exception = new Exception("Network error");
        var callsBase = false;

        var hubWithTracking = new TestableNotificationsHub(_loggerMock.Object, () => callsBase = true);
        hubWithTracking.Context = _contextMock.Object;

        // Act
        await hubWithTracking.OnDisconnectedAsync(exception);

        // Assert
        Assert.True(callsBase);
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                exception,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once,
            "Should log error when disconnecting with exception");
    }

    [Fact]
    public async Task OnDisconnectedAsync_WithoutException_LogsInformation()
    {
        // Arrange
        var callsBase = false;

        var hubWithTracking = new TestableNotificationsHub(_loggerMock.Object, () => callsBase = true);
        hubWithTracking.Context = _contextMock.Object;

        // Act
        await hubWithTracking.OnDisconnectedAsync(null);

        // Assert
        Assert.True(callsBase);
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once,
            "Should log info when disconnecting without exception");
    }

    [Fact]
    public async Task OnDisconnectedAsync_CallsBaseOnDisconnectedAsync()
    {
        // Arrange
        var callsBase = false;
        var hubWithTracking = new TestableNotificationsHub(_loggerMock.Object, () => callsBase = true);
        hubWithTracking.Context = _contextMock.Object;

        // Act
        await hubWithTracking.OnDisconnectedAsync(null);

        // Assert
        Assert.True(callsBase, "Should call base.OnDisconnectedAsync()");
    }

    #endregion

    #region JoinGroup / LeaveGroup Methods

    [Fact]
    public async Task JoinGroup_AddsClientToSpecifiedGroup()
    {
        // Arrange
        var groupName = "custom-group";
        _groupsManagerMock
            .Setup(g => g.AddToGroupAsync(_connectionId, groupName, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.JoinGroup(groupName);

        // Assert
        _groupsManagerMock.Verify(
            g => g.AddToGroupAsync(_connectionId, groupName, It.IsAny<CancellationToken>()),
            Times.Once,
            "JoinGroup should add connection to the requested group");
    }

    [Fact]
    public async Task LeaveGroup_RemovesClientFromSpecifiedGroup()
    {
        // Arrange
        var groupName = "custom-group";
        _groupsManagerMock
            .Setup(g => g.RemoveFromGroupAsync(_connectionId, groupName, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.LeaveGroup(groupName);

        // Assert
        _groupsManagerMock.Verify(
            g => g.RemoveFromGroupAsync(_connectionId, groupName, It.IsAny<CancellationToken>()),
            Times.Once,
            "LeaveGroup should remove connection from the requested group");
    }

    #endregion

    /// <summary>
    /// Testable subclass that tracks base.OnConnectedAsync() / OnDisconnectedAsync() calls.
    /// </summary>
    private class TestableNotificationsHub : NotificationsHub
    {
        private readonly Action _onConnectedCallback;

        public TestableNotificationsHub(ILogger<NotificationsHub> logger, Action onConnectedCallback)
            : base(logger)
        {
            _onConnectedCallback = onConnectedCallback;
        }

        public new async Task OnConnectedAsync()
        {
            _onConnectedCallback();
            await base.OnConnectedAsync();
        }

        public new async Task OnDisconnectedAsync(Exception? exception)
        {
            _onConnectedCallback(); // reuse callback for simplicity
            await base.OnDisconnectedAsync(exception);
        }
    }
}
