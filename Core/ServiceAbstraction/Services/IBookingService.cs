using Shared.DTOs.Booking;
using Shared.Helpers;

namespace ServiceAbstraction.Services
{
    public interface IBookingService
    {
        Task<BookingDto> CreateBookingAsync(CreateBookingDto createDto);
        Task<BookingDto?> GetBookingByIdAsync(int bookingId);
        Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId);
        Task<IEnumerable<BookingDto>> GetAllBookingsAsync();
        Task<IEnumerable<BookingDto>> GetBookingsByStatusAsync(string status);
        Task<IEnumerable<BookingDto>> GetTodaysBookingsAsync();
        Task<IEnumerable<BookingDto>> GetEquipmentBookingsAsync(int equipmentId, DateTime startDate, DateTime endDate);
        Task<IEnumerable<BookingDto>> GetCoachBookingsAsync(int coachId, DateTime startDate, DateTime endDate);
        Task<BookingDto> CancelBookingAsync(int bookingId, string cancellationReason);
        Task<BookingDto> ConfirmBookingAsync(int bookingId);
        Task<BookingDto> CheckInAsync(int bookingId);
        Task<BookingDto> CheckOutAsync(int bookingId);
        Task<bool> IsEquipmentAvailableAsync(int equipmentId, DateTime startTime, DateTime endTime);
        Task<bool> IsCoachAvailableAsync(int coachId, DateTime startTime, DateTime endTime);

        /// <summary>
        /// Check if the user is available (no overlapping bookings) during the specified time slot
        /// </summary>
        Task<bool> IsUserAvailableAsync(int userId, DateTime startTime, DateTime endTime);
    }
}
