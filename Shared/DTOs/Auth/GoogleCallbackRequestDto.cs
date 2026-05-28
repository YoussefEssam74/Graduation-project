namespace Shared.DTOs.Auth
{
    /// <summary>
    /// Request body for POST /api/auth/google/callback.
    /// The frontend success page sends the authorization code and the
    /// redirect_uri it used so the backend can exchange the code with Google.
    /// </summary>
    public class GoogleCallbackRequestDto
    {
        /// <summary>The authorization code returned by Google in the redirect.</summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// The redirect_uri that was sent in the original authorization request.
        /// Must match exactly for Google's CSRF validation.
        /// </summary>
        public string RedirectUri { get; set; } = string.Empty;
    }
}
