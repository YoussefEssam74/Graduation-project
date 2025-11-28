using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction.Services;
using Shared.DTOs.NutritionPlan;

namespace IntelliFit.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/nutrition-plans")]
    public class NutritionPlanController : ControllerBase
    {
        private readonly INutritionPlanService _nutritionPlanService;

        public NutritionPlanController(INutritionPlanService nutritionPlanService)
        {
            _nutritionPlanService = nutritionPlanService;
        }

        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberPlans(int memberId)
        {
            var plans = await _nutritionPlanService.GetMemberPlansAsync(memberId);
            return Ok(plans);
        }

        [HttpGet("{planId}")]
        public async Task<IActionResult> GetPlanDetails(int planId)
        {
            var plan = await _nutritionPlanService.GetPlanDetailsAsync(planId);
            if (plan == null)
            {
                return NotFound(new { message = "Nutrition plan not found" });
            }
            return Ok(plan);
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePlan([FromBody] GenerateNutritionPlanDto generateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var plan = await _nutritionPlanService.GeneratePlanAsync(generateDto);
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
                var plan = await _nutritionPlanService.UpdatePlanAsync(planId, updateDto);
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
                var plan = await _nutritionPlanService.DeactivatePlanAsync(planId);
                return Ok(plan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
