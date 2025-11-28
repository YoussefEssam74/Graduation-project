using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using Shared.DTOs.User;
using Shared.Helpers;

namespace IntelliFit.Presentation.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> GetUser(int id)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(id);

                if (user == null)
                {
                    return NotFound(ApiResponse<UserDto>.ErrorResponse("User not found"));
                }

                return Ok(ApiResponse<UserDto>.SuccessResponse(user));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<UserDto>.ErrorResponse("Failed to retrieve user", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Update user profile
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile(int id, [FromBody] UpdateProfileDto updateDto)
        {
            try
            {
                var user = await _userService.UpdateProfileAsync(id, updateDto);
                return Ok(ApiResponse<UserDto>.SuccessResponse(user, "Profile updated successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<UserDto>.ErrorResponse(ex.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<UserDto>.ErrorResponse("Failed to update profile", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Get user token balance
        /// </summary>
        [HttpGet("{id}/tokens")]
        public async Task<ActionResult<ApiResponse<int>>> GetTokenBalance(int id)
        {
            try
            {
                var balance = await _userService.GetTokenBalanceAsync(id);
                return Ok(ApiResponse<int>.SuccessResponse(balance));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<int>.ErrorResponse("Failed to retrieve token balance", new List<string> { ex.Message }));
            }
        }

        /// <summary>
        /// Deactivate user account
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeactivateUser(int id)
        {
            try
            {
                var result = await _userService.DeactivateUserAsync(id);

                if (!result)
                {
                    return NotFound(ApiResponse<bool>.ErrorResponse("User not found"));
                }

                return Ok(ApiResponse<bool>.SuccessResponse(true, "User deactivated successfully"));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Failed to deactivate user", new List<string> { ex.Message }));
            }
        }
    }
}
