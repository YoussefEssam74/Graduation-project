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
    Info,
    Plus,
    Minus,
    CalendarDays,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { nutritionPlansApi, mealsApi, type NutritionPlanDto, type MealDto } from "@/lib/api";
import { NutritionMLService, type NutritionMLResponse } from "@/lib/api/nutritionMLService";

// ─── Constants ───────────────────────────────────────────────────────────────

const FITNESS_GOALS = [
    { value: "Weight Loss", label: "Weight Loss", icon: "🔥", description: "Caloric deficit to shed body fat", color: "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
    { value: "Muscle Gain", label: "Muscle Gain", icon: "💪", description: "Fuel hypertrophy with protein surplus", color: "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" },
    { value: "Maintain", label: "Maintain Weight", icon: "⚖️", description: "Stay balanced at your current weight", color: "border-green-400 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300" },
    { value: "Body Recomposition", label: "Recomposition", icon: "🔄", description: "Lose fat and gain muscle simultaneously", color: "border-purple-400 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" },
];

const ACTIVITY_LEVELS = [
    { value: "Sedentary", label: "Sedentary", emoji: "🛋️", description: "Little or no exercise", multiplier: 1.2 },
    { value: "Lightly Active", label: "Lightly Active", emoji: "🚶", description: "Light exercise 1–3×/week", multiplier: 1.375 },
    { value: "Moderately Active", label: "Moderately Active", emoji: "🏃", description: "Moderate exercise 3–5×/week", multiplier: 1.55 },
    { value: "Very Active", label: "Very Active", emoji: "🏋️", description: "Hard exercise 6–7×/week", multiplier: 1.725 },
    { value: "Extremely Active", label: "Extremely Active", emoji: "⚡", description: "Very hard daily exercise + physical job", multiplier: 1.9 },
];

const DIET_TYPES = [
    { value: "Omnivore", label: "Omnivore", icon: "🍖", description: "Eats all foods" },
    { value: "Vegetarian", label: "Vegetarian", icon: "🥦", description: "No meat or fish" },
    { value: "Vegan", label: "Vegan", icon: "🌱", description: "No animal products" },
    { value: "Keto", label: "Keto", icon: "🥑", description: "Very low carb, high fat" },
    { value: "Paleo", label: "Paleo", icon: "🥩", description: "Whole foods, no grains" },
    { value: "Mediterranean", label: "Mediterranean", icon: "🫒", description: "Olive oil, fish, veggies" },
];

const DIETARY_RESTRICTIONS = [
    "Gluten-Free", "Dairy-Free", "Nut-Free", "Shellfish-Free",
    "Egg-Free", "Soy-Free", "Low-Sodium", "Halal", "Kosher",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calculateCalorieTarget = (goal: string, activityLevel: string): number => {
    const baseTDEE = 2000;
    const multiplier = ACTIVITY_LEVELS.find(a => a.value === activityLevel)?.multiplier ?? 1.55;
    const tdee = Math.round(baseTDEE * multiplier);
    switch (goal) {
        case "Weight Loss": return Math.max(1200, tdee - 500);
        case "Muscle Gain": return tdee + 300;
        case "Body Recomposition": return Math.max(1400, tdee - 200);
        default: return tdee;
    }
};

const calculateMacros = (goal: string, calories: number) => {
    let pPct: number, cPct: number, fPct: number;
    switch (goal) {
        case "Muscle Gain":      pPct = 0.30; cPct = 0.45; fPct = 0.25; break;
        case "Weight Loss":     pPct = 0.35; cPct = 0.35; fPct = 0.30; break;
        case "Body Recomposition": pPct = 0.35; cPct = 0.35; fPct = 0.30; break;
        default:                pPct = 0.25; cPct = 0.50; fPct = 0.25;
    }
    return {
        protein: Math.round((calories * pPct) / 4),
        carbs:   Math.round((calories * cPct) / 4),
        fat:     Math.round((calories * fPct) / 9),
    };
};

const getMealTypeStyle = (mealType?: string) => {
    switch (mealType?.toLowerCase()) {
        case "breakfast": return { icon: Sun,     iconColor: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" };
        case "lunch":     return { icon: Sun,     iconColor: "text-blue-500",   bgColor: "bg-blue-100 dark:bg-blue-900/30" };
        case "dinner":    return { icon: Moon,    iconColor: "text-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" };
        case "snack":     return { icon: Apple,   iconColor: "text-green-500",  bgColor: "bg-green-100 dark:bg-green-900/30" };
        default:          return { icon: Utensils, iconColor: "text-slate-500", bgColor: "bg-slate-100 dark:bg-slate-700" };
    }
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    const labels = ["Goal & Activity", "Diet Preferences", "Calories & Macros"];
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => {
                const stepNum = i + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                return (
                    <div key={stepNum} className="flex items-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                isCompleted ? "bg-green-500 text-white" :
                                isCurrent  ? "bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800" :
                                             "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                            }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
                                {labels[i]}
                            </span>
                        </div>
                        {i < totalSteps - 1 && (
                            <div className={`h-0.5 w-12 sm:w-20 mb-4 rounded transition-all ${isCompleted ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ViewState = "loading" | "no-plan" | "wizard" | "plan";

function NutritionContent() {
    const { user } = useAuth();
    const { showToast } = useToast();

    // View
    const [view, setView] = useState<ViewState>("loading");
    const [wizardStep, setWizardStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    // Data
    const [activePlan, setActivePlan] = useState<NutritionPlanDto | null>(null);
    const [meals, setMeals] = useState<MealDto[]>([]);
    const [aiPlan, setAiPlan] = useState<NutritionMLResponse | null>(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [generatingStatus, setGeneratingStatus] = useState("Generating your plan...");

    // Wizard form
    const [goal, setGoal] = useState("");
    const [activityLevel, setActivityLevel] = useState("Moderately Active");
    const [dietType, setDietType] = useState("Omnivore");
    const [restrictions, setRestrictions] = useState<string[]>([]);
    const [calorieTarget, setCalorieTarget] = useState(2000);
    const [manualCalories, setManualCalories] = useState(false);
    const [proteinGrams, setProteinGrams] = useState(150);
    const [carbsGrams, setCarbsGrams] = useState(250);
    const [fatGrams, setFatGrams] = useState(55);
    const [manualMacros, setManualMacros] = useState(false);
    const [planName, setPlanName] = useState("");

    // ── Fetch Data ────────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!user?.userId) { setView("no-plan"); return; }
        try {
            const [plansRes, mealsRes] = await Promise.all([
                nutritionPlansApi.getMemberPlans(user.userId),
                mealsApi.getActiveMeals(),
            ]);
            if (plansRes.success && plansRes.data && plansRes.data.length > 0) {
                const active = plansRes.data.find(p => p.isActive) ?? plansRes.data[0];
                setActivePlan(active);
                // Restore AI-generated plan from localStorage
                const stored = NutritionMLService.getStoredPlan(user.userId);
                if (stored) setAiPlan(stored.plan);
                setView("plan");
            } else {
                setView("no-plan");
            }
            if (mealsRes.success && mealsRes.data) {
                setMeals(mealsRes.data);
            }
        } catch {
            showToast("Failed to load nutrition data", "error");
            setView("no-plan");
        }
    }, [user?.userId, showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Auto-calculate calories when goal/activity changes ────────────────────
    useEffect(() => {
        if (!manualCalories && goal) {
            const cals = calculateCalorieTarget(goal, activityLevel);
            setCalorieTarget(cals);
            if (!manualMacros) {
                const m = calculateMacros(goal, cals);
                setProteinGrams(m.protein);
                setCarbsGrams(m.carbs);
                setFatGrams(m.fat);
            }
        }
    }, [goal, activityLevel, manualCalories, manualMacros]);

    useEffect(() => {
        if (!manualMacros && goal) {
            const m = calculateMacros(goal, calorieTarget);
            setProteinGrams(m.protein);
            setCarbsGrams(m.carbs);
            setFatGrams(m.fat);
        }
    }, [calorieTarget, goal, manualMacros]);

    // ── Wizard Validation ─────────────────────────────────────────────────────
    const canProceedStep1 = goal !== "" && activityLevel !== "";
    const canProceedStep2 = dietType !== "";
    const canGenerate = planName.trim().length > 0 && goal !== "";

    // ── Generate Plan ─────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!user?.userId || !canGenerate) return;
        setIsGenerating(true);
        setGeneratingStatus("Connecting to AI model...");
        try {
            const restrictionsStr = restrictions.length > 0 ? restrictions.join(", ") : undefined;
            const descriptionParts = [
                `Diet type: ${dietType}`,
                `Activity level: ${activityLevel}`,
                restrictionsStr ? `Restrictions: ${restrictionsStr}` : null,
            ].filter(Boolean);

            // ── Step 1: Call AI model to generate the meal plan ───────────────
            let generatedAiPlan: NutritionMLResponse | null = null;
            let aiError: string | null = null;
            let effectiveCalories = calorieTarget;

            const mlPrefs = {
                goal,
                activityLevel,
                healthConditions: [] as string[],
                allergies: restrictions
                    .filter(r => r.endsWith("-Free"))
                    .map(r => r.replace("-Free", "").toLowerCase()),
                dietaryPreferences: dietType !== "Omnivore" ? [dietType.toLowerCase()] : [],
                savedAt: new Date().toISOString(),
            };

            const mlRequest = NutritionMLService.buildRequest(
                { userId: user.userId },
                null,
                mlPrefs,
            );

            setGeneratingStatus("Waking up AI model — this may take 1–2 minutes on first use...");
            try {
                generatedAiPlan = await NutritionMLService.generatePlan(mlRequest, (status) => {
                    setGeneratingStatus(status);
                });
                // Use the AI-computed calorie target if available
                if (generatedAiPlan._daily_calories && generatedAiPlan._daily_calories > 0) {
                    effectiveCalories = generatedAiPlan._daily_calories;
                }
                NutritionMLService.savePlanLocally(user.userId, generatedAiPlan, mlPrefs, effectiveCalories);
            } catch (err: any) {
                aiError = err?.message ?? "AI model unavailable";
                console.error("Nutrition AI error:", aiError);
                const isWarmup = aiError.toLowerCase().includes("warm") || aiError.toLowerCase().includes("timeout") || aiError.toLowerCase().includes("timed out");
                showToast(
                    isWarmup
                        ? "⏳ AI model is still warming up. Please wait 30 seconds and try again."
                        : `⚠️ ${aiError}`,
                    "error",
                    10000
                );
                // Don't save to DB if AI failed — user needs to retry
                return;
            }

            // ── Step 2: Save plan metadata to backend DB ──────────────────────
            setGeneratingStatus("Saving your plan...");
            const res = await nutritionPlansApi.generatePlan({
                memberId: user.userId,
                planName: planName.trim(),
                description: descriptionParts.join(". "),
                fitnessGoal: goal,
                dietaryRestrictions: restrictionsStr,
                dailyCalories: effectiveCalories,
                proteinGrams,
                carbsGrams,
                fatGrams,
                startDate: new Date().toISOString().split("T")[0],
            });

            if (res.success && res.data) {
                setActivePlan(res.data);
                // Display the AI-generated meal plan
                setAiPlan(generatedAiPlan);
                setSelectedDay(0);
                setView("plan");
                showToast("✅ Nutrition plan generated successfully!", "success");
                // Refresh global meal library
                const mealsRes = await mealsApi.getActiveMeals();
                if (mealsRes.success && mealsRes.data) setMeals(mealsRes.data);
            } else {
                showToast(res.message ?? "Failed to save plan to database", "error");
                // Still show the AI plan even if DB save fails
                setAiPlan(generatedAiPlan);
                setSelectedDay(0);
                setView("plan");
            }
        } catch (err: any) {
            console.error("handleGenerate error:", err);
            showToast(err?.message ?? "Failed to generate nutrition plan", "error");
        } finally {
            setIsGenerating(false);
            setGeneratingStatus("Generating your plan...");
        }
    };


    const startWizard = () => {
        setWizardStep(1);
        setGoal("");
        setActivityLevel("Moderately Active");
        setDietType("Omnivore");
        setRestrictions([]);
        setManualCalories(false);
        setManualMacros(false);
        setPlanName("");
        setView("wizard");
    };

    const toggleRestriction = (r: string) =>
        setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

    // ─── Loading ───────────────────────────────────────────────────────────────
    if (view === "loading") {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // ─── No Plan — Landing ─────────────────────────────────────────────────────
    if (view === "no-plan") {
        return (
            <div className="min-h-screen">
                <div className="max-w-2xl mx-auto px-6 py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Leaf className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">No Nutrition Plan Yet</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
                        Let our AI build a personalized nutrition plan tailored to your goals, dietary preferences, and activity level.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { icon: "🎯", label: "Goal-aligned macros" },
                            { icon: "🥗", label: "Diet-friendly meals" },
                            { icon: "⚡", label: "Activity-adjusted calories" },
                        ].map(item => (
                            <div key={item.label} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-2xl mb-2">{item.icon}</div>
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.label}</p>
                            </div>
                        ))}
                    </div>
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

    // ─── Wizard ────────────────────────────────────────────────────────────────
    if (view === "wizard") {
        return (
            <div className="min-h-screen">
                <div className="max-w-2xl mx-auto px-6 py-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">AI Nutrition Planner</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Personalized macros in 3 steps</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setView(activePlan ? "plan" : "no-plan")} className="gap-1.5">
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </div>

                    <StepIndicator currentStep={wizardStep} totalSteps={3} />

                    {/* ── Step 1: Goal + Activity ─────────────────────────────── */}
                    {wizardStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">What&apos;s your primary goal?</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">This determines your caloric strategy.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {FITNESS_GOALS.map(g => (
                                        <button
                                            key={g.value}
                                            onClick={() => setGoal(g.value)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                                                goal === g.value
                                                    ? `${g.color} border-current ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-500`
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                            }`}
                                        >
                                            <div className="text-2xl mb-2">{g.icon}</div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">{g.label}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{g.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Activity Level</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">How active are you day-to-day?</p>
                                <div className="space-y-2">
                                    {ACTIVITY_LEVELS.map(a => (
                                        <button
                                            key={a.value}
                                            onClick={() => setActivityLevel(a.value)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                                activityLevel === a.value
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                                            }`}
                                        >
                                            <span className="text-xl w-8 text-center">{a.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-semibold text-sm ${activityLevel === a.value ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-white"}`}>{a.label}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{a.description}</div>
                                            </div>
                                            {activityLevel === a.value && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={() => setWizardStep(2)}
                                disabled={!canProceedStep1}
                                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* ── Step 2: Diet + Restrictions ────────────────────────── */}
                    {wizardStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Diet Type</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose the style of eating that fits you best.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {DIET_TYPES.map(d => (
                                        <button
                                            key={d.value}
                                            onClick={() => setDietType(d.value)}
                                            className={`p-3 rounded-xl border-2 text-center transition-all hover:shadow-sm ${
                                                dietType === d.value
                                                    ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="text-2xl mb-1">{d.icon}</div>
                                            <div className={`text-xs font-bold ${dietType === d.value ? "text-green-700 dark:text-green-300" : "text-slate-700 dark:text-white"}`}>{d.label}</div>
                                            <div className="text-xs text-slate-400 mt-0.5 hidden sm:block">{d.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Dietary Restrictions <span className="text-slate-400 font-normal text-sm">(optional)</span></h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select all that apply.</p>
                                <div className="flex flex-wrap gap-2">
                                    {DIETARY_RESTRICTIONS.map(r => {
                                        const selected = restrictions.includes(r);
                                        return (
                                            <button
                                                key={r}
                                                onClick={() => toggleRestriction(r)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                                    selected
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400"
                                                }`}
                                            >
                                                {selected && <span className="mr-1">✓</span>}{r}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setWizardStep(1)} className="gap-2 flex-1">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </Button>
                                <Button
                                    onClick={() => setWizardStep(3)}
                                    disabled={!canProceedStep2}
                                    className="gap-2 flex-[2] bg-blue-600 hover:bg-blue-700 text-white h-12"
                                >
                                    Continue <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Calories + Macros + Generate ───────────────── */}
                    {wizardStep === 3 && (
                        <div className="space-y-6">
                            {/* Plan Name */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Plan Name <span className="text-red-500">*</span></label>
                                <input
                                    value={planName}
                                    onChange={e => setPlanName(e.target.value)}
                                    placeholder={`My ${goal} Plan`}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Calorie Target */}
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Daily Calorie Target</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Auto-calculated based on your goal &amp; activity</p>
                                    </div>
                                    <button
                                        onClick={() => setManualCalories(!manualCalories)}
                                        className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${manualCalories ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-600 dark:text-slate-400 dark:border-slate-600 hover:border-blue-400"}`}
                                    >
                                        {manualCalories ? "Auto" : "Manual"}
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button aria-label="Decrease calories" onClick={() => { setManualCalories(true); setCalorieTarget(c => Math.max(1200, c - 50)); }} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                        <Minus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-3xl font-black text-blue-600">{calorieTarget.toLocaleString()}</span>
                                        <span className="text-sm text-slate-500 ml-1">kcal/day</span>
                                    </div>
                                    <button aria-label="Increase calories" onClick={() => { setManualCalories(true); setCalorieTarget(c => Math.min(5000, c + 50)); }} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                        <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                </div>
                                <input
                                    aria-label="Calorie target slider"
                                    type="range" min={1200} max={5000} step={50}
                                    value={calorieTarget}
                                    onChange={e => { setManualCalories(true); setCalorieTarget(Number(e.target.value)); }}
                                    className="w-full mt-3 accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>1,200</span><span>5,000</span>
                                </div>
                            </div>

                            {/* Macro Targets */}
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Macro Targets</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Protein, carbs and fat targets</p>
                                    </div>
                                    <button
                                        onClick={() => { setManualMacros(!manualMacros); if (manualMacros) { const m = calculateMacros(goal, calorieTarget); setProteinGrams(m.protein); setCarbsGrams(m.carbs); setFatGrams(m.fat); }}}
                                        className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${manualMacros ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-600 dark:text-slate-400 dark:border-slate-600 hover:border-blue-400"}`}
                                    >
                                        {manualMacros ? "Auto" : "Manual"}
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Protein", value: proteinGrams, setter: setProteinGrams, color: "text-blue-600", bar: "bg-blue-500", cal: proteinGrams * 4 },
                                        { label: "Carbs",   value: carbsGrams,   setter: setCarbsGrams,   color: "text-orange-600", bar: "bg-orange-500", cal: carbsGrams * 4 },
                                        { label: "Fat",     value: fatGrams,     setter: setFatGrams,     color: "text-yellow-600", bar: "bg-yellow-500", cal: fatGrams * 9 },
                                    ].map(macro => (
                                        <div key={macro.label} className="text-center">
                                            <div className={`text-2xl font-black ${macro.color}`}>{macro.value}g</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{macro.label} · {macro.cal} kcal</div>
                                            {manualMacros && (
                                                <input
                                                    aria-label={`${macro.label} grams slider`}
                                                    type="range" min={0} max={500} step={5}
                                                    value={macro.value}
                                                    onChange={e => macro.setter(Number(e.target.value))}
                                                    className="w-full accent-blue-600"
                                                />
                                            )}
                                            <Progress value={Math.min(100, (macro.cal / calorieTarget) * 100)} className="h-1.5 mt-1" />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" /> Total from macros</span>
                                        <span className={`font-bold ${Math.abs((proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9) - calorieTarget) < 100 ? "text-green-600" : "text-amber-600"}`}>
                                            {(proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9).toLocaleString()} kcal
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Review Summary */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3 text-sm">Plan Summary</h3>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Goal</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{goal}</span>
                                    <span className="text-slate-600 dark:text-slate-400">Activity</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{activityLevel}</span>
                                    <span className="text-slate-600 dark:text-slate-400">Diet</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{dietType}</span>
                                    {restrictions.length > 0 && <>
                                        <span className="text-slate-600 dark:text-slate-400">Restrictions</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{restrictions.join(", ")}</span>
                                    </>}
                                    <span className="text-slate-600 dark:text-slate-400">Daily Calories</span>
                                    <span className="font-semibold text-green-700 dark:text-green-400">{calorieTarget.toLocaleString()} kcal</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setWizardStep(2)} className="gap-2 flex-1">
                                    <ChevronLeft className="w-4 h-4" /> Back
                                </Button>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!canGenerate || isGenerating}
                                    className="gap-2 flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12"
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> {generatingStatus}</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Generate Plan</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Plan View ─────────────────────────────────────────────────────────────
    const plan = activePlan!;
    const dailyCal = plan.dailyCalories ?? 2000;
    const planProtein = plan.proteinGrams ?? 150;
    const planCarbs   = plan.carbsGrams   ?? 250;
    const planFat     = plan.fatGrams     ?? 55;

    const macroStats = [
        { label: "Protein", grams: planProtein, kcal: planProtein * 4, color: "bg-blue-500",   textColor: "text-blue-600",   pct: Math.round((planProtein * 4 / dailyCal) * 100) },
        { label: "Carbs",   grams: planCarbs,   kcal: planCarbs * 4,   color: "bg-orange-500", textColor: "text-orange-600", pct: Math.round((planCarbs * 4 / dailyCal) * 100) },
        { label: "Fat",     grams: planFat,     kcal: planFat * 9,     color: "bg-yellow-500", textColor: "text-yellow-600", pct: Math.round((planFat * 9 / dailyCal) * 100) },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{plan.planName}</h1>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${plan.isActive ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                                {plan.isActive ? "Active" : plan.statusText}
                            </span>
                        </div>
                        {plan.description && (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{plan.description}</p>
                        )}
                        {plan.startDate && (
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>Started {new Date(plan.startDate).toLocaleDateString()}</span>
                                {plan.endDate && <><span>→</span><span>Ends {new Date(plan.endDate).toLocaleDateString()}</span></>}
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={startWizard}
                        variant="outline"
                        className="gap-2 shrink-0"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Generate New Plan
                    </Button>
                </div>

                {/* Calorie Ring + Macro Bars */}
                <div className="grid md:grid-cols-4 gap-4">
                    {/* Calorie Card */}
                    <div className="md:col-span-1 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="relative w-24 h-24 mb-3">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-700" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * 0.2}`} strokeLinecap="round" className="text-green-500 transition-all" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Flame className="w-5 h-5 text-green-500 mb-0.5" />
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">daily</span>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{dailyCal.toLocaleString()}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">kcal / day</div>
                    </div>

                    {/* Macro Bars */}
                    <div className="md:col-span-3 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Daily Macro Targets</h3>
                        {macroStats.map(m => (
                            <div key={m.label}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{m.label}</span>
                                    <div className="flex gap-3 text-xs text-slate-500">
                                        <span className={`font-bold ${m.textColor}`}>{m.grams}g</span>
                                        <span>{m.kcal} kcal</span>
                                        <span className="font-semibold">{m.pct}%</span>
                                    </div>
                                </div>
                                <Progress value={m.pct} className="h-2" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Foods to Avoid */}
                {((aiPlan?.foods_to_avoid && aiPlan.foods_to_avoid.length > 0) || (plan.dietaryRestrictions && plan.dietaryRestrictions.length > 0)) && (
                    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <span className="text-red-500">⚠</span> Foods to Avoid
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {(aiPlan?.foods_to_avoid ?? plan.dietaryRestrictions ?? []).map((r, i) => (
                                <span key={`${r}-${i}`} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                    {r}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI-Generated Day Plan */}
                {aiPlan && aiPlan.days && aiPlan.days.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            Your AI Meal Plan
                        </h2>
                        {/* Day Tabs */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {aiPlan.days.map((day, i) => (
                                <button
                                    key={day.day}
                                    onClick={() => setSelectedDay(i)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        selectedDay === i
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                                    }`}
                                >
                                    Day {day.day}
                                    <span className={`ml-2 text-xs ${selectedDay === i ? "text-blue-100" : "text-slate-400"}`}>
                                        {day.total_calories} kcal
                                    </span>
                                </button>
                            ))}
                        </div>
                        {/* Selected Day Meals */}
                        {(() => {
                            const dayData = aiPlan.days[selectedDay];
                            if (!dayData) return null;
                            const mealTypes: { key: "breakfast" | "lunch" | "dinner" | "snack"; label: string }[] = [
                                { key: "breakfast", label: "Breakfast" },
                                { key: "lunch", label: "Lunch" },
                                { key: "dinner", label: "Dinner" },
                                { key: "snack", label: "Snack" },
                            ];
                            return (
                                <div className="space-y-4">
                                    {mealTypes.map(({ key, label }) => {
                                        const mealData = dayData.meals[key] as typeof dayData.meals[typeof key] | undefined;
                                        if (!mealData || mealData.items.length === 0) return null;
                                        const style = getMealTypeStyle(label);
                                        return (
                                            <div key={key} className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-8 w-8 rounded-lg ${style.bgColor} flex items-center justify-center`}>
                                                            <style.icon className={`h-4 w-4 ${style.iconColor}`} />
                                                        </div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white">{label}</h3>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                                        {mealData.total_calories} kcal
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {mealData.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-medium text-slate-900 dark:text-white text-sm">{item.name}</span>
                                                                <span className="text-slate-400 text-xs ml-1.5">{item.grams}g</span>
                                                            </div>
                                                            <div className="flex gap-1 ml-2 flex-shrink-0 flex-wrap justify-end">
                                                                <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-medium">{item.calories} kcal</span>
                                                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">P{item.protein_g}g</span>
                                                                <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded font-medium">C{item.carbs_g}g</span>
                                                                <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-medium">F{item.fat_g}g</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Meal Suggestions */}
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-green-600" />
                        Suggested Meals
                    </h2>
                    {meals.length === 0 ? (
                        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Apple className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">No meal suggestions available yet.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {meals.slice(0, 9).map(meal => {
                                const style = getMealTypeStyle(meal.mealType);
                                return (
                                    <div key={meal.mealId} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all group">
                                        <div className="flex items-start gap-3">
                                            <div className={`h-10 w-10 rounded-xl ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
                                                <style.icon className={`h-5 w-5 ${style.iconColor}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{meal.mealType || "Meal"}</div>
                                                <div className="font-semibold text-slate-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {meal.name}
                                                </div>
                                                <div className="flex gap-2 mt-1.5 flex-wrap">
                                                    {meal.calories && <span className="text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-medium">{meal.calories} kcal</span>}
                                                    {meal.proteinGrams && <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">P {meal.proteinGrams}g</span>}
                                                    {meal.carbsGrams && <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded font-medium">C {meal.carbsGrams}g</span>}
                                                    {meal.fatGrams && <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-medium">F {meal.fatGrams}g</span>}
                                                </div>
                                            </div>
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

export default function NutritionPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach, UserRole.Admin]}>
            <SubscriptionGate>
                <NutritionContent />
            </SubscriptionGate>
        </ProtectedRoute>
    );
}
