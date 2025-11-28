using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.Payment;
using Shared.Helpers;

namespace IntelliFit.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /// <summary>
        /// Create a new payment
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<PaymentDto>>> CreatePayment([FromBody] CreatePaymentDto createDto)
        {
            try
            {
                var payment = await _paymentService.CreatePaymentAsync(createDto);
                return Ok(ApiResponse<PaymentDto>.SuccessResponse(payment, "Payment created successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<PaymentDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<PaymentDto>.ErrorResponse("Failed to create payment", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get payment by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PaymentDto>>> GetPayment(int id)
        {
            try
            {
                var payment = await _paymentService.GetPaymentByIdAsync(id);

                if (payment == null)
                {
                    return NotFound(ApiResponse<PaymentDto>.ErrorResponse("Payment not found"));
                }

                return Ok(ApiResponse<PaymentDto>.SuccessResponse(payment));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<PaymentDto>.ErrorResponse("Failed to retrieve payment", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get all payments for a user
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<PaymentDto>>>> GetUserPayments(int userId)
        {
            try
            {
                var payments = await _paymentService.GetUserPaymentsAsync(userId);
                return Ok(ApiResponse<IEnumerable<PaymentDto>>.SuccessResponse(payments));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<PaymentDto>>.ErrorResponse("Failed to retrieve payments", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Update payment status
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<ActionResult<ApiResponse<PaymentDto>>> UpdatePaymentStatus(int id, [FromBody] int status, [FromQuery] string? transactionId = null)
        {
            try
            {
                var payment = await _paymentService.UpdatePaymentStatusAsync(id, status, transactionId);
                return Ok(ApiResponse<PaymentDto>.SuccessResponse(payment, "Payment status updated successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<PaymentDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<PaymentDto>.ErrorResponse("Failed to update payment status", new List<string> { ex.Message }));
            }
        }
    }
}
