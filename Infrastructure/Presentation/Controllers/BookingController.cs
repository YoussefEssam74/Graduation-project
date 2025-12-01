using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Booking;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/bookings")]
    public class BookingController(IServiceManager _serviceManager) : ApiControllerBase
    {

        #region Create Booking

        [HttpPost]
        public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] CreateBookingDto createDto)
        {
            var booking = await _serviceManager.BookingService.CreateBookingAsync(createDto);
            return Ok(booking);
        }

        #endregion

        #region Get Booking

        [HttpGet("{id}")]
        public async Task<ActionResult<BookingDto>> GetBooking(int id)
        {
            var booking = await _serviceManager.BookingService.GetBookingByIdAsync(id);
            return Ok(booking);
        }

        #endregion

        #region Get User Bookings

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<BookingDto>>> GetUserBookings(int userId)
        {
            var bookings = await _serviceManager.BookingService.GetUserBookingsAsync(userId);
            return Ok(bookings);
        }

        #endregion

        #region Cancel Booking

        [HttpPut("{id}/cancel")]
        public async Task<ActionResult<BookingDto>> CancelBooking(int id, [FromBody] string cancellationReason)
        {
            var booking = await _serviceManager.BookingService.CancelBookingAsync(id, cancellationReason);
            return Ok(booking);
        }

        #endregion

        #region Check In

        [HttpPut("{id}/checkin")]
        public async Task<ActionResult<BookingDto>> CheckIn(int id)
        {
            var booking = await _serviceManager.BookingService.CheckInAsync(id);
            return Ok(booking);
        }

        #endregion

        #region Check Out

        [HttpPut("{id}/checkout")]
        public async Task<ActionResult<BookingDto>> CheckOut(int id)
        {
            var booking = await _serviceManager.BookingService.CheckOutAsync(id);
            return Ok(booking);
        }

        #endregion
    }
}
