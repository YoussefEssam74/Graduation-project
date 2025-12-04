import { apiFetch, type ApiResponse } from './client';

export interface WorkoutTemplateDto {
  templateId: number;
  templateName: string;
  description?: string;
  difficultyLevel: number;
  durationWeeks: number;
  workoutsPerWeek: number;
  createdByCoachId: number;
  createdByCoachName?: string;
  isPublic: boolean;
  isActive: boolean;
}

export interface MemberWorkoutPlanDto {
  memberPlanId: number;
  memberId: number;
  memberName: string;
  planId: number;
  planName: string;
  assignedByCoachId?: number;
  assignedByCoachName?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  progressPercentage: number;
  currentWeek: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  notes?: string;
}

export interface WorkoutDayDto {
  dayNumber: number;
  dayName: string;
  exercises: WorkoutExerciseDto[];
}

export interface WorkoutExerciseDto {
  exerciseId: number;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  muscleGroup?: string;
}

export interface AssignWorkoutPlanDto {
  memberId: number;
  planId: number;
  assignedByCoachId?: number;
  startDate: string;
  notes?: string;
}

export interface UpdateProgressDto {
  workoutsCompleted: number;
  currentWeek: number;
  notes?: string;
}

export const workoutPlansApi = {
  /**
   * Get all workout templates
   */
  async getAllTemplates(): Promise<ApiResponse<WorkoutTemplateDto[]>> {
    return apiFetch<WorkoutTemplateDto[]>('/workout-plans/templates');
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: number): Promise<ApiResponse<WorkoutTemplateDto>> {
    return apiFetch<WorkoutTemplateDto>(`/workout-plans/templates/${id}`);
  },

  /**
   * Get member's workout plans
   */
  async getMemberPlans(memberId: number): Promise<ApiResponse<MemberWorkoutPlanDto[]>> {
    return apiFetch<MemberWorkoutPlanDto[]>(`/workout-plans/member/${memberId}`);
  },

  /**
   * Get member plan details
   */
  async getMemberPlanDetails(memberPlanId: number): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>(`/workout-plans/${memberPlanId}`);
  },

  /**
   * Assign plan to member
   */
  async assignPlanToMember(data: AssignWorkoutPlanDto): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>('/workout-plans/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update progress
   */
  async updateProgress(memberPlanId: number, data: UpdateProgressDto): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>(`/workout-plans/${memberPlanId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete plan
   */
  async completePlan(memberPlanId: number): Promise<ApiResponse<MemberWorkoutPlanDto>> {
    return apiFetch<MemberWorkoutPlanDto>(`/workout-plans/${memberPlanId}/complete`, {
      method: 'PUT',
    });
  },
};
