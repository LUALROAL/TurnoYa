using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace TurnoYa.API.Hubs;

/// <summary>
/// Hub de SignalR para notificaciones en tiempo real.
/// Los clientes se autentican via JWT en query string (?access_token=).
/// Segun los claims del JWT, se unen a grupos: user:{userId} o business:{businessId}.
/// </summary>
public class NotificationsHub : Hub
{
    private readonly ILogger<NotificationsHub> _logger;

    public NotificationsHub(ILogger<NotificationsHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Se ejecuta cuando un cliente se conecta.
    /// Extrae userId/businessId del JWT claims y une al grupo correspondiente.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? Context.User?.FindFirst("sub")?.Value;
        var businessIds = Context.User?.FindAll("business_id")?.Select(c => c.Value).ToList();

        if (!string.IsNullOrEmpty(userId))
        {
            var groupName = $"user:{userId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("Client connected: {ConnectionId} joined group {Group}", 
                Context.ConnectionId, groupName);
        }

        if (businessIds != null && businessIds.Any())
        {
            foreach (var bId in businessIds)
            {
                var groupName = $"business:{bId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                _logger.LogInformation("Dueño {UserId} unido a SignalR: {ConnectionId} escuchando {Group}", 
                    userId, Context.ConnectionId, groupName);
            }
        }

        if (string.IsNullOrEmpty(userId) && (businessIds == null || !businessIds.Any()))
        {
            _logger.LogWarning("Client connected: {ConnectionId} but no userId/businessId claims found", 
                Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Se ejecuta cuando un cliente se desconecta.
    /// Limpia recursos y loguea la desconexion.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (exception != null)
        {
            _logger.LogError(exception, "Client disconnected with error: {ConnectionId}", 
                Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Permite a un cliente solicitar unirse a un grupo adicional.
    /// Útil para escenarios donde el cliente necesita escuchar múltiples grupos.
    /// </summary>
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Client {ConnectionId} joined group {Group} via request", 
            Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Permite a un cliente abandonar un grupo.
    /// </summary>
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Client {ConnectionId} left group {Group} via request", 
            Context.ConnectionId, groupName);
    }
}
