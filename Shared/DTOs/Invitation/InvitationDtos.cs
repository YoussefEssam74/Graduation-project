using System;
using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Invitation
{
    public class CreateInvitationDto
    {
        [Required(ErrorMessage = "Expiry date is required")]
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Optional subscription plan to auto-link with this invitation.
        /// </summary>
        public int? SubscriptionPlanId { get; set; }
    }

    public class InvitationDto
    {
        public int InvitationId { get; set; }
        public string Code { get; set; } = null!;
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = null!;
        public int? UsedByUserId { get; set; }
        public string? UsedByName { get; set; }
        public int? SubscriptionPlanId { get; set; }
        public string? SubscriptionPlanName { get; set; }
        public bool IsUsed { get; set; }
        public DateTime? GuestVisitedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class GuestCheckInResponseDto
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = null!;
        public string? Code { get; set; }
        public string? InvitedByName { get; set; }
        public DateTime? GuestVisitedAt { get; set; }
        public bool IsExpired { get; set; }
        public bool IsAlreadyUsed { get; set; }
    }

    public class ValidateInvitationResponseDto
    {
        public bool IsValid { get; set; }
        public string? Code { get; set; }
        public string? Message { get; set; }
        public int? SubscriptionPlanId { get; set; }
        public string? SubscriptionPlanName { get; set; }
    }

    public class MemberInvitationQuotaDto
    {
        public int InvitationsAllowed { get; set; }
        public int InvitationsUsed { get; set; }
        public int InvitationsRemaining { get; set; }
        public string? SubscriptionPlanName { get; set; }
    }
}
