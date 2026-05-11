import { apiFetch, type ApiResponse } from "./client";

export interface SubscriptionPlanDto {
  planId: number;
  planName: string;
  description?: string;
  durationDays: number;
  price: number;
  features?: string;
  tokensIncluded: number;
  invitationsAllowed: number;
  maxBookingsPerDay?: number;
  isPopular: boolean;
  isActive: boolean;
}

export interface CreateSubscriptionDto {
  userId: number;
  planId: number;
  paymentId: number;
}

export interface ChangePlanDto {
  userId: number;
  newPlanId: number;
  paymentId: number;
}

export interface UserSubscriptionDetailsDto {
  subscriptionId: number;
  userId: number;
  planId: number;
  planName: string;
  description?: string;
  features?: string;
  price: number;
  tokensIncluded: number;
  maxBookingsPerDay?: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: string;
  autoRenew: boolean;
  isFrozen: boolean;
  freezeStartDate?: string;
  freezeEndDate?: string;
  maxFreezeDays: number;
}

export const subscriptionApi = {
  /**
   * Get all subscription plans
   */
  async getAllPlans(): Promise<ApiResponse<SubscriptionPlanDto[]>> {
    return apiFetch<SubscriptionPlanDto[]>("/subscription/plans");
  },

  /**
   * Get active subscription plans only
   */
  async getActivePlans(): Promise<ApiResponse<SubscriptionPlanDto[]>> {
    return apiFetch<SubscriptionPlanDto[]>("/subscription/plans/active");
  },

  /**
   * Get subscription plan by ID
   */
  async getPlan(id: number): Promise<ApiResponse<SubscriptionPlanDto>> {
    return apiFetch<SubscriptionPlanDto>(`/subscription/plans/${id}`);
  },

  /**
   * Create user subscription
   */
  async createSubscription(
    data: CreateSubscriptionDto,
  ): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>("/subscription", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: number): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/subscription/user/${userId}/active`);
  },

  /**
   * Get user's active subscription details
   */
  async getUserSubscription(
    userId: number,
  ): Promise<ApiResponse<UserSubscriptionDetailsDto>> {
    return apiFetch<UserSubscriptionDetailsDto>(`/subscription/user/${userId}`);
  },

  /**
   * Change user's active subscription plan
   */
  async changePlan(data: ChangePlanDto): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>("/subscription/change-plan", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async freezeSubscription(
    subscriptionId: number,
    freezeDays: number,
    startDate: string,
  ): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/subscription/${subscriptionId}/freeze`, {
      method: "PUT",
      body: JSON.stringify({ freezeDays, startDate }),
    });
  },

  async unfreezeSubscription(
    subscriptionId: number,
  ): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/subscription/${subscriptionId}/unfreeze`, {
      method: "PUT",
    });
  },

  async getFrozenSubscriptions(): Promise<ApiResponse<UserSubscriptionDetailsDto[]>> {
    return apiFetch<UserSubscriptionDetailsDto[]>("/subscription/frozen");
  },
};
