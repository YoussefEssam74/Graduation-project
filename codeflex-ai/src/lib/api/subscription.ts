import { apiFetch, type ApiResponse } from './client';

export interface SubscriptionPlanDto {
  planId: number;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  features?: string;
  isActive: boolean;
}

export interface CreateSubscriptionDto {
  userId: number;
  planId: number;
  paymentMethod?: string;
}

export const subscriptionApi = {
  /**
   * Get all subscription plans
   */
  async getAllPlans(): Promise<ApiResponse<SubscriptionPlanDto[]>> {
    return apiFetch<SubscriptionPlanDto[]>('/subscription/plans');
  },

  /**
   * Get active subscription plans only
   */
  async getActivePlans(): Promise<ApiResponse<SubscriptionPlanDto[]>> {
    return apiFetch<SubscriptionPlanDto[]>('/subscription/plans/active');
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
  async createSubscription(data: CreateSubscriptionDto): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>('/subscription', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: number): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/subscription/user/${userId}/active`);
  },
};
