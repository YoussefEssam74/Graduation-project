import apiClient from './client';
import type {
  User,
  UserRole,
  Exercise,
  Equipment,
  Booking,
  Meal,
  WorkoutPlanTemplate,
  MemberWorkoutPlan,
  NutritionPlan,
  InBodyMeasurement,
  SubscriptionPlan,
  MemberStats,
  CoachStats,
  ReceptionStats,
  ApiResponse,
} from '@/types';

// Auth APIs
export const authApi = {
  login: async (email: string, password: string, role: UserRole) => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', {
      email,
      password,
      role,
    });
    return response.data;
  },

  register: async (userData: Partial<User>) => {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

// User APIs
export const userApi = {
  getProfile: async (userId: number) => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (userId: number, userData: Partial<User>) => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${userId}`, userData);
    return response.data;
  },
};

// Exercise APIs
export const exerciseApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Exercise[]>>('/exercises');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Exercise>>(`/exercises/${id}`);
    return response.data;
  },

  create: async (exerciseData: Partial<Exercise>) => {
    const response = await apiClient.post<ApiResponse<Exercise>>('/exercises', exerciseData);
    return response.data;
  },

  update: async (id: number, exerciseData: Partial<Exercise>) => {
    const response = await apiClient.put<ApiResponse<Exercise>>(`/exercises/${id}`, exerciseData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/exercises/${id}`);
    return response.data;
  },
};

// Equipment APIs
export const equipmentApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Equipment[]>>('/equipment');
    return response.data;
  },

  getAvailable: async () => {
    const response = await apiClient.get<ApiResponse<Equipment[]>>('/equipment/available');
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await apiClient.put<ApiResponse<Equipment>>(`/equipment/${id}/status`, { status });
    return response.data;
  },
};

// Booking APIs
export const bookingApi = {
  getMyBookings: async (userId: number) => {
    const response = await apiClient.get<ApiResponse<Booking[]>>(`/bookings/user/${userId}`);
    return response.data;
  },

  create: async (bookingData: Partial<Booking>) => {
    const response = await apiClient.post<ApiResponse<Booking>>('/bookings', bookingData);
    return response.data;
  },

  cancel: async (bookingId: number) => {
    const response = await apiClient.put<ApiResponse<Booking>>(`/bookings/${bookingId}/cancel`);
    return response.data;
  },
};

// Meal APIs
export const mealApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Meal[]>>('/meals');
    return response.data;
  },

  create: async (mealData: Partial<Meal>) => {
    const response = await apiClient.post<ApiResponse<Meal>>('/meals', mealData);
    return response.data;
  },
};

// Workout Plan APIs
export const workoutPlanApi = {
  getTemplates: async () => {
    const response = await apiClient.get<ApiResponse<WorkoutPlanTemplate[]>>('/workout-plans/templates');
    return response.data;
  },

  getMyPlans: async (userId: number) => {
    const response = await apiClient.get<ApiResponse<MemberWorkoutPlan[]>>(`/workout-plans/user/${userId}`);
    return response.data;
  },

  getPlanDetails: async (planId: number) => {
    const response = await apiClient.get<ApiResponse<MemberWorkoutPlan>>(`/workout-plans/${planId}`);
    return response.data;
  },

  assignPlan: async (planData: Partial<MemberWorkoutPlan>) => {
    const response = await apiClient.post<ApiResponse<MemberWorkoutPlan>>('/workout-plans/assign', planData);
    return response.data;
  },

  updateProgress: async (planId: number, completedWorkouts: number) => {
    const response = await apiClient.put<ApiResponse<MemberWorkoutPlan>>(`/workout-plans/${planId}/progress`, {
      completedWorkouts,
    });
    return response.data;
  },

  completePlan: async (planId: number) => {
    const response = await apiClient.put<ApiResponse<MemberWorkoutPlan>>(`/workout-plans/${planId}/complete`);
    return response.data;
  },
};

// InBody Measurement APIs
export const inBodyApi = {
  getMyMeasurements: async (userId: number) => {
    const response = await apiClient.get<ApiResponse<InBodyMeasurement[]>>(`/inbody/user/${userId}`);
    return response.data;
  },

  create: async (measurementData: Partial<InBodyMeasurement>) => {
    const response = await apiClient.post<ApiResponse<InBodyMeasurement>>('/inbody', measurementData);
    return response.data;
  },
};

// Subscription APIs
export const subscriptionApi = {
  getPlans: async () => {
    const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans');
    return response.data;
  },
};

// Dashboard Stats APIs
export const statsApi = {
  getMemberStats: async (userId: number) => {
    const response = await apiClient.get<ApiResponse<MemberStats>>(`/stats/member/${userId}`);
    return response.data;
  },

  getCoachStats: async (coachId: number) => {
    const response = await apiClient.get<ApiResponse<CoachStats>>(`/stats/coach/${coachId}`);
    return response.data;
  },

  getReceptionStats: async () => {
    const response = await apiClient.get<ApiResponse<ReceptionStats>>('/stats/reception');
    return response.data;
  },
};

// Nutrition Plan APIs
export const nutritionPlanApi = {
  getMyPlans: async (userId: number) => {
    const response = await apiClient.get<ApiResponse<NutritionPlan[]>>(`/nutrition-plans/user/${userId}`);
    return response.data;
  },

  getPlanDetails: async (planId: number) => {
    const response = await apiClient.get<ApiResponse<NutritionPlan>>(`/nutrition-plans/${planId}`);
    return response.data;
  },

  generateAIPlan: async (userId: number, preferences: any) => {
    const response = await apiClient.post<ApiResponse<NutritionPlan>>('/nutrition-plans/generate', {
      userId,
      ...preferences,
    });
    return response.data;
  },

  updatePlan: async (planId: number, updates: Partial<NutritionPlan>) => {
    const response = await apiClient.put<ApiResponse<NutritionPlan>>(`/nutrition-plans/${planId}`, updates);
    return response.data;
  },

  deactivatePlan: async (planId: number) => {
    const response = await apiClient.put<ApiResponse<NutritionPlan>>(`/nutrition-plans/${planId}/deactivate`);
    return response.data;
  },
};

// AI Chat APIs
export const aiChatApi = {
  sendMessage: async (message: string, userId: number) => {
    const response = await apiClient.post<ApiResponse<{ response: string }>>('/ai/chat', {
      userId,
      query: message,
      contentTypes: ['Exercise', 'Meal', 'WorkoutPlan'],
    });
    return response.data;
  },

  getChatHistory: async (userId: number, limit: number = 50) => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/ai/history/${userId}?limit=${limit}`);
    return response.data;
  },
};
