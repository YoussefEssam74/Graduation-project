using Microsoft.AspNetCore.SignalR;
using ServiceAbstraction.Services;
using IntelliFit.Presentation.Hubs;

namespace Service.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendNotificationToUserAsync(int userId, string title, string message, string type)
        {
            await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", new
            {
                title,
                message,
                type,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendNotificationToRoleAsync(string role, string title, string message, string type)
        {
            await _hubContext.Clients.Group($"role_{role}").SendAsync("ReceiveNotification", new
            {
                title,
                message,
                type,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendNotificationToAllAsync(string title, string message, string type)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                title,
                message,
                type,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task SendBookingConfirmationAsync(int userId, string bookingDetails)
        {
            await SendNotificationToUserAsync(
                userId,
                "Booking Confirmed",
                $"Your booking has been confirmed: {bookingDetails}",
                "success"
            );
        }

        public async Task SendBookingCancellationAsync(int userId, string reason)
        {
            await SendNotificationToUserAsync(
                userId,
                "Booking Cancelled",
                $"Your booking has been cancelled. Reason: {reason}",
                "warning"
            );
        }

        public async Task SendWorkoutPlanAssignedAsync(int memberId, string planName, string coachName)
        {
            await SendNotificationToUserAsync(
                memberId,
                "New Workout Plan",
                $"Coach {coachName} has assigned you a new workout plan: {planName}",
                "info"
            );
        }

        public async Task SendEquipmentStatusUpdateAsync(string equipmentName, string status)
        {
            await SendNotificationToRoleAsync(
                "Reception",
                "Equipment Status Update",
                $"{equipmentName} is now {status}",
                "info"
            );
        }

        public async Task SendPaymentConfirmationAsync(int userId, decimal amount, string description)
        {
            await SendNotificationToUserAsync(
                userId,
                "Payment Confirmed",
                $"Payment of ${amount:F2} for {description} has been processed successfully",
                "success"
            );
        }
    }
}
