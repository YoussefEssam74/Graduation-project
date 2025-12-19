using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;

namespace Service.BackgroundServices
{
    /// <summary>
    /// RULE 5: Daily Equipment Slot Reset
    /// Background service that runs every 24 hours to clean up expired bookings
    /// and mark completed/missed bookings
    /// </summary>
    public class BookingCleanupService : BackgroundService
    {
        private readonly ILogger<BookingCleanupService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(24);

        public BookingCleanupService(
            ILogger<BookingCleanupService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Booking Cleanup Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredBookingsAsync();

                    // Wait for 24 hours before next cleanup
                    _logger.LogInformation("Next booking cleanup scheduled in 24 hours");
                    await Task.Delay(_cleanupInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Booking Cleanup Service is stopping");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while cleaning up bookings");
                    // Wait 1 hour before retrying on error
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task CleanupExpiredBookingsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            try
            {
                var now = DateTime.UtcNow;
                _logger.LogInformation("Starting booking cleanup at {Time}", now);

                // Get all bookings that have passed their end time but are still pending/confirmed
                var expiredBookings = await unitOfWork.Repository<Booking>()
                    .FindAsync(b => b.EndTime < now &&
                                   (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed));

                var expiredList = expiredBookings.ToList();
                _logger.LogInformation("Found {Count} expired bookings to process", expiredList.Count);

                int completedCount = 0;
                int missedCount = 0;

                foreach (var booking in expiredList)
                {
                    // If user checked in, mark as completed
                    if (booking.CheckInTime.HasValue)
                    {
                        booking.Status = BookingStatus.Completed;
                        completedCount++;
                    }
                    else
                    {
                        // User didn't show up - mark as cancelled and refund tokens if applicable
                        booking.Status = BookingStatus.Cancelled;
                        booking.CancellationReason = "No-show: Booking expired without check-in";

                        // Refund tokens for no-shows
                        if (booking.TokensCost > 0)
                        {
                            var user = await unitOfWork.Repository<User>().GetByIdAsync(booking.UserId);
                            if (user != null)
                            {
                                user.TokenBalance += booking.TokensCost;
                                unitOfWork.Repository<User>().Update(user);
                                _logger.LogInformation("Refunded {Tokens} tokens to user {UserId} for missed booking {BookingId}",
                                    booking.TokensCost, user.UserId, booking.BookingId);
                            }
                        }

                        missedCount++;
                    }

                    booking.UpdatedAt = now;
                    unitOfWork.Repository<Booking>().Update(booking);
                }

                await unitOfWork.SaveChangesAsync();

                _logger.LogInformation(
                    "Booking cleanup completed: {Completed} marked as completed, {Missed} marked as missed/cancelled",
                    completedCount, missedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during booking cleanup");
                throw;
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Booking Cleanup Service is stopping");
            await base.StopAsync(stoppingToken);
        }
    }
}
