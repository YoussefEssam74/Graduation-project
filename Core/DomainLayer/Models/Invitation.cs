using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Invitation code issued by a Receptionist or Admin to allow a new member to register.
    /// </summary>
    public class Invitation
    {
        public int InvitationId { get; set; }

        /// <summary>
        /// Unique invitation code (GUID-based).
        /// </summary>
        public string Code { get; set; } = Guid.NewGuid().ToString("N").ToUpper();

        /// <summary>
        /// The user (Receptionist or Admin) who created this invitation.
        /// </summary>
        public int CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;

        /// <summary>
        /// The user who redeemed this invitation (set on registration).
        /// </summary>
        public int? UsedByUserId { get; set; }
        public User? UsedBy { get; set; }

        /// <summary>
        /// Optional subscription plan to auto-apply when the invitation is redeemed.
        /// </summary>
        public int? SubscriptionPlanId { get; set; }
        public SubscriptionPlan? SubscriptionPlan { get; set; }

        public bool IsUsed { get; set; } = false;

        /// <summary>
        /// Timestamp when the invited guest scanned the QR at the gym entrance.
        /// </summary>
        public DateTime? GuestVisitedAt { get; set; }

        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
