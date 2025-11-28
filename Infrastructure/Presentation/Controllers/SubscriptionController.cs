using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.Subscription;
using Shared.Helpers;

namespace IntelliFit.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubscriptionController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionController(ISubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
        }

        /// <summary>
        /// Get all subscription plans
        /// </summary>
        [HttpGet("plans")]
        public async Task<ActionResult<ApiResponse<IEnumerable<SubscriptionPlanDto>>>> GetAllPlans()
        {
            try
            {
                var plans = await _subscriptionService.GetAllPlansAsync();
                return Ok(ApiResponse<IEnumerable<SubscriptionPlanDto>>.SuccessResponse(plans));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<SubscriptionPlanDto>>.ErrorResponse("Failed to retrieve plans", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get active subscription plans only
        /// </summary>
        [HttpGet("plans/active")]
        public async Task<ActionResult<ApiResponse<IEnumerable<SubscriptionPlanDto>>>> GetActivePlans()
        {
            try
            {
                var plans = await _subscriptionService.GetActivePlansAsync();
                return Ok(ApiResponse<IEnumerable<SubscriptionPlanDto>>.SuccessResponse(plans));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<IEnumerable<SubscriptionPlanDto>>.ErrorResponse("Failed to retrieve active plans", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get subscription plan by ID
        /// </summary>
        [HttpGet("plans/{id}")]
        public async Task<ActionResult<ApiResponse<SubscriptionPlanDto>>> GetPlanById(int id)
        {
            try
            {
                var plan = await _subscriptionService.GetPlanByIdAsync(id);

                if (plan == null)
                {
                    return NotFound(ApiResponse<SubscriptionPlanDto>.ErrorResponse("Subscription plan not found"));
                }

                return Ok(ApiResponse<SubscriptionPlanDto>.SuccessResponse(plan));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<SubscriptionPlanDto>.ErrorResponse("Failed to retrieve plan", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Create user subscription
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> CreateSubscription([FromBody] CreateSubscriptionDto createDto)
        {
            try
            {
                await _subscriptionService.CreateUserSubscriptionAsync(createDto);
                return Ok(ApiResponse<bool>.SuccessResponse(true, "Subscription created successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Failed to create subscription", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Check if user has active subscription
        /// </summary>
        [HttpGet("user/{userId}/active")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> HasActiveSubscription(int userId)
        {
            try
            {
                var hasActive = await _subscriptionService.HasActiveSubscriptionAsync(userId);
                return Ok(ApiResponse<bool>.SuccessResponse(hasActive));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Failed to check subscription status", new List<string> { ex.Message }));
            }
        }
    }
}
