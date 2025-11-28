using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutPlan;

namespace IntelliFit.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/workout-plans")]
    public class WorkoutPlanController : ControllerBase
    {
        private readonly IWorkoutPlanService _workoutPlanService;

        public WorkoutPlanController(IWorkoutPlanService workoutPlanService)
        {
            _workoutPlanService = workoutPlanService;
        }

        [HttpGet("templates")]
        public async Task<IActionResult> GetAllTemplates()
        {
            var templates = await _workoutPlanService.GetAllTemplatesAsync();
            return Ok(templates);
        }

        [HttpGet("templates/{id}")]
        public async Task<IActionResult> GetTemplateById(int id)
        {
            var template = await _workoutPlanService.GetPlanByIdAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Workout template not found" });
            }
            return Ok(template);
        }

        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberPlans(int memberId)
        {
            var plans = await _workoutPlanService.GetMemberPlansAsync(memberId);
            return Ok(plans);
        }

        [HttpGet("{memberPlanId}")]
        public async Task<IActionResult> GetMemberPlanDetails(int memberPlanId)
        {
            var plan = await _workoutPlanService.GetMemberPlanDetailsAsync(memberPlanId);
            if (plan == null)
            {
                return NotFound(new { message = "Workout plan not found" });
            }
            return Ok(plan);
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignPlanToMember([FromBody] AssignWorkoutPlanDto assignDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var assignedPlan = await _workoutPlanService.AssignPlanToMemberAsync(assignDto);
                return CreatedAtAction(nameof(GetMemberPlanDetails), new { memberPlanId = assignedPlan.MemberPlanId }, assignedPlan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("{memberPlanId}/progress")]
        public async Task<IActionResult> UpdateProgress(int memberPlanId, [FromBody] UpdateProgressDto progressDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var updatedPlan = await _workoutPlanService.UpdateProgressAsync(memberPlanId, progressDto);
                return Ok(updatedPlan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("{memberPlanId}/complete")]
        public async Task<IActionResult> CompletePlan(int memberPlanId)
        {
            try
            {
                var completedPlan = await _workoutPlanService.CompletePlanAsync(memberPlanId);
                return Ok(completedPlan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
