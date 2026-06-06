import { apiFetch, type ApiResponse } from "./client";

export interface PaymentDto {
  paymentId: number;
  userId: number;
  userName: string;
  amount: number;
  paymentMethod: string;
  status: number;
  statusText: string;
  transactionId?: string;
  paymentDate: string;
  createdAt: string;
}

export interface CreatePaymentDto {
  userId: number;
  amount: number;
  paymentMethod: string;
  paymentType?: string;
  packageId?: number;
  transactionId?: string;
}

export const paymentApi = {
  /**
   * Create a new payment
   */
  async createPayment(
    data: CreatePaymentDto,
  ): Promise<ApiResponse<PaymentDto>> {
    return apiFetch<PaymentDto>("/payment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Get payment by ID
   */
  async getPayment(id: number): Promise<ApiResponse<PaymentDto>> {
    return apiFetch<PaymentDto>(`/payment/${id}`);
  },

  /**
   * Get all payments for a user
   */
  async getUserPayments(userId: number): Promise<ApiResponse<PaymentDto[]>> {
    return apiFetch<PaymentDto[]>(`/payment/user/${userId}`);
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: number,
    status: number,
    transactionId?: string,
  ): Promise<ApiResponse<PaymentDto>> {
    const url = transactionId
      ? `/payment/${id}/status?transactionId=${encodeURIComponent(transactionId)}`
      : `/payment/${id}/status`;

    return apiFetch<PaymentDto>(url, {
      method: "PUT",
      body: JSON.stringify(status),
    });
  },

  /**
   * Get all payments in the system (Admin only)
   */
  async getAllPayments(limit = 100): Promise<ApiResponse<PaymentDto[]>> {
    return apiFetch<PaymentDto[]>(`/payment?limit=${limit}`);
  },

  /**
   * Create Stripe Checkout Session
   */
  async createStripeCheckoutSession(data: {
    planId: number;
    flowType: "subscribe" | "change-plan";
    originUrl: string;
    couponCode?: string;
  }): Promise<ApiResponse<{ sessionId: string; url: string }>> {
    return apiFetch<{ sessionId: string; url: string }>("/stripe/create-checkout-session", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Verify Stripe Session
   */
  async verifyStripeSession(sessionId: string): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/stripe/verify-session?sessionId=${encodeURIComponent(sessionId)}`, {
      method: "POST",
    });
  },
};
