using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace SignalR_Example.SignalR
{
    public class PeopleHub : Hub
    {
        private static ConcurrentDictionary<string, string> _users = new ConcurrentDictionary<string, string>();

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("UpdateUserList", _users.Values.ToList());
            await base.OnConnectedAsync();
        }

        public async Task<bool> ValidateUsername(string user)
        {
            return !_users.Values.Contains(user);
        }

        public async Task AddUser(string user)
        {
            _users[Context.ConnectionId] = user;
            await UpdateUsers();
        }

        public async Task RemoveUser(string user)
        {
            string removedUser;
            _users.TryRemove(Context.ConnectionId, out removedUser);
            await UpdateUsers();
        }

        private async Task UpdateUsers()
        {
            await Clients.All.SendAsync("UpdateUserList", _users.Values.ToList());
        }
    }
}
