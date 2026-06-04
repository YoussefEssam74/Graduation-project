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
  maxFreezeDays: number;
  isPopular: boolean;
  isActive: boolean;
  freeWorkoutPlans?: number;
  freeNutritionPlans?: number;
  extraWorkoutPlanTokenCost?: number;
  extraNutritionPlanTokenCost?: number;
  freeAiCoachMessagesPerDay?: number;
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
  freeWorkoutPlans?: number;
  freeNutritionPlans?: number;
  extraWorkoutPlanTokenCost?: number;
  extraNutritionPlanTokenCost?: number;
  freeAiCoachMessagesPerDay?: number;
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

  /**
   * Create a new subscription plan (Admin only)
   */
  async createPlan(data: CreateSubscriptionPlanDto): Promise<ApiResponse<SubscriptionPlanDto>> {
    return apiFetch<SubscriptionPlanDto>("/subscription/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing subscription plan (Admin only)
   */
  async updatePlan(id: number, data: UpdateSubscriptionPlanDto): Promise<ApiResponse<SubscriptionPlanDto>> {
    return apiFetch<SubscriptionPlanDto>(`/subscription/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a subscription plan (Admin only)
   */
  async deletePlan(id: number): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/subscription/plans/${id}`, {
      method: "DELETE",
    });
  },
};

export interface CreateSubscriptionPlanDto {
  planName: string;
  price: number;
  durationDays: number;
  description?: string;
  tokensIncluded: number;
  invitationsAllowed: number;
  features?: string;
  maxBookingsPerDay?: number;
  maxFreezeDays: number;
  isPopular: boolean;
  freeWorkoutPlans?: number;
  freeNutritionPlans?: number;
  extraWorkoutPlanTokenCost?: number;
  extraNutritionPlanTokenCost?: number;
  freeAiCoachMessagesPerDay?: number;
}

export interface UpdateSubscriptionPlanDto extends CreateSubscriptionPlanDto {
  isActive: boolean;
}
