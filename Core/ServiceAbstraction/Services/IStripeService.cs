using System.Threading.Tasks;

namespace ServiceAbstraction.Services
{
    public interface IStripeService
    {
        /// <summary>
        /// Creates a Stripe Checkout Session for subscription or plan change
        /// </summary>
        /// <param name="userId">ID of the member subscribing</param>
        /// <param name="planId">ID of the subscription plan</param>
        /// <param name="flowType">Flow type: "subscribe" or "change-plan"</param>
        /// <param name="originUrl">The frontend origin URL (e.g. http://localhost:3000)</param>
        /// <returns>A tuple containing SessionId and Checkout Url</returns>
        Task<(string sessionId, string url)> CreateCheckoutSessionAsync(int userId, int planId, string flowType, string originUrl, string? couponCode = null);

        /// <summary>
        /// Verifies the checkout session with Stripe and triggers database updates (Payment + UserSubscription)
        /// </summary>
        /// <param name="sessionId">The Stripe Checkout Session ID</param>
        /// <returns>True if session was verified and processed successfully, false otherwise</returns>
        Task<bool> VerifyCheckoutSessionAsync(string sessionId);

        /// <summary>
        /// Processes Stripe webhook event raw JSON payload
        /// </summary>
        /// <param name="json">Raw JSON payload from Stripe webhook request</param>
        /// <param name="stripeSignature">The Stripe-Signature header value</param>
        /// <returns>True if event was processed successfully, false otherwise</returns>
        Task<bool> HandleWebhookAsync(string json, string stripeSignature);
    }
}
