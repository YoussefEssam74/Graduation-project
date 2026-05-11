using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Subscription
{
    public class ChangePlanDto
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int NewPlanId { get; set; }

        [Required]
        public int PaymentId { get; set; }
    }
}
