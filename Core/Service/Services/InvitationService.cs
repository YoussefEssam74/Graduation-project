using Core.ServiceAbstraction.Services;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Shared.DTOs.Invitation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Service.Services
{
    public class InvitationService : IInvitationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public InvitationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<InvitationDto> CreateInvitationAsync(int createdByUserId, CreateInvitationDto dto)
        {
            var expiresAt = dto.ExpiresAt.Kind == DateTimeKind.Utc
                ? dto.ExpiresAt
                : DateTime.SpecifyKind(dto.ExpiresAt, DateTimeKind.Utc);

            var invitation = new Invitation
            {
                Code = Guid.NewGuid().ToString("N").ToUpper(),
                CreatedByUserId = createdByUserId,
                SubscriptionPlanId = dto.SubscriptionPlanId,
                ExpiresAt = expiresAt,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Invitation>().AddAsync(invitation);
            await _unitOfWork.SaveChangesAsync();

            // Reload with navigation properties
            var created = await _unitOfWork.Repository<Invitation>()
                .FirstOrDefaultAsync(i => i.InvitationId == invitation.InvitationId);

            var creator = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.UserId == createdByUserId);

            string? planName = null;
            if (dto.SubscriptionPlanId.HasValue)
            {
                var plan = await _unitOfWork.Repository<SubscriptionPlan>()
                    .FirstOrDefaultAsync(p => p.PlanId == dto.SubscriptionPlanId.Value);
                planName = plan?.PlanName;
            }

            return new InvitationDto
            {
                InvitationId = invitation.InvitationId,
                Code = invitation.Code,
                CreatedByUserId = invitation.CreatedByUserId,
                CreatedByName = creator?.Name ?? "Unknown",
                SubscriptionPlanId = invitation.SubscriptionPlanId,
                SubscriptionPlanName = planName,
                IsUsed = invitation.IsUsed,
                ExpiresAt = invitation.ExpiresAt,
                UsedAt = invitation.UsedAt,
                CreatedAt = invitation.CreatedAt
            };
        }

        public async Task<ValidateInvitationResponseDto> ValidateInvitationAsync(string code)
        {
            var invitation = await _unitOfWork.Repository<Invitation>()
                .FirstOrDefaultAsync(i => i.Code == code.ToUpper());

            if (invitation == null)
            {
                return new ValidateInvitationResponseDto { IsValid = false, Message = "Invitation code not found" };
            }

            if (invitation.IsUsed)
            {
                return new ValidateInvitationResponseDto { IsValid = false, Message = "Invitation code has already been used" };
            }

            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                return new ValidateInvitationResponseDto { IsValid = false, Message = "Invitation code has expired" };
            }

            string? planName = null;
            if (invitation.SubscriptionPlanId.HasValue)
            {
                var plan = await _unitOfWork.Repository<SubscriptionPlan>()
                    .FirstOrDefaultAsync(p => p.PlanId == invitation.SubscriptionPlanId.Value);
                planName = plan?.PlanName;
            }

            return new ValidateInvitationResponseDto
            {
                IsValid = true,
                Code = invitation.Code,
                SubscriptionPlanId = invitation.SubscriptionPlanId,
                SubscriptionPlanName = planName
            };
        }

        public async Task RedeemInvitationAsync(string code, int usedByUserId)
        {
            var invitation = await _unitOfWork.Repository<Invitation>()
                .FirstOrDefaultAsync(i => i.Code == code.ToUpper());

            if (invitation == null)
                throw new InvalidOperationException("Invitation code not found");

            if (invitation.IsUsed)
                throw new InvalidOperationException("Invitation code has already been used");

            if (invitation.ExpiresAt < DateTime.UtcNow)
                throw new InvalidOperationException("Invitation code has expired");

            invitation.IsUsed = true;
            invitation.UsedByUserId = usedByUserId;
            invitation.UsedAt = DateTime.UtcNow;

            _unitOfWork.Repository<Invitation>().Update(invitation);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<InvitationDto>> GetInvitationsAsync(int createdByUserId)
        {
            var invitations = await _unitOfWork.Repository<Invitation>()
                .FindAsync(i => i.CreatedByUserId == createdByUserId);

            var creator = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.UserId == createdByUserId);

            var result = new List<InvitationDto>();
            foreach (var inv in invitations.OrderByDescending(i => i.CreatedAt))
            {
                string? planName = null;
                if (inv.SubscriptionPlanId.HasValue)
                {
                    var plan = await _unitOfWork.Repository<SubscriptionPlan>()
                        .FirstOrDefaultAsync(p => p.PlanId == inv.SubscriptionPlanId.Value);
                    planName = plan?.PlanName;
                }

                string? usedByName = null;
                if (inv.UsedByUserId.HasValue)
                {
                    var usedBy = await _unitOfWork.Repository<User>()
                        .FirstOrDefaultAsync(u => u.UserId == inv.UsedByUserId.Value);
                    usedByName = usedBy?.Name;
                }

                result.Add(new InvitationDto
                {
                    InvitationId = inv.InvitationId,
                    Code = inv.Code,
                    CreatedByUserId = inv.CreatedByUserId,
                    CreatedByName = creator?.Name ?? "Unknown",
                    UsedByUserId = inv.UsedByUserId,
                    UsedByName = usedByName,
                    SubscriptionPlanId = inv.SubscriptionPlanId,
                    SubscriptionPlanName = planName,
                    IsUsed = inv.IsUsed,
                    ExpiresAt = inv.ExpiresAt,
                    UsedAt = inv.UsedAt,
                    CreatedAt = inv.CreatedAt
                });
            }

            return result;
        }

        public async Task<MemberInvitationQuotaDto> GetMemberQuotaAsync(int memberUserId)
        {
            var member = await _unitOfWork.Repository<MemberProfile>()
                .FirstOrDefaultAsync(m => m.UserId == memberUserId);

            if (member == null)
                throw new InvalidOperationException("Member profile not found");

            int allowed = 0;
            string? planName = null;

            if (member.SubscriptionPlanId.HasValue)
            {
                var plan = await _unitOfWork.Repository<SubscriptionPlan>()
                    .FirstOrDefaultAsync(p => p.PlanId == member.SubscriptionPlanId.Value);
                allowed = plan?.InvitationsAllowed ?? 0;
                planName = plan?.PlanName;
            }

            // Count all invitations created by this member (used or not)
            var allInvites = await _unitOfWork.Repository<Invitation>()
                .FindAsync(i => i.CreatedByUserId == memberUserId);
            int usedCount = allInvites.Count();

            return new MemberInvitationQuotaDto
            {
                InvitationsAllowed = allowed,
                InvitationsUsed = usedCount,
                InvitationsRemaining = Math.Max(0, allowed - usedCount),
                SubscriptionPlanName = planName
            };
        }

        public async Task<InvitationDto> CreateMemberInvitationAsync(int memberUserId)
        {
            // Get member's subscription plan
            var member = await _unitOfWork.Repository<MemberProfile>()
                .FirstOrDefaultAsync(m => m.UserId == memberUserId);

            if (member == null)
                throw new InvalidOperationException("Member profile not found");

            int allowed = 0;
            int? planId = null;
            string? planName = null;

            if (member.SubscriptionPlanId.HasValue)
            {
                var plan = await _unitOfWork.Repository<SubscriptionPlan>()
                    .FirstOrDefaultAsync(p => p.PlanId == member.SubscriptionPlanId.Value);
                allowed = plan?.InvitationsAllowed ?? 0;
                planId = plan?.PlanId;
                planName = plan?.PlanName;
            }

            if (allowed == 0)
                throw new InvalidOperationException("Your subscription plan does not include guest invitations");

            // Count how many this member has already created
            var existing = await _unitOfWork.Repository<Invitation>()
                .FindAsync(i => i.CreatedByUserId == memberUserId);
            int usedCount = existing.Count();

            if (usedCount >= allowed)
                throw new InvalidOperationException($"You have used all {allowed} invitation(s) included in your plan");

            // Create invitation valid for 30 days
            var invitation = new Invitation
            {
                Code = Guid.NewGuid().ToString("N").ToUpper(),
                CreatedByUserId = memberUserId,
                SubscriptionPlanId = planId,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Invitation>().AddAsync(invitation);
            await _unitOfWork.SaveChangesAsync();

            var creator = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.UserId == memberUserId);

            return new InvitationDto
            {
                InvitationId = invitation.InvitationId,
                Code = invitation.Code,
                CreatedByUserId = invitation.CreatedByUserId,
                CreatedByName = creator?.Name ?? "Unknown",
                SubscriptionPlanId = invitation.SubscriptionPlanId,
                SubscriptionPlanName = planName,
                IsUsed = false,
                ExpiresAt = invitation.ExpiresAt,
                CreatedAt = invitation.CreatedAt
            };
        }

        public async Task<IEnumerable<InvitationDto>> GetMemberInvitationsAsync(int memberUserId)
        {
            return await GetInvitationsAsync(memberUserId);
        }

        public async Task<GuestCheckInResponseDto> GuestCheckInAsync(string code)
        {
            var invitation = await _unitOfWork.Repository<Invitation>()
                .FirstOrDefaultAsync(i => i.Code == code.ToUpper());

            if (invitation == null)
                return new GuestCheckInResponseDto { IsValid = false, Message = "Invitation not found. This QR code is invalid." };

            var creator = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.UserId == invitation.CreatedByUserId);

            if (invitation.ExpiresAt < DateTime.UtcNow)
                return new GuestCheckInResponseDto
                {
                    IsValid = false,
                    IsExpired = true,
                    Code = invitation.Code,
                    InvitedByName = creator?.Name,
                    Message = "This invitation has expired."
                };

            if (invitation.IsUsed)
                return new GuestCheckInResponseDto
                {
                    IsValid = false,
                    IsAlreadyUsed = true,
                    Code = invitation.Code,
                    InvitedByName = creator?.Name,
                    Message = "This invitation has already been fully redeemed."
                };

            // Record first guest visit timestamp (only if not already set)
            if (invitation.GuestVisitedAt == null)
            {
                invitation.GuestVisitedAt = DateTime.UtcNow;
                _unitOfWork.Repository<Invitation>().Update(invitation);
                await _unitOfWork.SaveChangesAsync();
            }

            return new GuestCheckInResponseDto
            {
                IsValid = true,
                Code = invitation.Code,
                InvitedByName = creator?.Name,
                GuestVisitedAt = invitation.GuestVisitedAt,
                Message = $"Welcome! You are a guest of {creator?.Name ?? "a member"}."
            };
        }
    }
}
