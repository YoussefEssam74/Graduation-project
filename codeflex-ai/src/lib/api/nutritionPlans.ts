import { apiFetch, type ApiResponse } from './client';

// Updated to match backend DTO structure
export interface PlanMealItem {
  mealId: number;
  name: string;
  mealType: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  dayNumber: number;
}

export interface NutritionPlanDto {
  planId: number;
  memberId: number;
  memberName: string;
  planName: string;
  description?: string;
  createdByCoachId?: number;
  coachName?: string;
  createdByAiAgentId?: number;
  startDate: string;
  endDate?: string;
  dailyCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  status: number;
  statusText: string;
  isActive: boolean;
  approvalNotes?: string;
  createdAt: string;
  dietaryRestrictions?: string[];
  aiPlanJson?: string;
  meals?: PlanMealItem[];
}

export interface GenerateNutritionPlanDto {
  memberId: number;
  planName: string;
  description?: string;
  createdByCoachId?: number;
  fitnessGoal?: string;
  dietaryRestrictions?: string;
  dailyCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  startDate?: string;
  endDate?: string;
  aiPlanJson?: string;
}

export const nutritionPlansApi = {
  /**
   * Get member's nutrition plans
   */
  async getMemberPlans(memberId: number): Promise<ApiResponse<NutritionPlanDto[]>> {
    return apiFetch<NutritionPlanDto[]>(`/nutrition-plans/member/${memberId}`);
  },

  /**
   * Get plan details
   */
  async getPlanDetails(planId: number): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>(`/nutrition-plans/${planId}`);
  },

  /**
   * Generate new plan
   */
  async generatePlan(data: GenerateNutritionPlanDto): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>('/nutrition-plans/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update plan
   */
  async updatePlan(planId: number, data: GenerateNutritionPlanDto): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>(`/nutrition-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deactivate plan
   */
  async deactivatePlan(planId: number): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>(`/nutrition-plans/${planId}/deactivate`, {
      method: 'PUT',
    });
  },

  /**
   * Get plans assigned to the authenticated coach for review
   */
  async getCoachReviewPlans(): Promise<ApiResponse<NutritionPlanDto[]>> {
    return apiFetch<NutritionPlanDto[]>('/nutrition-plans/coach-review', {
      method: 'GET',
    });
  },

  /**
   * Edit a nutrition plan (coach makes granular edits)
   */
  async coachEditPlan(
    planId: number,
    request: CoachEditNutritionPlanRequest
  ): Promise<ApiResponse<NutritionPlanDto>> {
    return apiFetch<NutritionPlanDto>(`/nutrition-plans/${planId}/coach-edit`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Update the status of a nutrition plan (coach approves/rejects)
   */
  async coachUpdateStatus(
    planId: number,
    status: 'Approved' | 'Rejected' | 'UnderReview',
    notes?: string
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    return apiFetch<{ success: boolean; message?: string }>(
      `/nutrition-plans/${planId}/coach-status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      }
    );
  },
};

export interface CoachEditNutritionPlanRequest {
  planName?: string;
  description?: string;
  dailyCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  dietaryRestrictions?: string[];
  coachNotes?: string;
  days: {
    dayNumber: number;
    meals: {
      mealId?: number;
      name: string;
      mealType: string;
      calories: number;
      proteinGrams: number;
      carbsGrams: number;
      fatGrams: number;
      description?: string;
    }[];
  }[];
}

