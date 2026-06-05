"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dumbbell,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Apple,
  MessageSquare
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import {
  getCoachReviewPlans,
  updatePlanStatus,
  type UserAIWorkoutPlan,
} from "@/lib/api/workoutAI";
import {
  nutritionPlansApi,
  type NutritionPlanDto
} from "@/lib/api/nutritionPlans";
import WorkoutPlanEditModal from "@/components/coach/WorkoutPlanEditModal";
import NutritionPlanEditModal from "@/components/coach/NutritionPlanEditModal";

function CoachProgramsContent() {
  const [activeTab, setActiveTab] = useState<"workouts" | "nutrition">("workouts");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "UnderReview" | "Approved" | "Rejected">("all");

  // Workout Plans States
  const [workoutPlans, setWorkoutPlans] = useState<UserAIWorkoutPlan[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null);
  const [workoutNotesPlan, setWorkoutNotesPlan] = useState<number | null>(null);
  const [workoutNotesText, setWorkoutNotesText] = useState("");
  const [editingWorkout, setEditingWorkout] = useState<UserAIWorkoutPlan | null>(null);

  // Nutrition Plans States
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanDto[]>([]);
  const [loadingNutrition, setLoadingNutrition] = useState(true);
  const [expandedNutrition, setExpandedNutrition] = useState<number | null>(null);
  const [nutritionNotesPlan, setNutritionNotesPlan] = useState<number | null>(null);
  const [nutritionNotesText, setNutritionNotesText] = useState("");
  const [editingNutrition, setEditingNutrition] = useState<NutritionPlanDto | null>(null);

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetching Data
  const fetchWorkoutPlans = useCallback(async () => {
    try {
      setLoadingWorkouts(true);
      const response = await getCoachReviewPlans();
      setWorkoutPlans(response.data || []);
    } catch {
      showToast("Failed to load workout plans for review", "error");
    } finally {
      setLoadingWorkouts(false);
    }
  }, [showToast]);

  const fetchNutritionPlans = useCallback(async () => {
    try {
      setLoadingNutrition(true);
      const response = await nutritionPlansApi.getCoachReviewPlans();
      setNutritionPlans(response.data || []);
    } catch {
      showToast("Failed to load nutrition plans for review", "error");
    } finally {
      setLoadingNutrition(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchWorkoutPlans();
    fetchNutritionPlans();
  }, [fetchWorkoutPlans, fetchNutritionPlans]);

  // Workout Status Handler
  const handleUpdateWorkoutStatus = async (
    planId: number,
    status: "Approved" | "Rejected",
    notes?: string
  ) => {
    setActionLoading(planId);
    try {
      const response = await updatePlanStatus(planId, status, notes);
      if (response.success) {
        setWorkoutPlans(prev =>
          prev.map(p =>
            p.planId === planId ? { ...p, status, approvalNotes: notes } : p
          )
        );
        showToast(`Workout plan ${status === "Approved" ? "approved" : "rejected"} successfully`, "success");
        setWorkoutNotesPlan(null);
        setWorkoutNotesText("");
      } else {
        showToast(response.message || "Failed to update plan status", "error");
      }
    } catch {
      showToast("Failed to update plan status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Nutrition Status Handler
  const handleUpdateNutritionStatus = async (
    planId: number,
    status: "Approved" | "Rejected",
    notes?: string
  ) => {
    setActionLoading(planId);
    try {
      const response = await nutritionPlansApi.coachUpdateStatus(planId, status, notes);
      if (response.success) {
        setNutritionPlans(prev =>
          prev.map(p =>
            p.planId === planId ? { ...p, statusText: status, status: status === "Approved" ? 3 : 4, approvalNotes: notes } : p
          )
        );
        showToast(`Nutrition plan ${status === "Approved" ? "approved" : "rejected"} successfully`, "success");
        setNutritionNotesPlan(null);
        setNutritionNotesText("");
      } else {
        showToast(response.message || "Failed to update nutrition plan status", "error");
      }
    } catch {
      showToast("Failed to update nutrition plan status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter Workout Plans
  const filteredWorkouts = workoutPlans.filter(
    p =>
      (reviewFilter === "all" || p.status === reviewFilter) &&
      (p.planName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.goal?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter Nutrition Plans
  const filteredNutrition = nutritionPlans.filter(
    p =>
      (reviewFilter === "all" ||
        (reviewFilter === "UnderReview" && p.statusText === "UnderReview") ||
        (reviewFilter === "Approved" && p.statusText === "Approved") ||
        (reviewFilter === "Rejected" && p.statusText === "Rejected")) &&
      (p.planName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group workouts by member
  const groupedWorkouts = useMemo(() => {
    const groups: Record<string, UserAIWorkoutPlan[]> = {};
    filteredWorkouts.forEach(plan => {
      const key = plan.memberName || `Member #${plan.memberId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan);
    });
    return groups;
  }, [filteredWorkouts]);

  // Group nutrition by member
  const groupedNutrition = useMemo(() => {
    const groups: Record<string, NutritionPlanDto[]> = {};
    filteredNutrition.forEach(plan => {
      const key = plan.memberName || `Member #${plan.memberId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan);
    });
    return groups;
  }, [filteredNutrition]);

  // Counts
  const pendingWorkoutsCount = workoutPlans.filter(p => p.status === "UnderReview").length;
  const pendingNutritionCount = nutritionPlans.filter(p => p.statusText === "UnderReview").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UnderReview":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Under Review
          </span>
        );
      case "Approved":
      case "Active":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
            {status}
          </span>
        );
    }
  };

  // Helper to parse nutrition plan JSON
  const getNutritionMealsSummary = (plan: NutritionPlanDto) => {
    if (plan.aiPlanJson) {
      try {
        const aiPlan = JSON.parse(plan.aiPlanJson);
        if (aiPlan.days) return aiPlan.days;
      } catch {}
    }

    // Fallback: group plan.meals by dayNumber and mealType
    if (plan.meals && plan.meals.length > 0) {
      const daysMap: Record<number, Record<string, any[]>> = {};

      plan.meals.forEach(m => {
        const dayNum = m.dayNumber || 1;
        const mealType = (m.mealType || "Breakfast").toLowerCase();

        if (!daysMap[dayNum]) {
          daysMap[dayNum] = {};
        }
        if (!daysMap[dayNum][mealType]) {
          daysMap[dayNum][mealType] = [];
        }

        daysMap[dayNum][mealType].push({
          name: m.name,
          calories: m.calories,
          protein_g: m.proteinGrams,
          carbs_g: m.carbsGrams,
          fat_g: m.fatGrams
        });
      });

      return Object.keys(daysMap).map(dayStr => {
        const dayNum = parseInt(dayStr, 10);
        const mealsObj: Record<string, { items: any[] }> = {};
        Object.keys(daysMap[dayNum]).forEach(type => {
          mealsObj[type] = { items: daysMap[dayNum][type] };
        });
        return {
          day: dayNum,
          meals: mealsObj
        };
      }).sort((a, b) => a.day - b.day);
    }

    return [];
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Training Programs</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and correct AI-generated workout and nutrition plans
          </p>
        </div>
        {/* <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create Custom Program
        </Button> */}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => { setActiveTab("workouts"); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === "workouts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          Workout Programs
          {pendingWorkoutsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingWorkoutsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("nutrition"); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === "nutrition"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Apple className="h-4 w-4" />
          Nutrition Plans
          {pendingNutritionCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingNutritionCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-primary">
                {activeTab === "workouts" ? workoutPlans.length : nutritionPlans.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total AI plans
              </div>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-full">
              {activeTab === "workouts" ? (
                <Dumbbell className="h-5 w-5 text-primary" />
              ) : (
                <Apple className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        </Card>
        <Card className="p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-amber-500">
                {activeTab === "workouts" ? pendingWorkoutsCount : pendingNutritionCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Pending review
              </div>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-full">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </Card>
        <Card className="p-5 border border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-500">
                {activeTab === "workouts"
                  ? workoutPlans.filter(p => p.status === "Approved").length
                  : nutritionPlans.filter(p => p.statusText === "Approved").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Approved plans
              </div>
            </div>
            <div className="p-2.5 bg-green-500/10 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </Card>
        <Card className="p-5 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {activeTab === "workouts"
                  ? workoutPlans.filter(p => p.status === "Rejected").length
                  : nutritionPlans.filter(p => p.statusText === "Rejected").length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Rejected plans
              </div>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-full">
              <XCircle className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Review Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">
              {activeTab === "workouts" ? "Workout Plans Pending Action" : "Nutrition Plans Pending Action"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {(["all", "UnderReview", "Approved", "Rejected"] as const).map(f => (
              <button
                key={f}
                onClick={() => setReviewFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  reviewFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f === "all" ? "All" : f === "UnderReview" ? "Under Review" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member, plan name or goal..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {activeTab === "workouts" ? (
          /* WORKOUT TAB */
          loadingWorkouts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <Card className="p-10 border border-border text-center bg-card/50">
              <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No AI workout plans match your filter.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedWorkouts).map(([memberName, plans]) => (
                <div key={memberName} className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/40">
                  <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                      Client: {memberName}
                    </h3>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground uppercase tracking-wider">
                      {plans.length} plan{plans.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {plans.map(plan => (
                      <Card key={plan.planId} className="border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getStatusBadge(plan.status || "Unknown")}
                          <span className="text-xs text-muted-foreground">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg">{plan.planName}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-foreground">
                            Member: {plan.memberName || `Member #${plan.memberId}`}
                          </span>
                          <span>•</span>
                          <span>Goal: {plan.goal}</span>
                          <span>•</span>
                          <span>Level: {plan.fitnessLevel}</span>
                          <span>•</span>
                          <span>{plan.daysPerWeek} days/week</span>
                        </div>
                        {plan.approvalNotes && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic bg-muted/30 p-2 rounded border-l-2 border-primary">
                            Coach comments: &ldquo;{plan.approvalNotes}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {plan.status === "UnderReview" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                              onClick={() => handleUpdateWorkoutStatus(plan.planId, "Approved")}
                              disabled={actionLoading === plan.planId}
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-500 hover:bg-red-500/10 gap-1.5"
                              onClick={() => {
                                setWorkoutNotesPlan(workoutNotesPlan === plan.planId ? null : plan.planId);
                                setWorkoutNotesText("");
                              }}
                              disabled={actionLoading === plan.planId}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => setEditingWorkout(plan)}
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit & Fix
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5"
                          onClick={() =>
                            setExpandedWorkout(expandedWorkout === plan.planId ? null : plan.planId)
                          }
                        >
                          {expandedWorkout === plan.planId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {expandedWorkout === plan.planId ? "Hide" : "View"} Exercises
                        </Button>
                      </div>
                    </div>

                    {/* Rejection comments inline */}
                    {workoutNotesPlan === plan.planId && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <p className="text-sm font-medium">Rejection Reason</p>
                        <textarea
                          className="w-full text-sm bg-muted rounded-lg p-3 border border-border outline-none focus:ring-1 focus:ring-red-500 resize-none"
                          rows={3}
                          placeholder="Why is this plan being rejected?"
                          value={workoutNotesText}
                          onChange={e => setWorkoutNotesText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleUpdateWorkoutStatus(plan.planId, "Rejected", workoutNotesText)}
                            disabled={actionLoading === plan.planId}
                          >
                            Confirm Reject
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setWorkoutNotesPlan(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Expanded workout routines */}
                    {expandedWorkout === plan.planId && plan.days && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        {plan.days.map((day, di) => (
                          <div key={di} className="rounded-lg bg-muted/40 p-3.5 border border-border/40">
                            <p className="text-sm font-bold text-primary mb-2">
                              Day {day.dayNumber}: {day.dayName} (Focus: {day.focus})
                            </p>
                            <div className="grid gap-2">
                              {day.exercises.map((ex, ei) => (
                                <div
                                  key={ei}
                                  className="flex items-center justify-between text-xs bg-background/60 rounded p-2.5 border border-border/30"
                                >
                                  <span className="font-semibold">{ex.exerciseName}</span>
                                  <span className="text-muted-foreground">
                                    {ex.sets && ex.reps ? `${ex.sets} sets × ${ex.reps} reps` : ""}
                                    {ex.restSeconds ? ` · ${ex.restSeconds}s rest` : ""}
                                    {ex.notes ? ` (${ex.notes})` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* NUTRITION TAB */
          loadingNutrition ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNutrition.length === 0 ? (
            <Card className="p-10 border border-border text-center bg-card/50">
              <Apple className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No AI nutrition plans match your filter.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNutrition).map(([memberName, plans]) => (
                <div key={memberName} className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/40">
                  <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                      Client: {memberName}
                    </h3>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground uppercase tracking-wider">
                      {plans.length} plan{plans.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {plans.map(plan => (
                      <Card key={plan.planId} className="border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getStatusBadge(plan.statusText)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg">{plan.planName}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-foreground">
                            Member: {plan.memberName || `Member #${plan.memberId}`}
                          </span>
                          <span>•</span>
                          <span>Calories: {plan.dailyCalories} kcal</span>
                          {plan.proteinGrams && (
                            <>
                              <span>•</span>
                              <span>P: {plan.proteinGrams}g</span>
                              <span>C: {plan.carbsGrams}g</span>
                              <span>F: {plan.fatGrams}g</span>
                            </>
                          )}
                        </div>
                        {plan.dietaryRestrictions && plan.dietaryRestrictions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {plan.dietaryRestrictions.map((r, ri) => (
                              <span key={ri} className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5">
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                        {plan.approvalNotes && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic bg-muted/30 p-2 rounded border-l-2 border-primary">
                            Coach comments: &ldquo;{plan.approvalNotes}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {plan.statusText === "UnderReview" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                              onClick={() => handleUpdateNutritionStatus(plan.planId, "Approved")}
                              disabled={actionLoading === plan.planId}
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-500 hover:bg-red-500/10 gap-1.5"
                              onClick={() => {
                                setNutritionNotesPlan(nutritionNotesPlan === plan.planId ? null : plan.planId);
                                setNutritionNotesText("");
                              }}
                              disabled={actionLoading === plan.planId}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => setEditingNutrition(plan)}
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit & Fix
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5"
                          onClick={() =>
                            setExpandedNutrition(expandedNutrition === plan.planId ? null : plan.planId)
                          }
                        >
                          {expandedNutrition === plan.planId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {expandedNutrition === plan.planId ? "Hide" : "View"} Meals
                        </Button>
                      </div>
                    </div>

                    {/* Rejection comments inline */}
                    {nutritionNotesPlan === plan.planId && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <p className="text-sm font-medium">Rejection Reason</p>
                        <textarea
                          className="w-full text-sm bg-muted rounded-lg p-3 border border-border outline-none focus:ring-1 focus:ring-red-500 resize-none"
                          rows={3}
                          placeholder="Why is this nutrition plan being rejected?"
                          value={nutritionNotesText}
                          onChange={e => setNutritionNotesText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleUpdateNutritionStatus(plan.planId, "Rejected", nutritionNotesText)}
                            disabled={actionLoading === plan.planId}
                          >
                            Confirm Reject
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setNutritionNotesPlan(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Expanded nutrition meals */}
                    {expandedNutrition === plan.planId && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4">
                        {getNutritionMealsSummary(plan).map((day: any, di: number) => (
                          <div key={di} className="rounded-lg bg-muted/40 p-3.5 border border-border/40 space-y-3">
                            <p className="text-sm font-bold text-primary">Day {day.day || day.dayNumber} Meal Structure</p>
                            <div className="grid md:grid-cols-2 gap-3">
                              {Object.keys(day.meals || {}).map(mealKey => {
                                const meals = day.meals[mealKey]?.items || [];
                                return (
                                  <div key={mealKey} className="bg-background/60 p-2.5 rounded border border-border/20 space-y-1.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{mealKey}</span>
                                    <div className="space-y-1">
                                      {meals.length === 0 ? (
                                        <p className="text-[10px] text-muted-foreground italic">No items</p>
                                      ) : (
                                        meals.map((item: any, ii: number) => (
                                          <div key={ii} className="flex items-center justify-between text-xs border-b border-border/10 pb-1">
                                            <span className="font-semibold">{item.name || item.foodName}</span>
                                            <span className="text-slate-500">
                                              {item.calories} kcal • P: {item.protein_g || item.protein}g • C: {item.carbs_g || item.carbs}g • F: {item.fat_g || item.fats}g
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      {/* Edit Workout Plan Modal */}
      {editingWorkout && (
        <WorkoutPlanEditModal
          plan={editingWorkout}
          isOpen={true}
          onClose={() => setEditingWorkout(null)}
          onSaveSuccess={() => {
            showToast("Workout plan updated and approved successfully", "success");
            fetchWorkoutPlans();
          }}
        />
      )}

      {/* Edit Nutrition Plan Modal */}
      {editingNutrition && (
        <NutritionPlanEditModal
          plan={editingNutrition}
          isOpen={true}
          onClose={() => setEditingNutrition(null)}
          onSaveSuccess={() => {
            showToast("Nutrition plan updated and approved successfully", "success");
            fetchNutritionPlans();
          }}
        />
      )}
    </div>
  );
}

export default function CoachProgramsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachProgramsContent />
    </ProtectedRoute>
  );
}
