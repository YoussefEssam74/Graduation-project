using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IntelliFit.Presentation.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal chat room
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Send AI chat message
        /// </summary>
        public async Task SendAIMessage(string message)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            // Echo user message back
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                sender = "user",
                message,
                timestamp = DateTime.UtcNow
            });

            // Simulate AI processing (in real implementation, this would call AI service)
            await Task.Delay(1000);

            // Send AI response
            await Clients.Caller.SendAsync("ReceiveMessage", new
            {
                sender = "ai",
                message = "This is an AI response. Integration with actual AI service pending.",
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Send message to coach (for coach-member chat)
        /// </summary>
        public async Task SendMessageToCoach(int coachId, string message)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;
            var userName = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                         ?? Context.User?.FindFirst("name")?.Value ?? "User";

            await Clients.Group($"user_{coachId}").SendAsync("ReceiveMessage", new
            {
                senderId = userId,
                senderName = userName,
                message,
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Send message to member (for coach-member chat)
        /// </summary>
        public async Task SendMessageToMember(int memberId, string message)
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;
            var userName = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                         ?? Context.User?.FindFirst("name")?.Value ?? "Coach";

            await Clients.Group($"user_{memberId}").SendAsync("ReceiveMessage", new
            {
                senderId = userId,
                senderName = userName,
                message,
                timestamp = DateTime.UtcNow
            });
        }

        /// <summary>
        /// User is typing indicator
        /// </summary>
        public async Task UserTyping(int recipientId)
        {
            var userName = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                         ?? Context.User?.FindFirst("name")?.Value ?? "User";
            await Clients.Group($"user_{recipientId}").SendAsync("UserTyping", userName);
        }

        /// <summary>
        /// User stopped typing
        /// </summary>
        public async Task UserStoppedTyping(int recipientId)
        {
            await Clients.Group($"user_{recipientId}").SendAsync("UserStoppedTyping");
        }
    }
}
