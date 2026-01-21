using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ServiceAbstraction;
using Shared.DTOs.WorkoutPlan;

namespace Presentation.Controllers
{
    [Authorize]
    [Route("api/workout-plans")]
    public class WorkoutPlanController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Get All Templates

        [HttpGet("templates")]
        public async Task<IActionResult> GetAllTemplates()
        {
            var templates = await _serviceManager.WorkoutPlanService.GetAllTemplatesAsync();
            return Ok(templates);
        }

        #endregion

        #region Get Template By Id

        [HttpGet("templates/{id}")]
        public async Task<IActionResult> GetTemplateById(int id)
        {
            var template = await _serviceManager.WorkoutPlanService.GetPlanByIdAsync(id);
            return Ok(template);
        }

        #endregion

        #region Get Member Plans

        [HttpGet("member/{memberId}")]
        public async Task<IActionResult> GetMemberPlans(int memberId)
        {
            var plans = await _serviceManager.WorkoutPlanService.GetMemberPlansAsync(memberId);
            return Ok(plans);
        }

        #endregion

        #region Get Member Plan Details

        [HttpGet("{memberPlanId}")]
        public async Task<IActionResult> GetMemberPlanDetails(int memberPlanId)
        {
            var plan = await _serviceManager.WorkoutPlanService.GetMemberPlanDetailsAsync(memberPlanId);
            return Ok(plan);
        }

        #endregion

        #region Assign Plan To Member

        [HttpPost("assign")]
        public async Task<IActionResult> AssignPlanToMember([FromBody] AssignWorkoutPlanDto assignDto)
        {
            var assignedPlan = await _serviceManager.WorkoutPlanService.AssignPlanToMemberAsync(assignDto);
            return CreatedAtAction(nameof(GetMemberPlanDetails), new { memberPlanId = assignedPlan.MemberPlanId }, assignedPlan);
        }

        #endregion

        #region Update Progress

        [HttpPut("{memberPlanId}/progress")]
        public async Task<IActionResult> UpdateProgress(int memberPlanId, [FromBody] UpdateProgressDto progressDto)
        {
            var updatedPlan = await _serviceManager.WorkoutPlanService.UpdateProgressAsync(memberPlanId, progressDto);
            return Ok(updatedPlan);
        }

        #endregion

        #region Complete Plan

        [HttpPut("{memberPlanId}/complete")]
        public async Task<IActionResult> CompletePlan(int memberPlanId)
        {
            var completedPlan = await _serviceManager.WorkoutPlanService.CompletePlanAsync(memberPlanId);
            return Ok(completedPlan);
        }

        #endregion

        #region Activate Plan

        /// <summary>
        /// Activate a workout plan (makes it the user's current active plan)
        /// PUT: api/workout-plans/{planId}/activate
        /// </summary>
        [HttpPut("{planId}/activate")]
        public async Task<IActionResult> ActivatePlan(int planId, [FromBody] ActivatePlanDto activateDto)
        {
            try
            {
                var success = await _serviceManager.WorkoutPlanService.ActivatePlanAsync(planId, activateDto.UserId);
                if (!success)
                {
                    return NotFound(new { success = false, message = "Plan not found or not owned by user" });
                }
                return Ok(new { success = true, message = "Plan activated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error activating plan: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = $"Internal error: {ex.Message}" });
            }
        }

        #endregion

        #region Schedule Workout Plan

        /// <summary>
        /// Schedule a workout plan with start date and preferred workout days/times
        /// POST: api/workout-plans/{planId}/schedule
        /// </summary>
        [HttpPost("{planId}/schedule")]
        public async Task<IActionResult> ScheduleWorkoutPlan(int planId, [FromBody] Shared.DTOs.WorkoutPlan.ScheduleWorkoutPlanDto scheduleDto)
        {
            // Ensure the planId matches the DTO
            scheduleDto.PlanId = planId;

            var result = await _serviceManager.WorkoutPlanService.ScheduleWorkoutPlanAsync(scheduleDto);
            if (result == null)
            {
                return NotFound(new { success = false, message = "Plan not found or not owned by user" });
            }
            return Ok(new { success = true, message = "Plan scheduled successfully", data = result });
        }

        #endregion

        #region Coach Tools

        /// <summary>
        /// Update exercise notes in a workout plan (Coach only)
        /// PUT: api/workout-plans/{planId}/exercise-notes
        /// </summary>
        [HttpPut("{planId}/exercise-notes")]
        // [Authorize(Roles = "Coach,Admin")] // Uncomment when roles are fully enforced
        public async Task<IActionResult> UpdateExerciseNotes(int planId, [FromBody] UpdateExerciseNotesDto updateDto)
        {
            if (planId != updateDto.PlanId)
            {
                return BadRequest("Plan ID mismatch");
            }

            var result = await _serviceManager.WorkoutPlanService.UpdateExerciseNotesAsync(updateDto);
            if (!result)
            {
                return NotFound(new { success = false, message = "Plan or exercise not found" });
            }
            return Ok(new { success = true, message = "Exercise notes updated successfully" });
        }

        #endregion
    }

    public class ActivatePlanDto
    {
        public int UserId { get; set; }
    }
}

