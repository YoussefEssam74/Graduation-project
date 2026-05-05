"use client";

import { useState, useEffect, useCallback } from "react";
import { UserRole } from "@/types/gym";
import ProtectedRoute from "@/components/ProtectedRoute";
import SubscriptionGate from "@/components/SubscriptionGate";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Utensils,
  Flame,
  Apple,
  Moon,
  Sun,
  Loader2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Leaf,
  Check,
  AlertCircle,
  Activity,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { inbodyApi, type InBodyMeasurementDto } from "@/lib/api/inbody";
import { nutritionPlansApi } from "@/lib/api/nutritionPlans";
import {
  NutritionMLService,
  type NutritionPreferences,
  type StoredNutritionData,
} from "@/lib/api/nutritionMLService";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FITNESS_GOALS = [
  {
    value: "Weight Loss",
    label: "Weight Loss",
    icon: "\uD83D\uDD25",
    description: "Caloric deficit to shed body fat",
    color:
      "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  },
  {
    value: "Muscle Gain",
    label: "Muscle Gain",
    icon: "\uD83D\uDCAA",
    description: "Fuel hypertrophy with protein surplus",
    color:
      "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
  {
    value: "Maintain",
    label: "Maintain Weight",
    icon: "\u2696\uFE0F",
    description: "Stay balanced at your current weight",
    color:
      "border-green-400 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  },
  {
    value: "Body Recomposition",
    label: "Recomposition",
    icon: "\uD83D\uDD04",
    description: "Lose fat and gain muscle simultaneously",
    color:
      "border-purple-400 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  },
];

const ACTIVITY_LEVELS = [
  {
    value: "Sedentary",
    label: "Sedentary",
    emoji: "\uD83D\uDECB\uFE0F",
    description: "Little or no exercise",
  },
  {
    value: "Lightly Active",
    label: "Lightly Active",
    emoji: "\uD83D\uDEB6",
    description: "Light exercise 1\u20133\u00D7/week",
  },
  {
    value: "Moderately Active",
    label: "Moderately Active",
    emoji: "\uD83C\uDFC3",
    description: "Moderate exercise 3\u20135\u00D7/week",
  },
  {
    value: "Very Active",
    label: "Very Active",
    emoji: "\uD83C\uDFCB\uFE0F",
    description: "Hard exercise 6\u20137\u00D7/week",
  },
  {
    value: "Extremely Active",
    label: "Extremely Active",
    emoji: "\u26A1",
    description: "Very hard daily exercise + physical job",
  },
];

const HEALTH_CONDITIONS = [
  "None",
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "PCOS",
  "Thyroid Issues",
  "Kidney Disease",
  "Liver Disease",
];

const ALLERGIES_OPTIONS = [
  "None",
  "Nuts",
  "Gluten",
  "Dairy",
  "Shellfish",
  "Eggs",
  "Soy",
  "Seafood",
];

const DIETARY_PREFERENCES_OPTIONS = [
  { value: "Halal", label: "Halal", icon: "\u262A\uFE0F" },
  { value: "Vegetarian", label: "Vegetarian", icon: "\uD83E\uDD66" },
  { value: "Vegan", label: "Vegan", icon: "\uD83C\uDF31" },
  { value: "Kosher", label: "Kosher", icon: "\u2721\uFE0F" },
];

const GENERATING_STEPS = [
  "Analyzing your InBody data...",
  "Computing your calorie & macro targets...",
  "Selecting foods from Egyptian cuisine...",
  "Building Day 1 meal plan...",
  "Building Day 2 meal plan...",
  "Building Day 3 meal plan...",
  "Balancing portions & nutrients...",
  "Applying your health conditions & allergies...",
  "Validating nutritional completeness...",
  "Finalizing your nutrition plan...",
];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const getMealStyle = (mealType: string) => {
  switch (mealType) {
    case "breakfast":
      return {
        icon: Sun,
        iconColor: "text-orange-500",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        label: "Breakfast",
      };
    case "lunch":
      return {
        icon: Utensils,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        label: "Lunch",
      };
    case "dinner":
      return {
        icon: Moon,
        iconColor: "text-indigo-500",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        label: "Dinner",
      };
    case "snack":
      return {
        icon: Apple,
        iconColor: "text-green-500",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        label: "Snack",
      };
    default:
      return {
        icon: Utensils,
        iconColor: "text-slate-500",
        bgColor: "bg-slate-100 dark:bg-slate-700",
        label: mealType,
      };
  }
};

// â”€â”€â”€ Step Indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const labels = [
    "Goal & Activity",
    "Health Info",
    "Diet Preferences",
    "Review",
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <div key={stepNum} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}
              >
                {labels[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-14 mb-4 rounded transition-all ${isCompleted ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ Chip Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        selected
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400"
      }`}
    >
      {selected && <span className="mr-1">{"\u2713"}</span>}
      {label}
    </button>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ViewState =
  | "loading"
  | "no-inbody"
  | "no-plan"
  | "wizard"
  | "generating"
  | "plan";

function NutritionContent() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // View
  const [view, setView] = useState<ViewState>("loading");
  const [wizardStep, setWizardStep] = useState(1);

  // Data
  const [inbodyData, setInbodyData] = useState<InBodyMeasurementDto | null>(
    null,
  );
  const [mlPlan, setMlPlan] = useState<StoredNutritionData | null>(null);

  // Wizard selections
  const [goal, setGoal] = useState("");
  const [activityLevel, setActivityLevel] = useState("Moderately Active");
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(["Halal"]);

  // Generating progress
  const [generatingStep, setGeneratingStep] = useState(0);

  // Plan day tab
  const [selectedDay, setSelectedDay] = useState(1);

  // Save plan state
  const [planSavedToBackend, setPlanSavedToBackend] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  // â”€â”€ Load InBody + stored plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadData = useCallback(async () => {
    if (!user?.userId) {
      setView("no-inbody");
      return;
    }
    try {
      const inbodyRes = await inbodyApi.getLatestMeasurement(user.userId);
      if (!inbodyRes.success || !inbodyRes.data) {
        setView("no-inbody");
        return;
      }
      setInbodyData(inbodyRes.data);

      // Pre-fill wizard with saved preferences
      const savedPrefs = NutritionMLService.getPreferences(user.userId);
      if (savedPrefs) {
        setGoal(savedPrefs.goal);
        setActivityLevel(savedPrefs.activityLevel);
        setHealthConditions(savedPrefs.healthConditions);
        setUserAllergies(savedPrefs.allergies);
        setDietaryPrefs(savedPrefs.dietaryPreferences);
      }

      // Show stored plan if available
      const stored = NutritionMLService.getStoredPlan(user.userId);
      if (stored) {
        setMlPlan(stored);
        setView("plan");
        return;
      }

      setView("no-plan");
    } catch {
      showToast("Failed to load data", "error");
      setView("no-inbody");
    }
  }, [user?.userId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // â”€â”€ Chip toggle helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleChip = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    noneValue = "None",
  ) => {
    if (value === noneValue) {
      setList([noneValue]);
      return;
    }
    if (list.includes(value)) {
      setList(list.filter((x) => x !== value));
    } else {
      setList([...list.filter((x) => x !== noneValue), value]);
    }
  };

  const startWizard = () => {
    setWizardStep(1);
    setView("wizard");
  };

  // â”€â”€ Generate Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleGenerate = async () => {
    if (!user || !inbodyData) return;

    const prefs: NutritionPreferences = {
      goal,
      activityLevel,
      healthConditions,
      allergies: userAllergies,
      dietaryPreferences: dietaryPrefs,
      savedAt: new Date().toISOString(),
    };

    NutritionMLService.savePreferences(user.userId, prefs);

    setGeneratingStep(0);
    setView("generating");

    // Animate generating steps — 90s per step so all 10 steps span ~15 min
    let step = 0;
    const stepTimer = setInterval(() => {
      step = Math.min(step + 1, GENERATING_STEPS.length - 1);
      setGeneratingStep(step);
    }, 90_000);

    try {
      const mlReq = NutritionMLService.buildRequest(user, inbodyData, prefs);
      const result = await NutritionMLService.generatePlan(mlReq);

      clearInterval(stepTimer);
      setGeneratingStep(GENERATING_STEPS.length); // all done

      // Persist locally
      NutritionMLService.savePlanLocally(
        user.userId,
        result,
        prefs,
        result._daily_calories,
      );

      // Save metadata to .NET backend (fire-and-forget)
      nutritionPlansApi
        .generatePlan({
          memberId: user.userId,
          planName: `${goal} Plan \u2014 ${new Date().toLocaleDateString()}`,
          fitnessGoal: goal,
          dietaryRestrictions: [
            ...healthConditions,
            ...userAllergies,
            ...dietaryPrefs,
          ]
            .filter((x) => x !== "None")
            .join(", "),
          dailyCalories: Math.round(result._daily_calories),
          proteinGrams: Math.round(result.days[0]?.macros.protein_g ?? 0),
          carbsGrams: Math.round(result.days[0]?.macros.carbs_g ?? 0),
          fatGrams: Math.round(result.days[0]?.macros.fat_g ?? 0),
          startDate: new Date().toISOString().split("T")[0],
        })
        .catch(() => {});

      const stored: StoredNutritionData = {
        plan: result,
        preferences: prefs,
        generatedAt: new Date().toISOString(),
        dailyCalories: result._daily_calories,
      };
      setMlPlan(stored);
      setSelectedDay(1);
      setView("plan");
      showToast("Your nutrition plan is ready! \uD83C\uDF89", "success");
    } catch (error: unknown) {
      clearInterval(stepTimer);
      const message =
        error instanceof Error ? error.message : "Failed to generate plan";
      showToast(message, "error");
      setView("wizard");
      setWizardStep(4);
    }
  };

  // â”€â”€ Regenerate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRegenerate = () => {
    if (user?.userId) NutritionMLService.clearStoredPlan(user.userId);
    setMlPlan(null);
    setWizardStep(1);
    setView("wizard");
  };
  // â"€â"€ Save Plan to Backend â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleSavePlan = async () => {
    if (!user || !mlPlan) return;
    if (planSavedToBackend) {
      showToast("Plan already saved \u2705", "success");
      return;
    }
    setSavingPlan(true);
    try {
      const { plan, preferences } = mlPlan;
      const cal = mlPlan.dailyCalories || plan._daily_calories || 0;
      const result = await nutritionPlansApi.generatePlan({
        memberId: user.userId,
        planName: `${preferences.goal} Plan \u2014 ${new Date(mlPlan.generatedAt).toLocaleDateString()}`,
        fitnessGoal: preferences.goal,
        dietaryRestrictions: [
          ...preferences.healthConditions,
          ...preferences.allergies,
          ...preferences.dietaryPreferences,
        ]
          .filter((x) => x !== "None")
          .join(", "),
        dailyCalories: Math.round(cal),
        proteinGrams: Math.round(plan.days[0]?.macros.protein_g ?? 0),
        carbsGrams: Math.round(plan.days[0]?.macros.carbs_g ?? 0),
        fatGrams: Math.round(plan.days[0]?.macros.fat_g ?? 0),
        startDate: new Date().toISOString().split("T")[0],
      });
      if (!result.success) {
        throw new Error(
          result.message ||
            result.errors?.[0] ||
            "Backend rejected the request",
        );
      }
      setPlanSavedToBackend(true);
      showToast("Plan saved successfully \u2705", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save plan";
      showToast(`Save failed: ${msg}`, "error");
    } finally {
      setSavingPlan(false);
    }
  };

  // â"€â"€ Send to Coach for Review â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleSendToCoach = () => {
    showToast(
      "Redirecting to book a coach session for plan review \uD83D\uDCCB",
      "success",
    );
    setTimeout(() => {
      window.location.href = "/book-coach";
    }, 1200);
  };
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // VIEWS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // â”€â”€ No InBody Gate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === "no-inbody") {
    return (
      <div>
        <div className="max-w-lg mx-auto px-6 py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            InBody Scan Required
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-base">
            Your AI nutrition plan is personalized using your body composition
            data. Please complete an InBody scan with the receptionist first.
          </p>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl mb-8 text-left">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Why InBody?</strong> Your body fat %, muscle mass, BMR
                and visceral fat level are used by the AI to generate a truly
                personalized meal plan.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/inbody";
            }}
            size="lg"
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg px-8"
          >
            <Activity className="w-5 h-5" />
            Go to InBody
          </Button>
        </div>
      </div>
    );
  }

  // â”€â”€ No Plan â€” Landing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === "no-plan") {
    return (
      <div>
        <div className="max-w-2xl mx-auto px-6 py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
            No Nutrition Plan Yet
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
            Let our AI build a personalized Egyptian meal plan using your InBody
            data, goals, and dietary preferences.
          </p>
          {inbodyData && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                {
                  label: "Weight",
                  value: `${inbodyData.weight} kg`,
                  icon: "\u2696\uFE0F",
                },
                {
                  label: "Body Fat",
                  value: inbodyData.bodyFatPercentage
                    ? `${inbodyData.bodyFatPercentage}%`
                    : "N/A",
                  icon: "\uD83D\uDCCA",
                },
                {
                  label: "BMR",
                  value: inbodyData.bmr ? `${inbodyData.bmr} kcal` : "N/A",
                  icon: "\uD83D\uDD25",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center"
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {item.label}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={startWizard}
            size="lg"
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg px-8"
          >
            <Sparkles className="w-5 h-5" />
            Generate My Nutrition Plan
          </Button>
        </div>
      </div>
    );
  }

  // â”€â”€ Wizard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === "wizard") {
    return (
      <div>
        <div className="max-w-2xl mx-auto px-6 py-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                AI Nutrition Planner
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Personalized Egyptian meal plan in 4 steps
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(mlPlan ? "plan" : "no-plan")}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          <StepIndicator currentStep={wizardStep} totalSteps={4} />

          {/* â”€â”€ Step 1: Goal + Activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  What&apos;s your primary goal?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  This shapes your caloric strategy.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {FITNESS_GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                        goal === g.value
                          ? `${g.color} border-current ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-500`
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{g.icon}</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {g.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {g.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Activity Level
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  How active are you day-to-day?
                </p>
                <div className="space-y-1.5">
                  {ACTIVITY_LEVELS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setActivityLevel(a.value)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 text-left transition-all ${
                        activityLevel === a.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xl w-8 text-center">{a.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold text-sm ${activityLevel === a.value ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-white"}`}
                        >
                          {a.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {a.description}
                        </div>
                      </div>
                      {activityLevel === a.value && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setWizardStep(2)}
                disabled={goal === ""}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* â”€â”€ Step 2: Health Conditions + Allergies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Health Conditions{" "}
                  <span className="text-slate-400 font-normal text-sm">
                    (optional)
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  Select all that apply &mdash; the AI will adjust meals
                  accordingly.
                </p>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_CONDITIONS.map((c) => (
                    <ChipToggle
                      key={c}
                      label={c}
                      selected={healthConditions.includes(c)}
                      onClick={() =>
                        toggleChip(healthConditions, setHealthConditions, c)
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Food Allergies{" "}
                  <span className="text-slate-400 font-normal text-sm">
                    (optional)
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  The AI will exclude these ingredients from your plan.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALLERGIES_OPTIONS.map((a) => (
                    <ChipToggle
                      key={a}
                      label={a}
                      selected={userAllergies.includes(a)}
                      onClick={() =>
                        toggleChip(userAllergies, setUserAllergies, a)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep(1)}
                  className="gap-2 flex-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={() => setWizardStep(3)}
                  className="gap-2 flex-[2] bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* â”€â”€ Step 3: Dietary Preferences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Dietary Preferences{" "}
                  <span className="text-slate-400 font-normal text-sm">
                    (optional)
                  </span>
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  Select all that apply to your eating style.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {DIETARY_PREFERENCES_OPTIONS.map((d) => {
                    const selected = dietaryPrefs.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        onClick={() => {
                          if (selected) {
                            setDietaryPrefs(
                              dietaryPrefs.filter((x) => x !== d.value),
                            );
                          } else {
                            setDietaryPrefs([...dietaryPrefs, d.value]);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md flex items-center gap-3 ${
                          selected
                            ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-2xl">{d.icon}</span>
                        <div>
                          <div
                            className={`font-bold text-sm ${selected ? "text-green-700 dark:text-green-300" : "text-slate-800 dark:text-white"}`}
                          >
                            {d.label}
                          </div>
                          {selected && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              {"Selected \u2713"}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep(2)}
                  className="gap-2 flex-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={() => setWizardStep(4)}
                  className="gap-2 flex-[2] bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* â”€â”€ Step 4: Review + Generate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {wizardStep === 4 && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3 text-sm">
                  Plan Summary
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Goal
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {goal}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Activity
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {activityLevel}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Conditions
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {healthConditions.length === 0
                      ? "None"
                      : healthConditions.join(", ")}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Allergies
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {userAllergies.length === 0
                      ? "None"
                      : userAllergies.join(", ")}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Diet Prefs
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {dietaryPrefs.length === 0
                      ? "None"
                      : dietaryPrefs.join(", ")}
                  </span>
                </div>
              </div>

              {/* InBody Preview */}
              {inbodyData && (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    InBody Data Used
                  </h3>
                  <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                    {[
                      { label: "Weight", value: `${inbodyData.weight} kg` },
                      { label: "Height", value: `${inbodyData.height} cm` },
                      {
                        label: "Body Fat",
                        value: inbodyData.bodyFatPercentage
                          ? `${inbodyData.bodyFatPercentage}%`
                          : "N/A",
                      },
                      {
                        label: "Muscle Mass",
                        value: inbodyData.muscleMass
                          ? `${inbodyData.muscleMass} kg`
                          : "N/A",
                      },
                      {
                        label: "BMR",
                        value: inbodyData.bmr
                          ? `${inbodyData.bmr} kcal`
                          : "N/A",
                      },
                      {
                        label: "Visceral Fat",
                        value: inbodyData.visceralFat
                          ? `Level ${inbodyData.visceralFat}`
                          : "N/A",
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          {item.label}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep(3)}
                  className="gap-2 flex-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="gap-2 flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate My Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // â”€â”€ Generating â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === "generating") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Building Your Plan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Our AI is crafting a personalized 3-day Egyptian meal plan just for
            you.
          </p>

          <div className="space-y-3 text-left mb-8">
            {GENERATING_STEPS.map((step, i) => {
              const isDone = i < generatingStep;
              const isCurrent = i === generatingStep;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isDone
                      ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                      : isCurrent
                        ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                        : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 opacity-50"
                  }`}
                >
                  {isDone ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isDone
                        ? "text-green-700 dark:text-green-300"
                        : isCurrent
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400">
            This may take 10&ndash;15 minutes. Please don&apos;t close this
            page.
          </p>
        </div>
      </div>
    );
  }

  // â”€â”€ Plan View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (view === "plan" && mlPlan) {
    const { plan, preferences } = mlPlan;
    const dailyCalories = mlPlan.dailyCalories || plan._daily_calories || 1;
    const dayData =
      plan.days.find((d) => d.day === selectedDay) ?? plan.days[0];
    const macros = dayData?.macros;
    const macroStats = macros
      ? [
          {
            label: "Protein",
            grams: macros.protein_g,
            kcal: Math.round(macros.protein_g * 4),
            color: "bg-blue-500",
            textColor: "text-blue-600",
            pct:
              dailyCalories > 0
                ? Math.round(((macros.protein_g * 4) / dailyCalories) * 100)
                : 0,
          },
          {
            label: "Carbs",
            grams: macros.carbs_g,
            kcal: Math.round(macros.carbs_g * 4),
            color: "bg-orange-500",
            textColor: "text-orange-600",
            pct:
              dailyCalories > 0
                ? Math.round(((macros.carbs_g * 4) / dailyCalories) * 100)
                : 0,
          },
          {
            label: "Fat",
            grams: macros.fat_g,
            kcal: Math.round(macros.fat_g * 9),
            color: "bg-yellow-500",
            textColor: "text-yellow-600",
            pct:
              dailyCalories > 0
                ? Math.round(((macros.fat_g * 9) / dailyCalories) * 100)
                : 0,
          },
        ]
      : [];

    const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

    // Calorie ring — derived from per-day actual vs overall target
    const dayCalories = dayData?.total_calories ?? 0;
    const calorieTarget = dailyCalories > 0 ? dailyCalories : 1;
    const ringFillPct = Math.min(dayCalories / calorieTarget, 1);
    const circumference = 2 * Math.PI * 40;
    const ringOffset = circumference * (1 - ringFillPct);
    const isOverTarget = dayCalories > calorieTarget;

    return (
      <div>
        <div className="max-w-5xl mx-auto px-4 py-2 space-y-3">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {preferences.goal} â€” AI Nutrition Plan
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                  Active
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(mlPlan.generatedAt).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {preferences.activityLevel}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button
                size="sm"
                onClick={handleSavePlan}
                disabled={savingPlan || planSavedToBackend}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
              >
                {savingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {planSavedToBackend ? "Saved" : "Save Plan"}
              </Button>
              <Button
                size="sm"
                onClick={handleSendToCoach}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Sparkles className="w-4 h-4" />
                Coach Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startWizard}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Update
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Regenerate
              </Button>
            </div>
          </div>

          {/* Calorie ring + Macro bars */}
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-1 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="relative w-20 h-20 mb-2">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-100 dark:text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${ringOffset}`}
                    strokeLinecap="round"
                    className={`${isOverTarget ? "text-red-500" : "text-green-500"} transition-all duration-500`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Flame
                    className={`w-4 h-4 mb-0.5 ${isOverTarget ? "text-red-500" : "text-green-500"}`}
                  />
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                    {Math.round(ringFillPct * 100)}%
                  </span>
                </div>
              </div>
              <div
                className={`text-xl font-black ${isOverTarget ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}
              >
                {dayCalories.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                kcal today
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                of {calorieTarget.toLocaleString()} target
              </div>
            </div>

            <div className="md:col-span-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                Daily Macro Targets
              </h3>
              {macroStats.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {m.label}
                    </span>
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span className={`font-bold ${m.textColor}`}>
                        {m.grams}g
                      </span>
                      <span>{m.kcal} kcal</span>
                      <span className="font-semibold">{m.pct}%</span>
                    </div>
                  </div>
                  <Progress
                    value={m.pct}
                    className="h-1.5"
                    indicatorClassName={m.color}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Foods to Avoid */}
          {plan.foods_to_avoid && plan.foods_to_avoid.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
              <h3 className="font-bold text-red-800 dark:text-red-300 mb-2 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Foods to Avoid
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {plan.foods_to_avoid.map((food, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                  >
                    {"\uD83D\uDEAB"} {food}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Day tabs */}
          <div>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {plan.days.map((d) => (
                <button
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedDay === d.day
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
                  }`}
                >
                  Day {d.day}
                  <span className="ml-1 text-xs opacity-70">
                    {d.total_calories} kcal
                  </span>
                </button>
              ))}
            </div>

            {dayData && (
              <div className="grid sm:grid-cols-2 gap-2">
                {mealTypes.map((mealType) => {
                  const meal = dayData.meals[mealType];
                  if (!meal) return null;
                  const style = getMealStyle(mealType);
                  const Icon = style.icon;
                  return (
                    <div
                      key={mealType}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      {/* Meal header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg ${style.bgColor} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`w-4 h-4 ${style.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {style.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {meal.total_calories} kcal
                          </div>
                        </div>
                      </div>
                      {/* Food items */}
                      <div className="space-y-1">
                        {meal.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start gap-2 py-1 border-b border-slate-100 dark:border-slate-700 last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {item.grams}g
                              </div>
                            </div>
                            <div className="flex gap-1 flex-wrap justify-end">
                              <span className="text-xs px-1 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-medium">
                                {item.calories}
                              </span>
                              <span className="text-xs px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                                P{item.protein_g}g
                              </span>
                              <span className="text-xs px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded font-medium">
                                C{item.carbs_g}g
                              </span>
                              <span className="text-xs px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-medium">
                                F{item.fat_g}g
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function NutritionPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.Member, UserRole.Coach, UserRole.Admin]}
    >
      <SubscriptionGate>
        <NutritionContent />
      </SubscriptionGate>
    </ProtectedRoute>
  );
}
