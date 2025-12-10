import { apiFetch, type ApiResponse } from './client';

export interface NutritionPlanDto {
  planId: number;
  memberId: number;
  memberName: string;
  createdByCoachId?: number;
  createdByCoachName?: string;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  mealsPerDay: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  notes?: string;
  meals: MealDto[];
}

export interface MealDto {
  mealId: number;
  mealName: string;
  mealTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: FoodItemDto[];
}

export interface FoodItemDto {
  foodId: number;
  foodName: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface GenerateNutritionPlanDto {
  memberId: number;
  createdByCoachId?: number;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  mealsPerDay: number;
  notes?: string;
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
};
