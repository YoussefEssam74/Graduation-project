using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Auth
{
    /// <summary>
    /// Payload for POST /auth/register/send-otp
    /// Step 1 of email-verified sign-up: supply the email to verify.
    /// </summary>
    public class RegisterSendOtpDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = null!;
    }
}
