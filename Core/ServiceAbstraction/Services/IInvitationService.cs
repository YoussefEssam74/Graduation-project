using Shared.DTOs.Invitation;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Core.ServiceAbstraction.Services
{
    public interface IInvitationService
    {
        Task<InvitationDto> CreateInvitationAsync(int createdByUserId, CreateInvitationDto dto);
        Task<ValidateInvitationResponseDto> ValidateInvitationAsync(string code);
        Task RedeemInvitationAsync(string code, int usedByUserId);
        Task<GuestCheckInResponseDto> GuestCheckInAsync(string code);
        Task<IEnumerable<InvitationDto>> GetInvitationsAsync(int createdByUserId);

        // Member self-serve invitation methods
        Task<MemberInvitationQuotaDto> GetMemberQuotaAsync(int memberUserId);
        Task<InvitationDto> CreateMemberInvitationAsync(int memberUserId);
        Task<IEnumerable<InvitationDto>> GetMemberInvitationsAsync(int memberUserId);
    }
}
