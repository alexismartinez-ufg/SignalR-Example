using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Linq;

public class PermisosHub : Hub
{
    private static ConcurrentDictionary<string, User> _users = new ConcurrentDictionary<string, User>();

    public async Task RegisterUser(string name, string role)
    {
        var user = new User(name, role);
        _users[Context.ConnectionId] = user;
        if (user.Role.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        }
        await UpdateUsers();
    }

    public async Task RequestPermission(string name)
    {
        if (_users.TryGetValue(Context.ConnectionId, out var user))
        {
            user.Requested = true;
            await Clients.Group("admins").SendAsync("ReceiveRequest", user.Name, Context.ConnectionId);
        }
    }

    public async Task RespondToRequest(string connectionId, bool granted)
    {
        if (_users.TryGetValue(connectionId, out var user))
        {
            if (!string.IsNullOrEmpty(user.PermissionStatus))
            {
                await Clients.Caller.SendAsync("PermissionAlreadyResponded", user.PermissionStatus, _users[Context.ConnectionId].Name);
                return;
            }

            user.PermissionStatus = granted ? "Permitido" : "No permitido";
            await Clients.Client(connectionId).SendAsync("ReceivePermissionStatus", user.Name, granted, _users[Context.ConnectionId].Name);
            await Clients.Group("admins").SendAsync("RequestResponded", connectionId, granted, _users[Context.ConnectionId].Name);
        }
        await UpdateUsers();
    }

    public override async Task OnDisconnectedAsync(Exception exception)
    {
        if (_users.TryRemove(Context.ConnectionId, out User user) && user.Role.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "admins");
        }

        await UpdateUsers();
        await base.OnDisconnectedAsync(exception);
    }

    private async Task UpdateUsers()
    {
        await Clients.All.SendAsync("UpdateUserList", _users.Values.ToList());
    }
}



public class User
{
    public string Name { get; set; }
    public string Role { get; set; }
    public bool Requested { get; set; }
    public string PermissionStatus { get; set; }

    public User(string name, string role)
    {
        Name = name;
        Role = role;
        Requested = false;
        PermissionStatus = "";
    }
}
