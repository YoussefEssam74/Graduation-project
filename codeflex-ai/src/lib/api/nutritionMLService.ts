/**
 * Nutrition ML Service
 * ─────────────────────────────────────────────────────────────
 * Flow:  Frontend → C# Backend (localhost:5025)
 *              → NutritionAIServiceClient (SSE queue)
 *              → HF Space (https://youssefeemad-nutrition-generator.hf.space)
 *              → Qwen2.5-3B model
 *
 * The frontend NEVER calls HF directly. All AI calls go through
 * the C# backend so JWT auth, logging, and error handling are centralised.
 */

import { apiFetch } from "./client";

// ============================================================
// Types — must match the HF Space output schema
// ============================================================

export interface NutritionMLFoodItem {
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface NutritionMLMeal {
  items: NutritionMLFoodItem[];
  total_calories: number;
}

export interface NutritionMLPlanDay {
  day: number;
  total_calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  meals: {
    breakfast: NutritionMLMeal;
    lunch: NutritionMLMeal;
    dinner: NutritionMLMeal;
    snack: NutritionMLMeal;
  };
}

export interface NutritionMLResponse {
  foods_to_avoid: string[];
  days: NutritionMLPlanDay[];
  _daily_calories: number;
}

export interface NutritionMLRequest {
  member_id: string;
  gender: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  goal: string;
  activity_level: string;
  cuisine_preference: string;
  health_conditions: string[];
  allergies: string[];
  dietary_preferences: string[];
  inbody?: {
    body_fat_percentage: number;
    muscle_mass_kg: number;
    bmr_kcal: number;
    visceral_fat_level: number;
  };
}

export interface NutritionPreferences {
  goal: string;
  activityLevel: string;
  healthConditions: string[];
  allergies: string[];
  dietaryPreferences: string[];
  savedAt: string;
}

export interface StoredNutritionData {
  plan: NutritionMLResponse;
  preferences: NutritionPreferences;
  generatedAt: string;
  dailyCalories: number;
}

// ============================================================
// Nutrition ML Service
// ============================================================

export class NutritionMLService {
  private static readonly PREFS_KEY = (id: number | string) =>
    `nutrition_prefs_${id}`;
  private static readonly PLAN_KEY = (id: number | string) =>
    `nutrition_plan_${id}`;

  /** Goal display label → ML API value */
  static readonly GOAL_MAP: Record<string, string> = {
    "Weight Loss":        "weight_loss",
    "Muscle Gain":        "muscle_gain",
    Maintain:             "maintenance",
    "Body Recomposition": "body_recomposition",
  };

  /** Activity display label → ML API value */
  static readonly ACTIVITY_MAP: Record<string, string> = {
    Sedentary:          "sedentary",
    "Lightly Active":   "light",
    "Moderately Active":"moderate",
    "Very Active":      "active",
    "Extremely Active": "very_active",
  };

  /**
   * Generate a nutrition plan via the C# backend → HF Space pipeline.
   *
   * The C# NutritionAIController calls the HF Space using the Gradio queue
   * SSE protocol and returns a flat response:
   *   { success, daily_calories, days:[...], foods_to_avoid:[...] }
   */
  static async generatePlan(
    request: NutritionMLRequest,
    onProgress?: (status: string) => void,
  ): Promise<NutritionMLResponse> {
    if (onProgress) onProgress("Connecting to HF Space AI model...");

    // Use apiFetch — handles JWT auth header and response unwrapping automatically
    // POST http://localhost:5025/api/nutrition-ai/generate
    // → C# backend → https://youssefeemad-nutrition-generator.hf.space/queue/join
    const res = await apiFetch<{
      success: boolean;
      daily_calories: number;
      days: NutritionMLPlanDay[];
      foods_to_avoid: string[];
      generation_ms: number;
      generated_at: string;
    }>("/nutrition-ai/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });

    if (!res.success || !res.data) {
      throw new Error(
        res.message ||
          "Nutrition AI failed — the HF Space may still be loading. Please try again in 1 minute.",
      );
    }

    if (onProgress) onProgress("Processing AI meal plan...");

    const payload = res.data;

    // apiFetch unwraps { success, data } — but our controller returns the data
    // at the top level without a nested 'data' field, so apiFetch puts the whole
    // object into res.data (because "success" is present but no inner "data" key)
    const result: NutritionMLResponse = {
      days: payload.days ?? [],
      foods_to_avoid: payload.foods_to_avoid ?? [],
      _daily_calories: payload.daily_calories ?? 0,
    };

    if (!result.days || result.days.length === 0) {
      throw new Error(
        "AI returned an empty meal plan. The model may still be loading — please try again.",
      );
    }

    return result;
  }

  // ── LocalStorage helpers ────────────────────────────────────────────────────

  static savePreferences(userId: number | string, prefs: NutritionPreferences): void {
    try { localStorage.setItem(this.PREFS_KEY(userId), JSON.stringify(prefs)); } catch {}
  }

  static getPreferences(userId: number | string): NutritionPreferences | null {
    try {
      const raw = localStorage.getItem(this.PREFS_KEY(userId));
      return raw ? (JSON.parse(raw) as NutritionPreferences) : null;
    } catch { return null; }
  }

  static savePlanLocally(
    userId: number | string,
    plan: NutritionMLResponse,
    preferences: NutritionPreferences,
    dailyCalories: number,
  ): void {
    try {
      const data: StoredNutritionData = {
        plan,
        preferences,
        generatedAt: new Date().toISOString(),
        dailyCalories,
      };
      localStorage.setItem(this.PLAN_KEY(userId), JSON.stringify(data));
    } catch {}
  }

  static getStoredPlan(userId: number | string): StoredNutritionData | null {
    try {
      const raw = localStorage.getItem(this.PLAN_KEY(userId));
      if (!raw) return null;
      const data = JSON.parse(raw) as StoredNutritionData;
      // Normalise legacy shapes saved before this refactor
      const p = data.plan as any;
      if (!Array.isArray(p?.days) && p?.plan?.days) {
        data.plan = {
          days: p.plan.days ?? [],
          foods_to_avoid: p.plan.foods_to_avoid ?? [],
          _daily_calories: p.daily_calories ?? p._daily_calories ?? data.dailyCalories ?? 0,
        } as NutritionMLResponse;
      }
      return data;
    } catch { return null; }
  }

  static clearStoredPlan(userId: number | string): void {
    try { localStorage.removeItem(this.PLAN_KEY(userId)); } catch {}
  }

  /**
   * Build the NutritionMLRequest from user profile + InBody + wizard preferences.
   * This is what the C# backend / HF Space expects.
   */
  static buildRequest(
    user: { userId: number; gender?: number; dateOfBirth?: string },
    inbody: {
      weight: number;
      height: number;
      bodyFatPercentage?: number;
      muscleMass?: number;
      bmr?: number;
      visceralFat?: number;
    } | null,
    prefs: NutritionPreferences,
  ): NutritionMLRequest {
    let age = 30;
    if (user.dateOfBirth) {
      const birth = new Date(user.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    }

    const gender = user.gender === 1 ? "female" : "male";

    const request: NutritionMLRequest = {
      member_id:           String(user.userId),
      gender,
      age,
      weight_kg:           inbody?.weight ?? 70,
      height_cm:           inbody?.height ?? 170,
      goal:                this.GOAL_MAP[prefs.goal] ?? "maintenance",
      activity_level:      this.ACTIVITY_MAP[prefs.activityLevel] ?? "moderate",
      cuisine_preference:  "egyptian",
      health_conditions:   prefs.healthConditions.filter((c) => c !== "None"),
      allergies:           prefs.allergies.filter((a) => a !== "None"),
      dietary_preferences: prefs.dietaryPreferences,
    };

    if (inbody) {
      request.inbody = {
        body_fat_percentage: inbody.bodyFatPercentage ?? 20,
        muscle_mass_kg:    inbody.muscleMass ?? 30,
        bmr_kcal:          inbody.bmr ?? 1500,
        visceral_fat_level: inbody.visceralFat ?? 5,
      };
    }

    return request;
  }
}
