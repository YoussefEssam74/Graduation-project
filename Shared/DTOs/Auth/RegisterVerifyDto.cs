using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Auth
{
    /// <summary>
    /// Payload for POST /auth/register/verify-and-complete
    /// Step 2 of email-verified sign-up: the 6-digit OTP plus the full registration data.
    /// </summary>
    public class RegisterVerifyDto
    {
        [Required(ErrorMessage = "Verification code is required")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be 6 digits")]
        public string Otp { get; set; } = null!;

        [Required]
        public RegisterRequestDto RegisterData { get; set; } = null!;
    }
}
