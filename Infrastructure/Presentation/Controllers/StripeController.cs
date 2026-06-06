using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Payment;
using Shared.Helpers;

namespace Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StripeController(IServiceManager _serviceManager) : ApiControllerBase
    {
        /// <summary>
        /// Create a Stripe Checkout Session for subscription
        /// </summary>
        [HttpPost("create-checkout-session")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> CreateCheckoutSession([FromBody] CreateStripeSessionDto dto)
        {
            try
            {
                var userId = GetUserIdFromToken();
                var (sessionId, url) = await _serviceManager.StripeService.CreateCheckoutSessionAsync(
                    userId, 
                    dto.PlanId, 
                    dto.FlowType, 
                    dto.OriginUrl,
                    dto.CouponCode);

                return Ok(ApiResponse<object>.SuccessResponse(new { sessionId, url }, "Checkout session created successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<object>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Failed to create checkout session", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Verify the Stripe Checkout Session status and apply payment + subscription activation
        /// </summary>
        [HttpPost("verify-session")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> VerifySession([FromQuery] string sessionId)
        {
            try
            {
                if (string.IsNullOrEmpty(sessionId))
                {
                    return BadRequest(ApiResponse<bool>.ErrorResponse("Session ID is required"));
                }

                var success = await _serviceManager.StripeService.VerifyCheckoutSessionAsync(sessionId);
                if (success)
                {
                    return Ok(ApiResponse<bool>.SuccessResponse(true, "Stripe session verified and subscription activated successfully"));
                }

                return BadRequest(ApiResponse<bool>.ErrorResponse("Failed to verify Stripe session or payment was not complete"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Verification error occurred", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Listen to Stripe webhook events for backend-to-backend payment completion sync
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook()
        {
            try
            {
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
                var signatureHeader = Request.Headers["Stripe-Signature"];

                if (string.IsNullOrEmpty(signatureHeader))
                {
                    return BadRequest("Missing Stripe signature header");
                }

                var success = await _serviceManager.StripeService.HandleWebhookAsync(json, signatureHeader);
                if (success)
                {
                    return Ok();
                }

                return BadRequest("Webhook event processing failed");
            }
            catch (Exception ex)
            {
                return BadRequest($"Webhook error: {ex.Message}");
            }
        }
    }
}
