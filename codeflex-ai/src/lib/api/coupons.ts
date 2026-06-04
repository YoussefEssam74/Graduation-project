import { apiFetch, type ApiResponse } from "./client";

export enum DiscountType {
  Percentage = 0,
  FixedAmount = 1,
}

export interface CouponDto {
  couponId: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string;
  maxUsage?: number;
  currentUsage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponDto {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string;
  maxUsage?: number;
}

export interface UpdateCouponDto {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string;
  maxUsage?: number;
  isActive: boolean;
}

export const couponsApi = {
  /**
   * Get all coupons (Admin only)
   */
  async getAllCoupons(): Promise<ApiResponse<CouponDto[]>> {
    return apiFetch<CouponDto[]>("/coupons");
  },

  /**
   * Get coupon by ID (Admin only)
   */
  async getCoupon(id: number): Promise<ApiResponse<CouponDto>> {
    return apiFetch<CouponDto>(`/coupons/${id}`);
  },

  /**
   * Get coupon by code (Allow anonymous)
   */
  async getCouponByCode(code: string): Promise<ApiResponse<CouponDto>> {
    return apiFetch<CouponDto>(`/coupons/code/${code}`);
  },

  /**
   * Create coupon (Admin only)
   */
  async createCoupon(data: CreateCouponDto): Promise<ApiResponse<CouponDto>> {
    return apiFetch<CouponDto>("/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update coupon (Admin only)
   */
  async updateCoupon(id: number, data: UpdateCouponDto): Promise<ApiResponse<CouponDto>> {
    return apiFetch<CouponDto>(`/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete coupon (Admin only)
   */
  async deleteCoupon(id: number): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/coupons/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Validate coupon (Allow anonymous)
   */
  async validateCoupon(code: string): Promise<ApiResponse<CouponDto>> {
    return apiFetch<CouponDto>(`/coupons/validate/${code}`);
  },
};
