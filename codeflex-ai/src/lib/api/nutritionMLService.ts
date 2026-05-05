/**
 * Nutrition ML Service — Frontend calls FastAPI directly for optimal performance.
 * RAG pattern: ML server uses InBody data + user profile to generate personalized meal plans.
 * Step 1: Frontend → FastAPI (port 5301) — generate plan
 * Step 2: Frontend → C# backend (port 5025) — save metadata (fire-and-forget)
 */

const ML_API_BASE_URL =
  process.env.NEXT_PUBLIC_ML_API_URL || "http://localhost:5301";

// ============================================================
// Request / Response Types
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
    body_fat_pct: number;
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
    "Weight Loss": "weight_loss",
    "Muscle Gain": "muscle_gain",
    Maintain: "maintenance",
    "Body Recomposition": "body_recomposition",
  };

  /** Activity display label → ML API value */
  static readonly ACTIVITY_MAP: Record<string, string> = {
    Sedentary: "sedentary",
    "Lightly Active": "light",
    "Moderately Active": "moderate",
    "Very Active": "active",
    "Extremely Active": "very_active",
  };

  /**
   * Generate nutrition plan via ML API (FastAPI on port 5301).
   * No timeout — LLM generation can take 10-15 minutes; let it finish.
   */
  static async generatePlan(
    request: NutritionMLRequest,
    onProgress?: (status: string) => void,
  ): Promise<NutritionMLResponse> {
    try {
      if (onProgress) onProgress("Connecting to AI model...");

      const response = await fetch(`${ML_API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`ML API error: ${response.status} — ${text}`);
      }

      if (onProgress) onProgress("Processing AI response...");

      // Server returns: { daily_calories, plan: { days, foods_to_avoid }, ... }
      // Normalize into the flat NutritionMLResponse shape the frontend expects.
      const raw = await response.json();
      const innerPlan = raw.plan ?? raw;
      const result: NutritionMLResponse = {
        days: innerPlan.days ?? [],
        foods_to_avoid: innerPlan.foods_to_avoid ?? [],
        _daily_calories: raw.daily_calories ?? raw._daily_calories ?? 0,
      };
      return result;
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to generate nutrition plan from ML service",
      );
    }
  }

  /** Persist user preferences to localStorage */
  static savePreferences(
    userId: number | string,
    prefs: NutritionPreferences,
  ): void {
    try {
      localStorage.setItem(this.PREFS_KEY(userId), JSON.stringify(prefs));
    } catch {}
  }

  /** Load saved preferences from localStorage */
  static getPreferences(userId: number | string): NutritionPreferences | null {
    try {
      const raw = localStorage.getItem(this.PREFS_KEY(userId));
      return raw ? (JSON.parse(raw) as NutritionPreferences) : null;
    } catch {
      return null;
    }
  }

  /** Persist full plan data to localStorage */
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

  /** Load stored plan from localStorage, normalizing legacy shapes. */
  static getStoredPlan(userId: number | string): StoredNutritionData | null {
    try {
      const raw = localStorage.getItem(this.PLAN_KEY(userId));
      if (!raw) return null;
      const data = JSON.parse(raw) as StoredNutritionData;
      // Legacy: server response was saved directly as `plan` before normalization fix.
      // Old shape: data.plan = { daily_calories, plan: { days, foods_to_avoid }, ... }
      const p = data.plan as any;
      if (!Array.isArray(p?.days) && p?.plan?.days) {
        data.plan = {
          days: p.plan.days ?? [],
          foods_to_avoid: p.plan.foods_to_avoid ?? [],
          _daily_calories:
            p.daily_calories ?? p._daily_calories ?? data.dailyCalories ?? 0,
        } as NutritionMLResponse;
      }
      return data;
    } catch {
      return null;
    }
  }

  /** Remove stored plan from localStorage */
  static clearStoredPlan(userId: number | string): void {
    try {
      localStorage.removeItem(this.PLAN_KEY(userId));
    } catch {}
  }

  /**
   * Assemble the ML request from user profile, InBody measurement, and wizard preferences.
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
    // Derive age from dateOfBirth
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
      member_id: String(user.userId),
      gender,
      age,
      weight_kg: inbody?.weight ?? 70,
      height_cm: inbody?.height ?? 170,
      goal: this.GOAL_MAP[prefs.goal] ?? "maintenance",
      activity_level: this.ACTIVITY_MAP[prefs.activityLevel] ?? "moderate",
      cuisine_preference: "egyptian",
      health_conditions: prefs.healthConditions.filter((c) => c !== "None"),
      allergies: prefs.allergies.filter((a) => a !== "None"),
      dietary_preferences: prefs.dietaryPreferences,
    };

    if (inbody) {
      request.inbody = {
        body_fat_pct: inbody.bodyFatPercentage ?? 20,
        muscle_mass_kg: inbody.muscleMass ?? 30,
        bmr_kcal: inbody.bmr ?? 1500,
        visceral_fat_level: inbody.visceralFat ?? 5,
      };
    }

    return request;
  }
}
