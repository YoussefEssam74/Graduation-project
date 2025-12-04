using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace IntelliFit.Presentation.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ILogger<ChatHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // Add user to their personal chat room
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                _logger.LogInformation("User {UserId} connected to chat hub and added to group user_{UserId}", userId, userId);
            }
            else
            {
                _logger.LogWarning("User connected but userId claim not found");
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

            _logger.LogInformation("Member {UserId} ({UserName}) sending message to coach {CoachId}: {Message}",
                userId, userName, coachId, message);

            await Clients.Group($"user_{coachId}").SendAsync("ReceiveMessage", new
            {
                senderId = userId,
                senderName = userName,
                message,
                timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Message sent to group user_{CoachId}", coachId);
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

            _logger.LogInformation("Coach {UserId} ({UserName}) sending message to member {MemberId}: {Message}",
                userId, userName, memberId, message);

            await Clients.Group($"user_{memberId}").SendAsync("ReceiveMessage", new
            {
                senderId = userId,
                senderName = userName,
                message,
                timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("Message sent to group user_{MemberId}", memberId);
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
