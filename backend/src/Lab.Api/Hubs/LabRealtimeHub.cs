using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Lab.Api.Hubs;

/// <summary>
/// Real-time SignalR Hub for DigitLab multi-tenant live updates across Web & Mobile App.
/// </summary>
public class LabRealtimeHub : Hub
{
    private readonly ILogger<LabRealtimeHub> _logger;

    public LabRealtimeHub(ILogger<LabRealtimeHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var tenantId = Context.User?.FindFirst("tenant_id")?.Value
                       ?? Context.User?.FindFirst("TenantId")?.Value
                       ?? Context.GetHttpContext()?.Request.Query["tenantId"].ToString();

        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            var clean = tenantId.Trim().ToLowerInvariant();
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Tenant_{clean}");
            _logger.LogInformation("[SignalR] Client connected: {ConnectionId} joined tenant group Tenant_{clean}", Context.ConnectionId, clean);
        }
        else
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "PublicUpdates");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("[SignalR] Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Explicitly join a tenant room (useful for mobile clients if tenant ID is passed post-handshake)
    /// </summary>
    public async Task JoinTenantRoom(string tenantId)
    {
        if (!string.IsNullOrWhiteSpace(tenantId))
        {
            var clean = tenantId.Trim().ToLowerInvariant();
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Tenant_{clean}");
            await Clients.Caller.SendAsync("JoinedRoom", $"Tenant_{clean}");
            _logger.LogInformation("[SignalR] Client {ConnectionId} joined tenant room: Tenant_{clean}", Context.ConnectionId, clean);
        }
    }

    /// <summary>
    /// Ping/pong for connection liveness testing from Mobile/Web
    /// </summary>
    public async Task SendHeartbeat(string clientInfo)
    {
        await Clients.Caller.SendAsync("HeartbeatAck", new
        {
            serverTime = DateTime.UtcNow,
            clientInfo,
            status = "Online"
        });
    }
}
