using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Invitation;

namespace Presentation.Controllers
{
    [Route("api/invitations")]
    public class InvitationController(IServiceManager _serviceManager) : ApiControllerBase
    {
        /// <summary>
        /// Create a new invitation code (Receptionist or Admin only)
        /// </summary>
        [Authorize(Roles = "Receptionist,Admin")]
        [HttpPost]
        public async Task<ActionResult<InvitationDto>> CreateInvitation([FromBody] CreateInvitationDto dto)
        {
            try
            {
                var userId = GetUserIdFromToken();
                var result = await _serviceManager.InvitationService.CreateInvitationAsync(userId, dto);
                return CreatedAtAction(nameof(GetInvitations), result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all invitations created by the current user
        /// </summary>
        [Authorize(Roles = "Receptionist,Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvitationDto>>> GetInvitations()
        {
            try
            {
                var userId = GetUserIdFromToken();
                var result = await _serviceManager.InvitationService.GetInvitationsAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Validate an invitation code (public — called during signup)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("validate/{code}")]
        public async Task<ActionResult<ValidateInvitationResponseDto>> ValidateInvitation(string code)
        {
            try
            {
                var result = await _serviceManager.InvitationService.ValidateInvitationAsync(code);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get the invitation quota for the current member (how many they can send)
        /// </summary>
        [Authorize(Roles = "Member")]
        [HttpGet("member/quota")]
        public async Task<ActionResult<MemberInvitationQuotaDto>> GetMemberQuota()
        {
            try
            {
                var userId = GetUserIdFromToken();
                var result = await _serviceManager.InvitationService.GetMemberQuotaAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all invitations sent by the current member
        /// </summary>
        [Authorize(Roles = "Member")]
        [HttpGet("member")]
        public async Task<ActionResult<IEnumerable<InvitationDto>>> GetMemberInvitations()
        {
            try
            {
                var userId = GetUserIdFromToken();
                var result = await _serviceManager.InvitationService.GetMemberInvitationsAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Create a new invitation as a member (limited by subscription plan quota)
        /// </summary>
        [Authorize(Roles = "Member")]
        [HttpPost("member")]
        public async Task<ActionResult<InvitationDto>> CreateMemberInvitation()
        {
            try
            {
                var userId = GetUserIdFromToken();
                var result = await _serviceManager.InvitationService.CreateMemberInvitationAsync(userId);
                return CreatedAtAction(nameof(GetMemberInvitations), result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Guest check-in via QR scan at gym entrance (public — no auth required)
        /// Records the visit and returns inviter info to show a welcome screen.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("guest-visit/{code}")]
        public async Task<ActionResult<GuestCheckInResponseDto>> GuestCheckIn(string code)
        {
            try
            {
                var result = await _serviceManager.InvitationService.GuestCheckInAsync(code);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
