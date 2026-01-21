import { apiFetch, type ApiResponse } from "./client";

// AI Chat Request/Response DTOs
export interface AIChatRequestDto {
  userId: number;
  message: string;
  sessionId?: number;
}

export interface AIChatResponseDto {
  success: boolean;
  data?: {
    response: string;
    tokensSpent: number;
    responseTimeMs: number;
    newBalance: number;
    sessionId: number;
    warning?: string;
  };
  message?: string;
}

export interface AIChatLogDto {
  chatLogId: number;
  userId: number;
  userMessage: string;
  aiResponse: string;
  tokensUsed: number;
  responseTimeMs: number;
  sessionId: number;
  createdAt: string;
}

export interface AIChatSessionDto {
  sessionId: number;
  userId: number;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

// ML Workout Generation Types
export interface MLUserProfile {
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  goal: "muscle_gain" | "weight_loss" | "strength" | "endurance" | "general";
  daysPerWeek: number;
  injuries: string[];
  allergies?: string[];
  preferredEquipment?: string[];
}

export interface MLWorkoutGenerationRequest {
  userId: number;
  profile: MLUserProfile;
  planDurationWeeks: number;
}

export interface MLExercise {
  id?: string;
  name: string;
  muscleGroup?: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string[]; // Array of instruction steps from ML service
}

export interface MLWorkoutDay {
  day: number;
  name: string;
  focus: string;
  exercises: MLExercise[];
}

export interface MLWorkoutWeek {
  week: number;
  theme: string;
  days: MLWorkoutDay[];
  notes: string;
}

export interface MLWorkoutPlan {
  userId: number;
  createdAt: string;
  durationWeeks: number;
  daysPerWeek: number;
  goal: string;
  fitnessLevel: string;
  splitType: string;
  weeks: MLWorkoutWeek[];
  notes: string[];
}

export interface MLSafetySummary {
  injuries: string[];
  normalizedInjuries: string[];
  totalUnsafeExercises: number;
  totalUnsafeFoods: number;
  sampleUnsafeExercises: string[];
}

export interface MLWorkoutGenerationResponse {
  success: boolean;
  message?: string;
  data?: {
    planId?: number;  // ID of the saved plan in database
    plan: MLWorkoutPlan;
    exercisesAvailable: number;
    safetySummary: MLSafetySummary;
    tokensSpent: number;
    newBalance: number;
  };
}

export interface MLHealthResponse {
  success: boolean;
  status: "healthy" | "unhealthy" | "unavailable";
  mlService?: Record<string, unknown>;
  message?: string;
}

export const aiApi = {
  /**
   * Send a message to the AI Coach (Gemini)
   * Cost: 1 token per message
   */
  async sendMessage(
    userId: number,
    message: string,
    sessionId?: number
  ): Promise<AIChatResponseDto> {
    const response = await apiFetch<AIChatResponseDto["data"]>(
      "/ai/gemini-chat",
      {
        method: "POST",
        body: JSON.stringify({
          userId,
          message,
          sessionId, // Pass as number
        }),
      }
    );

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    return {
      success: false,
      message: response.message || "Failed to send message",
    };
  },

  /**
   * Get chat history for a user
   */
  async getChatHistory(
    userId: number,
    limit: number = 50
  ): Promise<ApiResponse<AIChatLogDto[]>> {
    return apiFetch<AIChatLogDto[]>(`/ai/history/${userId}?limit=${limit}`);
  },

  /**
   * Get all chat sessions for a user
   */
  async getChatSessions(
    userId: number
  ): Promise<ApiResponse<{ sessions: AIChatSessionDto[] }>> {
    return apiFetch<{ sessions: AIChatSessionDto[] }>(`/ai/sessions/${userId}`);
  },

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(
    userId: number,
    sessionId: number
  ): Promise<ApiResponse<{ messages: AIChatLogDto[] }>> {
    return apiFetch<{ messages: AIChatLogDto[] }>(
      `/ai/sessions/${userId}/${sessionId}`
    );
  },

  /**
   * Generate ML-powered workout plan
   * Cost: 30 tokens
   * Uses 7,959 real exercises from CSV dataset with safety filtering
   */
  async generateMLWorkout(
    request: MLWorkoutGenerationRequest
  ): Promise<MLWorkoutGenerationResponse> {
    const response = await apiFetch<MLWorkoutGenerationResponse["data"]>(
      "/ai/ml-workout",
      {
        method: "POST",
        body: JSON.stringify({
          userId: request.userId,
          profile: {
            fitnessLevel: request.profile.fitnessLevel,
            goal: request.profile.goal,
            daysPerWeek: request.profile.daysPerWeek,
            injuries: request.profile.injuries || [],
            allergies: request.profile.allergies || [],
            preferredEquipment: request.profile.preferredEquipment || [],
          },
          planDurationWeeks: request.planDurationWeeks,
        }),
      }
    );

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    return {
      success: false,
      message: response.message || "Failed to generate workout plan",
    };
  },

  /**
   * Check ML service health status
   */
  async checkMLHealth(): Promise<MLHealthResponse> {
    const response = await apiFetch<MLHealthResponse>("/ai/ml-health");
    // The backend returns { success: true, status: "healthy", mlService: {...} } directly
    // apiFetch returns it as-is since it contains 'success' field
    if (response.success && (response as unknown as MLHealthResponse).status) {
      return response as unknown as MLHealthResponse;
    }
    // If wrapped in data field (for consistency with other endpoints)
    if (response.success && response.data) {
      return response.data;
    }
    return { success: false, status: "unavailable", message: response.message };
  },
};
