using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using Shared.DTOs.NutritionPlan;
using Shared.DTOs.WorkoutAI;

namespace Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/nutrition-plans")]
    public class NutritionPlanController(IServiceManager _serviceManager, ILogger<NutritionPlanController> _logger) : ApiControllerBase
    {
        #region Get Nutrition Plans
        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberPlans(int memberId)
        {
            var plans = await _serviceManager.NutritionPlanService.GetMemberPlansAsync(memberId);
            return Ok(plans);
        }

        [HttpGet("{planId}")]
        public async Task<IActionResult> GetPlanDetails(int planId)
        {
            var plan = await _serviceManager.NutritionPlanService.GetPlanDetailsAsync(planId);
            if (plan == null)
            {
                return NotFound(new { message = "Nutrition plan not found" });
            }
            return Ok(plan);
        }
        #endregion

        #region Generate and Update Plan
        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePlan([FromBody] GenerateNutritionPlanDto generateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var plan = await _serviceManager.NutritionPlanService.GeneratePlanAsync(generateDto);
                return CreatedAtAction(nameof(GetPlanDetails), new { planId = plan.PlanId }, plan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("{planId}")]
        public async Task<IActionResult> UpdatePlan(int planId, [FromBody] GenerateNutritionPlanDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var plan = await _serviceManager.NutritionPlanService.UpdatePlanAsync(planId, updateDto);
                return Ok(plan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("{planId}/deactivate")]
        public async Task<IActionResult> DeactivatePlan(int planId)
        {
            try
            {
                var plan = await _serviceManager.NutritionPlanService.DeactivatePlanAsync(planId);
                return Ok(plan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("coach-review")]
        public async Task<IActionResult> GetCoachReviewPlans()
        {
            if (!IsCoach && !IsAdmin)
                return Forbid();

            var coachUserId = GetUserIdFromToken();
            var plans = await _serviceManager.NutritionPlanService.GetCoachReviewNutritionPlansAsync(coachUserId);
            return Ok(plans);
        }

        [HttpPut("{planId}/coach-edit")]
        public async Task<IActionResult> CoachEditPlan(int planId, [FromBody] CoachEditNutritionPlanRequest request)
        {
            try
            {
                if (!IsCoach && !IsAdmin)
                    return Forbid();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var coachUserId = GetUserIdFromToken();
                var success = await _serviceManager.NutritionPlanService.EditNutritionPlanAsync(planId, coachUserId, request);
                if (!success)
                    return BadRequest(new { message = "Failed to edit nutrition plan" });

                return Ok(new { success = true, message = "Nutrition plan edited and approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing nutrition plan {PlanId}", planId);
                return StatusCode(500, new { error = "An internal server error occurred while updating the nutrition plan." });
            }
        }

        [HttpPut("{planId}/coach-status")]
        public async Task<IActionResult> CoachUpdateStatus(int planId, [FromBody] UpdatePlanStatusRequest request)
        {
            if (!IsCoach && !IsAdmin)
                return Forbid();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var coachUserId = GetUserIdFromToken();
            var success = await _serviceManager.NutritionPlanService.UpdateNutritionPlanStatusAsync(planId, coachUserId, request.Status, request.Notes);
            if (!success)
                return BadRequest(new { message = "Failed to update nutrition plan status" });

            return Ok(new { success = true, message = $"Nutrition plan status updated to {request.Status}" });
        }
        #endregion
    }
}
