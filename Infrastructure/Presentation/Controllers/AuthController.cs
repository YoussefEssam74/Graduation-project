using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction;
using Shared.DTOs.Auth;
using Shared.DTOs.User;
using System.Security.Claims;

namespace Presentation.Controllers
{
    public class AuthController(IServiceManager _serviceManager) : ApiControllerBase
    {
        #region Login

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto loginDto)
        {
            try
            {
                var result = await _serviceManager.AuthService.LoginAsync(loginDto);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // Treat invalid operations as bad requests (e.g., account issues)
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Register (Public - Always Creates Member)

        /// <summary>
        /// Public registration - always creates users with Member role
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto registerDto)
        {
            try
            {
                var result = await _serviceManager.AuthService.RegisterAsync(registerDto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Admin-Only Create User With Role

        /// <summary>
        /// Admin-only endpoint to create users with any role (Coach, Receptionist, Admin)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("create-with-role")]
        public async Task<ActionResult<AuthResponseDto>> CreateUserWithRole(
            [FromBody] RegisterRequestDto registerDto,
            [FromQuery] string role)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(role))
                {
                    return BadRequest(new { error = "Role is required" });
                }

                var result = await _serviceManager.AuthService.CreateUserWithRoleAsync(registerDto, role);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Google OAuth

        /// <summary>
        /// Sign in (or sign up) with a Google ID token issued by the frontend.
        /// </summary>
        [HttpPost("google-login")]
        public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
        {
            try
            {
                var result = await _serviceManager.AuthService.GoogleLoginAsync(dto.IdToken);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        #endregion

        #region Change Password

        /// <summary>
        /// Change password for authenticated user (used for first-login password change)
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { error = "Invalid user token" });
                }

                await _serviceManager.AuthService.ChangePasswordAsync(userId, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
                return Ok(new { message = "Password changed successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #endregion

        #region Complete First Login Setup

        /// <summary>
        /// Mark first login setup as complete
        /// </summary>
        [Authorize]
        [HttpPost("complete-setup")]
        public async Task<ActionResult<UserDto>> CompleteFirstLoginSetup()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { error = "Invalid user token" });
                }

                var result = await _serviceManager.AuthService.CompleteFirstLoginSetupAsync(userId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #endregion

        #region Check Email

        [HttpGet("emailexists")]
        public async Task<ActionResult<bool>> CheckEmail(string email)
        {
            var result = await _serviceManager.AuthService.EmailExistsAsync(email);
            return Ok(result);
        }

        #endregion

        #region Forgot Password (OTP-verified, unauthenticated)

        /// <summary>
        /// Step 1 — Send a reset OTP to the email registered against the given phone number.
        /// Always returns 200 to prevent phone-number enumeration.
        /// </summary>
        [HttpPost("forgot-password/send-otp")]
        public async Task<ActionResult> ForgotPasswordSendOtp([FromBody] ForgotPasswordSendOtpDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { error = "Email is required" });

                await _serviceManager.AuthService.SendForgotPasswordOtpAsync(dto.Email);

                return Ok(new { message = "If an account with that email exists, an OTP has been sent to it." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Step 2 — Verify the OTP and set the new password.
        /// </summary>
        [HttpPost("forgot-password/confirm")]
        public async Task<ActionResult> ForgotPasswordConfirm([FromBody] ForgotPasswordDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(new { error = "Email is required" });

                if (string.IsNullOrWhiteSpace(dto.Otp))
                    return BadRequest(new { error = "OTP is required" });

                if (string.IsNullOrWhiteSpace(dto.NewPassword))
                    return BadRequest(new { error = "New password is required" });

                if (dto.NewPassword != dto.ConfirmPassword)
                    return BadRequest(new { error = "Passwords do not match" });

                var success = await _serviceManager.AuthService.ConfirmForgotPasswordAsync(dto.Email, dto.Otp, dto.NewPassword);

                if (!success)
                    return BadRequest(new { error = "Invalid or expired OTP. Please request a new one." });

                return Ok(new { message = "Password has been reset successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #endregion

        #region OTP Change Password

        /// <summary>
        /// Send a one-time password (OTP) to the user's email for change-password verification
        /// </summary>
        [Authorize]
        [HttpPost("send-change-password-otp")]
        public async Task<ActionResult> SendChangePasswordOtp()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { error = "Invalid user token" });
                if (string.IsNullOrEmpty(emailClaim))
                    return BadRequest(new { error = "Email claim not found in token" });

                await _serviceManager.AuthService.SendChangePasswordOtpAsync(userId, emailClaim);
                return Ok(new { message = "OTP sent to your email" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Verify the OTP supplied by the user for change-password flow
        /// </summary>
        [Authorize]
        [HttpPost("verify-change-password-otp")]
        public async Task<ActionResult> VerifyChangePasswordOtp([FromBody] VerifyOtpDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { error = "Invalid user token" });

                var valid = await _serviceManager.AuthService.VerifyChangePasswordOtpAsync(userId, dto.Otp);
                if (!valid)
                    return BadRequest(new { error = "Invalid or expired OTP" });

                return Ok(new { message = "OTP verified" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        #endregion
    }
}
