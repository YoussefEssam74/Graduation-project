"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  aiApi,
  type MLUserProfile,
  type MLWorkoutPlan,
  type MLSafetySummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dumbbell,
  Target,
  Calendar,
  AlertTriangle,
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  Shield,
  Flame,
  Heart,
  Ticket,
  Info,
  ArrowRight,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import WorkoutPlanViewer from "@/components/programs/WorkoutPlanViewer";

// Fitness levels
const FITNESS_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "New to fitness or returning after a long break",
    icon: "🌱",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "6+ months of consistent training",
    icon: "💪",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "2+ years of serious training",
    icon: "🔥",
  },
] as const;

// Fitness goals
const FITNESS_GOALS = [
  {
    id: "muscle_gain",
    label: "Build Muscle",
    description: "Increase muscle mass and size",
    icon: Dumbbell,
    color: "blue",
  },
  {
    id: "weight_loss",
    label: "Lose Weight",
    description: "Burn fat and improve body composition",
    icon: Flame,
    color: "orange",
  },
  {
    id: "strength",
    label: "Get Stronger",
    description: "Increase raw strength and power",
    icon: Zap,
    color: "purple",
  },
  {
    id: "endurance",
    label: "Build Endurance",
    description: "Improve stamina and cardiovascular health",
    icon: Heart,
    color: "red",
  },
  {
    id: "general",
    label: "General Fitness",
    description: "Overall health and balanced fitness",
    icon: Target,
    color: "green",
  },
] as const;

// Common injuries
const COMMON_INJURIES = [
  { id: "knee", label: "Knee", icon: "🦵" },
  { id: "lower_back", label: "Lower Back", icon: "🔙" },
  { id: "shoulder", label: "Shoulder", icon: "💪" },
  { id: "ankle", label: "Ankle", icon: "🦶" },
  { id: "wrist", label: "Wrist", icon: "✋" },
  { id: "hip", label: "Hip", icon: "🦴" },
  { id: "neck", label: "Neck", icon: "🧣" },
  { id: "elbow", label: "Elbow", icon: "💪" },
];

// Plan durations
const DURATIONS = [
  { weeks: 1, label: "1 Week", description: "Quick starter plan" },
  { weeks: 2, label: "2 Weeks", description: "Short-term focus" },
  { weeks: 4, label: "4 Weeks", description: "Monthly program" },
  { weeks: 8, label: "8 Weeks", description: "Full transformation" },
  { weeks: 12, label: "12 Weeks", description: "Complete journey" },
];

// Steps in the wizard
const STEPS = ["Goal", "Level", "Schedule", "Health", "Generate"];

function WorkoutGeneratorContent() {
  const { user, updateTokenBalance } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if viewing a saved plan
  const viewPlanId = searchParams.get("viewPlan");

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MLWorkoutPlan | null>(
    null
  );
  const [safetySummary, setSafetySummary] = useState<MLSafetySummary | null>(
    null
  );
  const [exercisesAvailable, setExercisesAvailable] = useState<number>(0);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);

  // Form state
  const [profile, setProfile] = useState<MLUserProfile>({
    fitnessLevel: "beginner",
    goal: "muscle_gain",
    daysPerWeek: 3,
    injuries: [],
    allergies: [],
    preferredEquipment: [],
  });
  const [planDuration, setPlanDuration] = useState(4);

  // ML Service health
  const [mlHealthy, setMlHealthy] = useState<boolean | null>(null);

  // Load saved plan if viewPlan param is present
  useEffect(() => {
    if (viewPlanId) {
      const savedPlans = localStorage.getItem("ml_workout_plans");
      if (savedPlans) {
        try {
          const plans = JSON.parse(savedPlans);
          const plan = plans.find((p: { id: string }) => p.id === viewPlanId);
          if (plan) {
            setGeneratedPlan(plan.plan);
            setProfile(plan.profile);
            setViewingPlanId(plan.id);
            if (plan.safetySummary) {
              setSafetySummary(plan.safetySummary);
            }
          }
        } catch {
          console.error("Failed to load saved plan");
        }
      }
    }
  }, [viewPlanId]);

  // Check ML service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await aiApi.checkMLHealth();
        setMlHealthy(health.status === "healthy");
      } catch {
        setMlHealthy(false);
      }
    };
    checkHealth();
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!profile.goal;
      case 1:
        return !!profile.fitnessLevel;
      case 2:
        return profile.daysPerWeek >= 3 && profile.daysPerWeek <= 6;
      case 3:
        return true; // Injuries are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    if (!user?.userId) {
      showToast("Please log in to generate a workout plan", "error");
      return;
    }

    if ((user.tokenBalance ?? 0) < 30) {
      showToast("You need at least 30 tokens to generate a plan", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await aiApi.generateMLWorkout({
        userId: user.userId,
        profile,
        planDurationWeeks: planDuration,
      });

      if (response.success && response.data) {
        setGeneratedPlan(response.data.plan);
        setSafetySummary(response.data.safetySummary);
        setExercisesAvailable(response.data.exercisesAvailable);
        updateTokenBalance(response.data.newBalance);

        // Plan is automatically saved to database with planId
        const planIdMessage = response.data.planId
          ? ` (Plan ID: ${response.data.planId})`
          : '';
        showToast(
          `Workout plan generated and saved!${planIdMessage} ${response.data.tokensSpent} tokens spent.`,
          "success"
        );
        // Plans are now saved to database, no localStorage needed
      } else {
        showToast(
          response.message || "Failed to generate workout plan",
          "error"
        );
      }
    } catch (error) {
      console.error("Generation error:", error);
      showToast("An error occurred while generating your plan", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleInjury = (injuryId: string) => {
    setProfile((prev) => ({
      ...prev,
      injuries: prev.injuries.includes(injuryId)
        ? prev.injuries.filter((i) => i !== injuryId)
        : [...prev.injuries, injuryId],
    }));
  };

  // If plan is generated, show the plan viewer
  if (generatedPlan) {
    const isViewingSaved = !!viewingPlanId;
    const goalLabels: Record<string, string> = {
      muscle_gain: "Build Muscle",
      weight_loss: "Lose Weight",
      strength: "Get Stronger",
      endurance: "Build Endurance",
      general: "General Fitness",
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div
              className={cn(
                "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
                isViewingSaved
                  ? "bg-purple-100 dark:bg-purple-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              )}
            >
              {isViewingSaved ? (
                <Brain className="w-8 h-8 text-purple-600" />
              ) : (
                <Check className="w-8 h-8 text-green-600" />
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {isViewingSaved
                ? "Your Saved Workout Plan"
                : "Your Workout Plan is Ready!"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Personalized {generatedPlan.durationWeeks}-week{" "}
              {generatedPlan.splitType} program
            </p>
            {isViewingSaved && profile.goal && (
              <div className="flex justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-semibold rounded-full">
                  {goalLabels[profile.goal] || profile.goal}
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                  {profile.fitnessLevel?.charAt(0).toUpperCase() +
                    profile.fitnessLevel?.slice(1)}
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-semibold rounded-full">
                  {profile.daysPerWeek} days/week
                </span>
              </div>
            )}
          </div>

          {/* Safety Summary */}
          {safetySummary && safetySummary.injuries.length > 0 && (
            <Card className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Safety Filtering Applied
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {safetySummary.totalUnsafeExercises} exercises were filtered
                    out to protect your {safetySummary.injuries.join(", ")}.
                    {exercisesAvailable} safe exercises were used to build your
                    plan.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Plan Viewer Component */}
          <WorkoutPlanViewer plan={generatedPlan} />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {isViewingSaved ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push("/programs")}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Programs
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedPlan(null);
                    setViewingPlanId(null);
                    setCurrentStep(0);
                    router.replace("/workout-generator");
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate New Plan
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedPlan(null);
                    setCurrentStep(0);
                  }}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Generate Another
                </Button>
                <Button
                  onClick={() => router.push("/programs")}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  View All My Programs
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            AI Workout Generator
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Create a personalized workout plan using our AI trained on 7,959
            exercises
          </p>
        </div>

        {/* Token Balance */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
            <Ticket className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-slate-900 dark:text-white">
              {user?.tokenBalance ?? 0}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              tokens
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Cost: 30 tokens
            </span>
          </div>
        </div>

        {/* ML Service Status */}
        {mlHealthy === false && (
          <Card className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700 dark:text-red-300">
                AI service is currently unavailable. Please try again later.
              </p>
            </div>
          </Card>
        )}

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    index < currentStep
                      ? "bg-green-500 text-white cursor-pointer hover:bg-green-600"
                      : index === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-1 mx-1 rounded",
                      index < currentStep
                        ? "bg-green-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="p-6 md:p-8">
            {/* Step 0: Goal Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    What's Your Goal?
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Choose your primary fitness objective
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FITNESS_GOALS.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = profile.goal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            goal: goal.id as MLUserProfile["goal"],
                          }))
                        }
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isSelected
                                ? "bg-blue-500 text-white"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {goal.label}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {goal.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Fitness Level */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Your Fitness Level
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Be honest - this helps us create the right plan for you
                  </p>
                </div>

                <div className="grid gap-4">
                  {FITNESS_LEVELS.map((level) => {
                    const isSelected = profile.fitnessLevel === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() =>
                          setProfile((prev) => ({
                            ...prev,
                            fitnessLevel:
                              level.id as MLUserProfile["fitnessLevel"],
                          }))
                        }
                        className={cn(
                          "p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <span className="text-3xl">{level.icon}</span>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                            {level.label}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400">
                            {level.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-6 h-6 text-blue-500 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Schedule */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Your Schedule
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    How many days per week can you commit to training?
                  </p>
                </div>

                {/* Days per week */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Training Days Per Week
                  </label>
                  <div className="flex gap-3 justify-center">
                    {[3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        onClick={() =>
                          setProfile((prev) => ({ ...prev, daysPerWeek: days }))
                        }
                        className={cn(
                          "w-16 h-16 rounded-xl font-bold text-xl transition-all",
                          profile.daysPerWeek === days
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        )}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    {profile.daysPerWeek === 3 &&
                      "Full Body Split - Great for beginners"}
                    {profile.daysPerWeek === 4 &&
                      "Upper/Lower Split - Balanced approach"}
                    {profile.daysPerWeek === 5 &&
                      "Push/Pull/Legs - Intermediate favorite"}
                    {profile.daysPerWeek === 6 && "PPL x2 - Maximum volume"}
                  </p>
                </div>

                {/* Plan Duration */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Plan Duration
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.weeks}
                        onClick={() => setPlanDuration(d.weeks)}
                        className={cn(
                          "p-3 rounded-lg text-center transition-all",
                          planDuration === d.weeks
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                        )}
                      >
                        <div className="font-bold">{d.weeks}</div>
                        <div className="text-xs opacity-80">weeks</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Health & Injuries */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Health & Safety
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Select any injuries or limitations (optional)
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Our AI will automatically filter out exercises that could
                    aggravate your injuries. We have safety mappings for all
                    major injury types.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COMMON_INJURIES.map((injury) => {
                    const isSelected = profile.injuries.includes(injury.id);
                    return (
                      <button
                        key={injury.id}
                        onClick={() => toggleInjury(injury.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all",
                          isSelected
                            ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <span className="text-2xl mb-2 block">
                          {injury.icon}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isSelected
                              ? "text-red-700 dark:text-red-300"
                              : "text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {injury.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {profile.injuries.length > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Selected:{" "}
                      {profile.injuries
                        .map(
                          (i) =>
                            COMMON_INJURIES.find((inj) => inj.id === i)?.label
                        )
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Summary & Generate */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Ready to Generate!
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Review your selections and create your personalized plan
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Goal
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {FITNESS_GOALS.find((g) => g.id === profile.goal)?.label}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Level
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {
                        FITNESS_LEVELS.find(
                          (l) => l.id === profile.fitnessLevel
                        )?.label
                      }
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Schedule
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {profile.daysPerWeek} days/week
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Duration
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {planDuration} weeks
                    </div>
                  </div>
                </div>

                {profile.injuries.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Safety Filters Active
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Exercises will be filtered for:{" "}
                      {profile.injuries
                        .map(
                          (i) =>
                            COMMON_INJURIES.find((inj) => inj.id === i)?.label
                        )
                        .join(", ")}
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    mlHealthy === false ||
                    (user?.tokenBalance ?? 0) < 30
                  }
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl gap-3"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Your Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Workout Plan
                      <span className="text-sm opacity-80">(30 tokens)</span>
                    </>
                  )}
                </Button>

                {(user?.tokenBalance ?? 0) < 30 && (
                  <p className="text-center text-sm text-red-500">
                    You need at least 30 tokens.{" "}
                    <Link href="/tokens" className="underline">
                      Get more tokens
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep < 4 && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function WorkoutGeneratorPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <WorkoutGeneratorContent />
    </ProtectedRoute>
  );
}
