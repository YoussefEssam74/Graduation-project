import { apiFetch } from "@/lib/api/client";

export interface InvitationDto {
  invitationId: number;
  code: string;
  createdByUserId: number;
  createdByName: string;
  usedByUserId?: number;
  usedByName?: string;
  subscriptionPlanId?: number;
  subscriptionPlanName?: string;
  isUsed: boolean;
  guestVisitedAt?: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  expiresAt: string;
  subscriptionPlanId?: number;
}

export interface ValidateInvitationResponse {
  isValid: boolean;
  code?: string;
  message?: string;
  subscriptionPlanId?: number;
  subscriptionPlanName?: string;
}

export interface MemberInvitationQuota {
  invitationsAllowed: number;
  invitationsUsed: number;
  invitationsRemaining: number;
  subscriptionPlanName?: string;
}

export interface GuestCheckInResponse {
  isValid: boolean;
  message: string;
  code?: string;
  invitedByName?: string;
  guestVisitedAt?: string;
  isExpired: boolean;
  isAlreadyUsed: boolean;
}

export const invitationsApi = {
  create: (data: CreateInvitationRequest) =>
    apiFetch<InvitationDto>("/invitations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyInvitations: () => apiFetch<InvitationDto[]>("/invitations"),
  validate: (code: string) =>
    apiFetch<ValidateInvitationResponse>(`/invitations/validate/${code}`),
  // Member self-serve invitation endpoints
  getMemberQuota: () =>
    apiFetch<MemberInvitationQuota>("/invitations/member/quota"),
  getMemberInvitations: () =>
    apiFetch<InvitationDto[]>("/invitations/member"),
  createMemberInvitation: () =>
    apiFetch<InvitationDto>("/invitations/member", { method: "POST" }),
  // Guest check-in: called when QR is scanned at the gym entrance
  guestCheckIn: (code: string) =>
    apiFetch<GuestCheckInResponse>(`/invitations/guest-visit/${code}`, {
      method: "POST",
    }),
};
