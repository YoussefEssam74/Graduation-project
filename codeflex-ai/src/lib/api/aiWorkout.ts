import { apiFetch, type ApiResponse } from './client';

// ============ Request DTOs ============

export interface AIWorkoutGenerationRequest {
    age: number;
    weightKg: number;
    heightCm: number;
    bodyFatPercentage?: number;
    experienceYears?: number;
    goal: string;
    daysPerWeek: number;
    injuries?: string[];
    equipmentAccess?: string;
    bodyImageBase64?: string;
    fitnessLevelOverride?: string;
}

export interface FitnessLevelPredictionRequest {
    age: number;
    weightKg: number;
    heightCm: number;
    bodyFatPercentage?: number;
    experienceYears?: number;
}

// ============ Response DTOs ============

export interface AIWorkoutGenerationResult {
    isSuccessful: boolean;
    errorMessage?: string;
    workoutPlanId?: number;
    fitnessPrediction?: FitnessPredictionDto;
    visionAnalysis?: VisionAnalysisDto;
    retrievedContext?: string[];
    generatedPlan?: GeneratedPlanDto;
    attemptCount: number;
    processingTimeMs: number;
    tokensSpent: number;
    warnings?: string[];
}

export interface FitnessPredictionDto {
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    confidence: number;
    allScores: Record<string, number>;
}

export interface VisionAnalysisDto {
    isReliable: boolean;
    overallConfidence: number;
    chestStatus?: string;
    armsStatus?: string;
    shouldersStatus?: string;
    bodyComposition?: string;
    weakMuscles: string[];
}

export interface GeneratedPlanDto {
    planName: string;
    durationWeeks: number;
    days: GeneratedDayDto[];
}

export interface GeneratedDayDto {
    dayNumber: number;
    focus: string;
    exercises: GeneratedExerciseDto[];
}

export interface GeneratedExerciseDto {
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
    notes?: string;
}

export interface PipelineHealthStatus {
    isHealthy: boolean;
    mlNetClassifier: ComponentHealth;
    visionServer: ComponentHealth;
    embeddingServer: ComponentHealth;
    llmServer: ComponentHealth;
    database: ComponentHealth;
    warnings?: string[];
}

export interface ComponentHealth {
    name: string;
    isHealthy: boolean;
    latencyMs: number;
    errorMessage?: string;
    lastChecked: string;
}

export interface FitnessLevelPredictionResult {
    level: string;
    confidence: number;
    allScores: Record<string, number>;
    success: boolean;
    errorMessage?: string;
}

// ============ API Functions ============

export const aiWorkoutApi = {
    /**
     * Generate a complete AI-powered workout plan
     * Cost: 50 tokens
     */
    async generateWorkoutPlan(
        request: AIWorkoutGenerationRequest
    ): Promise<ApiResponse<AIWorkoutGenerationResult>> {
        return apiFetch<AIWorkoutGenerationResult>('/aiworkout/generate', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    /**
     * Predict fitness level from user profile
     * Cost: 5 tokens
     */
    async predictFitnessLevel(
        request: FitnessLevelPredictionRequest
    ): Promise<ApiResponse<FitnessLevelPredictionResult>> {
        return apiFetch<FitnessLevelPredictionResult>('/aiworkout/predict-fitness-level', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    /**
     * Check health of all AI system components
     * Cost: 0 tokens
     */
    async checkHealth(): Promise<ApiResponse<PipelineHealthStatus>> {
        return apiFetch<PipelineHealthStatus>('/aiworkout/health');
    },
};
