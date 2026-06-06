using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Payment
{
    public class CreateStripeSessionDto
    {
        [Required]
        public int PlanId { get; set; }

        [Required]
        public string FlowType { get; set; } = "subscribe"; // "subscribe" or "change-plan"

        [Required]
        public string OriginUrl { get; set; } = null!;

        public string? CouponCode { get; set; }
    }
}
