using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.Booking;
using Shared.Helpers;

namespace IntelliFit.Presentation.Controllers
{
    [Route("api/bookings")]
    [ApiController]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        /// <summary>
        /// Create a new booking
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<BookingDto>>> CreateBooking([FromBody] CreateBookingDto createDto)
        {
            try
            {
                var booking = await _bookingService.CreateBookingAsync(createDto);
                return Ok(ApiResponse<BookingDto>.SuccessResponse(booking, "Booking created successfully"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<BookingDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<BookingDto>.ErrorResponse("Failed to create booking", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get booking by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<BookingDto>>> GetBooking(int id)
        {
            try
            {
                var booking = await _bookingService.GetBookingByIdAsync(id);

                if (booking == null)
                {
                    return NotFound(ApiResponse<BookingDto>.ErrorResponse("Booking not found"));
                }

                return Ok(ApiResponse<BookingDto>.SuccessResponse(booking));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<BookingDto>.ErrorResponse("Failed to retrieve booking", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get all bookings for a user
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<BookingDto>>>> GetUserBookings(int userId)
        {
            try
            {
                var bookings = await _bookingService.GetUserBookingsAsync(userId);
                return Ok(ApiResponse<IEnumerable<BookingDto>>.SuccessResponse(bookings));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<BookingDto>>.ErrorResponse("Failed to retrieve bookings", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Cancel a booking
        /// </summary>
        [HttpPut("{id}/cancel")]
        public async Task<ActionResult<ApiResponse<BookingDto>>> CancelBooking(int id, [FromBody] string cancellationReason)
        {
            try
            {
                var booking = await _bookingService.CancelBookingAsync(id, cancellationReason);
                return Ok(ApiResponse<BookingDto>.SuccessResponse(booking, "Booking cancelled successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<BookingDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<BookingDto>.ErrorResponse("Failed to cancel booking", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Check in to a booking
        /// </summary>
        [HttpPut("{id}/checkin")]
        public async Task<ActionResult<ApiResponse<BookingDto>>> CheckIn(int id)
        {
            try
            {
                var booking = await _bookingService.CheckInAsync(id);
                return Ok(ApiResponse<BookingDto>.SuccessResponse(booking, "Checked in successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<BookingDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<BookingDto>.ErrorResponse("Check-in failed", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Check out from a booking
        /// </summary>
        [HttpPut("{id}/checkout")]
        public async Task<ActionResult<ApiResponse<BookingDto>>> CheckOut(int id)
        {
            try
            {
                var booking = await _bookingService.CheckOutAsync(id);
                return Ok(ApiResponse<BookingDto>.SuccessResponse(booking, "Checked out successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<BookingDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<BookingDto>.ErrorResponse("Check-out failed", new List<string> { ex.Message }));
            }
        }
    }
}
