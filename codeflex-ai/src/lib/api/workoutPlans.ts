import { apiFetch, type ApiResponse } from './client';

// Matches backend: Shared.DTOs.WorkoutPlan.WorkoutPlanDto
export interface WorkoutPlanDto {
  planId: number;
  planName: string;
  description?: string;
  createdByCoachId?: number;
  coachName?: string;
  durationWeeks: number;
  difficultyLevel: number;
  goals?: string;
  isTemplate: boolean;
  isActive: boolean;
  createdAt: string;
}

// Matches backend: Shared.DTOs.WorkoutPlan.MemberWorkoutPlanDto
export interface MemberWorkoutPlanDto {
  memberPlanId: number;
  memberId: number;
  memberName: string;
  planId: number;
  planName: string;
  assignedByCoachId?: number;
  coachName?: string;
  startDate: string;
  endDate?: string;
  status: number;
  statusText: string;
  completedWorkouts?: number;
  totalWorkouts?: number;
  notes?: string;
  createdAt: string;
  // AI-Generated plan specific fields
  planType?: string;  // Custom, AI_Generated, Coach_Created
  goal?: string;  // muscle_gain, weight_loss, etc.
  splitType?: string;  // Full Body, Upper/Lower, PPL
  daysPerWeek?: number;
  durationWeeks?: number;
  difficultyLevel?: string;
  mlPlanJson?: string;  // Full ML response for display
  scheduledDays?: ScheduledDayDto[];
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
  async getAllTemplates(): Promise<ApiResponse<WorkoutPlanDto[]>> {
    return apiFetch<WorkoutPlanDto[]>('/workout-plans/templates');
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: number): Promise<ApiResponse<WorkoutPlanDto>> {
    return apiFetch<WorkoutPlanDto>(`/workout-plans/templates/${id}`);
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

  /**
   * Activate a workout plan (makes it the user's current active plan)
   */
  async activatePlan(planId: number, userId: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiFetch<{ success: boolean; message: string }>(`/workout-plans/${planId}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    });
  },

  /**
   * Schedule a workout plan with start date and preferred workout days/times
   */
  async scheduleWorkoutPlan(planId: number, scheduleData: ScheduleWorkoutPlanDto): Promise<ApiResponse<ScheduledWorkoutPlanResponse>> {
    return apiFetch<ScheduledWorkoutPlanResponse>(`/workout-plans/${planId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  },

  /**
   * Update exercise notes (Coach only)
   */
  async updateExerciseNotes(planId: number, data: UpdateExerciseNotesDto): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiFetch<{ success: boolean; message: string }>(`/workout-plans/${planId}/exercise-notes`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export interface UpdateExerciseNotesDto {
  planId: number;
  coachId: number;
  exerciseId: string;
  notes: string[];
}

// Schedule workout plan DTOs
export interface ScheduleWorkoutPlanDto {
  userId: number;
  planId: number;
  startDate: string;  // ISO date string
  preferredWorkoutTime: string;  // HH:mm:ss format
  workoutDays: number[];  // 0=Sunday, 1=Monday, etc.
  autoBookEquipment: boolean;
}

export interface ScheduledWorkoutPlanResponse {
  planId: number;
  planName: string;
  startDate: string;
  endDate: string;
  totalScheduledDays: number;
  equipmentBookingsCreated: number;
  scheduledDays: ScheduledDayDto[];
}

export interface ScheduledDayDto {
  scheduledDayId: number;
  scheduledDate: string;
  startTime: string;
  weekNumber: number;
  dayNumber: number;
  status: string;
  equipmentBookings: ScheduledEquipmentBookingDto[];
}

export interface ScheduledEquipmentBookingDto {
  bookingId: number;
  equipmentId: number;
  equipmentName: string;
  startTime: string;
  endTime: string;
  status: string;
}
