"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { workoutPlansApi, type MemberWorkoutPlanDto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ArrowLeft,
    Calendar,
    Dumbbell,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Target,
    Timer,
    Repeat,
    Info,
    AlertCircle,
    User,
    Edit3,
    Save,
    X,
    Zap,
    Mail,
    Phone,
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

// Types for ML Plan JSON structure
interface MLExercise {
    id: string;
    name: string;
    muscle_group: string;
    sets: number;
    reps: string;
    rest_seconds: number;
    notes: string[];
}

interface MLDay {
    day: number;
    name: string;
    focus: string;
    exercises: MLExercise[];
}

interface MLWeek {
    week: number;
    days: MLDay[];
}

interface MLPlan {
    goal: string;
    fitness_level: string;
    days_per_week: number;
    duration_weeks: number;
    split_type: string;
    notes: string[];
    weeks: MLWeek[];
    created_at: string;
}

// Mock member data (in production, fetch from backend)
interface MemberInfo {
    id: number;
    name: string;
    email: string;
    phone: string;
    memberSince: string;
    profileImage?: string;
}

type PageProps = { params: Promise<{ id: string }> };

function CoachClientDetails({ params }: PageProps) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [plan, setPlan] = useState<MemberWorkoutPlanDto | null>(null);
    const [mlPlan, setMlPlan] = useState<MLPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);
    const [expandedDays, setExpandedDays] = useState<string[]>(["1-1"]);
    const [editingExercise, setEditingExercise] = useState<string | null>(null);
    const [editedNotes, setEditedNotes] = useState<string>("");
    const [memberInfo] = useState<MemberInfo>({
        id: Number(id),
        name: "Loading...",
        email: "member@example.com",
        phone: "+1 234 567 8900",
        memberSince: new Date().toISOString(),
    });

    useEffect(() => {
        async function fetchClientPlan() {
            if (!user?.userId) return;
            try {
                // In a real implementation, this would fetch the specific member's plans
                const response = await workoutPlansApi.getMemberPlans(Number(id));
                if (response.success && response.data && response.data.length > 0) {
                    // Get the active plan or the first one
                    const activePlan = response.data.find(p => p.status === 1) || response.data[0];
                    setPlan(activePlan);
                    // Parse the mlPlanJson if available
                    if (activePlan.mlPlanJson) {
                        try {
                            const parsed = JSON.parse(activePlan.mlPlanJson);
                            setMlPlan(parsed.plan || parsed);
                        } catch (e) {
                            console.error("Failed to parse mlPlanJson:", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch client plan details", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchClientPlan();
    }, [user, id]);

    const toggleWeek = (weekNum: number) => {
        setExpandedWeeks(prev =>
            prev.includes(weekNum) ? prev.filter(w => w !== weekNum) : [...prev, weekNum]
        );
    };

    const toggleDay = (weekDay: string) => {
        setExpandedDays(prev =>
            prev.includes(weekDay) ? prev.filter(d => d !== weekDay) : [...prev, weekDay]
        );
    };

    const handleEditExercise = (exerciseId: string, currentNotes: string[]) => {
        setEditingExercise(exerciseId);
        setEditedNotes(currentNotes.join("\n"));
    };

    const handleSaveExerciseNotes = async (exerciseId: string) => {
        if (!plan || !mlPlan || !user?.userId) return;

        try {
            const newNotes = editedNotes.split("\n").filter(n => n.trim());

            // Call API to save changes
            const response = await workoutPlansApi.updateExerciseNotes(plan.planId, {
                planId: plan.planId,
                coachId: user.userId,
                exerciseId: exerciseId,
                notes: newNotes
            });

            if (response.success) {
                // Update local state
                const updatedPlan = { ...mlPlan };
                let found = false;

                for (const week of updatedPlan.weeks) {
                    for (const day of week.days) {
                        for (const exercise of day.exercises) {
                            if (exercise.id === exerciseId) {
                                exercise.notes = newNotes;
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                    if (found) break;
                }

                setMlPlan(updatedPlan);
                showToast("Exercise notes updated successfully!", "success");
            } else {
                showToast(response.message || "Failed to update notes", "error");
            }
        } catch (error) {
            console.error("Error updating notes:", error);
            showToast("An error occurred while saving notes", "error");
        } finally {
            setEditingExercise(null);
            setEditedNotes("");
        }
    };

    const goalLabels: Record<string, string> = {
        muscle_gain: "Build Muscle",
        weight_loss: "Lose Weight",
        strength: "Get Stronger",
        endurance: "Build Endurance",
        general: "General Fitness",
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-slate-900 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Back Button */}
                <Link href="/coach-clients">
                    <Button variant="ghost" className="gap-2 font-semibold text-slate-400 hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Clients
                    </Button>
                </Link>

                {/* Member Info Card */}
                <Card className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 rounded-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <User className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-black text-white mb-1">{plan?.memberName || memberInfo.name}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                                <span className="flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {memberInfo.email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {memberInfo.phone}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Member since {new Date(memberInfo.memberSince).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
                            <Mail className="h-4 w-4" />
                            Contact
                        </Button>
                    </div>
                </Card>

                {!plan ? (
                    <Card className="p-12 text-center bg-slate-800 border-slate-700 rounded-2xl">
                        <Dumbbell className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">No Active Plan</h2>
                        <p className="text-slate-400">This member doesn't have an active workout plan yet.</p>
                    </Card>
                ) : (
                    <>
                        {/* Plan Header */}
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Dumbbell className="h-5 w-5 text-blue-500" />
                                        {plan.planName}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={cn(
                                            "px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide",
                                            plan.statusText === "Active" ? "bg-green-500/20 text-green-400" :
                                                plan.statusText === "Draft" ? "bg-orange-500/20 text-orange-400" :
                                                    "bg-slate-600/50 text-slate-300"
                                        )}>
                                            {plan.statusText}
                                        </span>
                                        {mlPlan && (
                                            <>
                                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-400">
                                                    {goalLabels[mlPlan.goal] || mlPlan.goal}
                                                </span>
                                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400">
                                                    {mlPlan.split_type}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Card */}
                        <Card className="p-6 bg-slate-800 border-slate-700 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">Client Progress</h3>
                                    <p className="text-sm text-slate-400">
                                        {plan.completedWorkouts ?? 0} of {plan.totalWorkouts ?? (mlPlan ? mlPlan.days_per_week * mlPlan.duration_weeks : 0)} workouts completed
                                    </p>
                                </div>
                                <span className="text-2xl font-bold text-green-400">
                                    {(plan.totalWorkouts ?? 0) > 0
                                        ? Math.round(((plan.completedWorkouts ?? 0) / (plan.totalWorkouts ?? 1)) * 100)
                                        : 0}%
                                </span>
                            </div>
                            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(plan.totalWorkouts ?? 0) > 0
                                            ? Math.round(((plan.completedWorkouts ?? 0) / (plan.totalWorkouts ?? 1)) * 100)
                                            : 0}%`
                                    }}
                                />
                            </div>
                        </Card>

                        {/* Plan Overview */}
                        {mlPlan && (
                            <Card className="p-6 bg-slate-800 border-slate-700 rounded-2xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Info className="h-5 w-5 text-yellow-500" />
                                    Plan Overview
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{mlPlan.duration_weeks}</p>
                                        <p className="text-sm text-slate-400">Weeks</p>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{mlPlan.days_per_week}</p>
                                        <p className="text-sm text-slate-400">Days/Week</p>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-white capitalize">{mlPlan.fitness_level}</p>
                                        <p className="text-sm text-slate-400">Level</p>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{mlPlan.split_type}</p>
                                        <p className="text-sm text-slate-400">Split</p>
                                    </div>
                                </div>
                                {mlPlan.notes && mlPlan.notes.length > 0 && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                                        <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Important Notes
                                        </h4>
                                        <ul className="space-y-1">
                                            {mlPlan.notes.map((note, i) => (
                                                <li key={i} className="text-sm text-yellow-200/80 flex items-start gap-2">
                                                    <span className="text-yellow-400 mt-0.5">•</span>
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Workout Weeks - Coach Can Edit */}
                        {mlPlan && mlPlan.weeks && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-purple-500" />
                                        Workout Schedule
                                    </h3>
                                    <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                                        <Edit3 className="h-4 w-4 inline mr-1" />
                                        Click on an exercise to edit notes
                                    </span>
                                </div>

                                {mlPlan.weeks.map((week, weekIndex) => (
                                    <Card key={weekIndex} className="bg-slate-800 border-slate-700 rounded-2xl overflow-hidden">
                                        {/* Week Header */}
                                        <button
                                            onClick={() => toggleWeek(week.week || weekIndex + 1)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-purple-400">{week.week || weekIndex + 1}</span>
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-white">Week {week.week || weekIndex + 1}</h4>
                                                    <p className="text-sm text-slate-400">{week.days?.length || 0} workout days</p>
                                                </div>
                                            </div>
                                            {expandedWeeks.includes(week.week || weekIndex + 1) ? (
                                                <ChevronDown className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            )}
                                        </button>

                                        {/* Week Content */}
                                        {expandedWeeks.includes(week.week || weekIndex + 1) && week.days && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {week.days.map((day, dayIndex) => {
                                                    const dayKey = `${week.week || weekIndex + 1}-${day.day || dayIndex + 1}`;
                                                    return (
                                                        <div key={dayIndex} className="bg-slate-700/50 rounded-xl overflow-hidden">
                                                            {/* Day Header */}
                                                            <button
                                                                onClick={() => toggleDay(dayKey)}
                                                                className="w-full p-4 flex items-center justify-between hover:bg-slate-600/50 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                                        <span className="text-sm font-bold text-blue-400">{day.day || dayIndex + 1}</span>
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <h5 className="font-bold text-white">{day.name || `Day ${day.day || dayIndex + 1}`}</h5>
                                                                        <p className="text-sm text-slate-400">
                                                                            {day.focus} • {day.exercises?.length || 0} exercises
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-slate-400 bg-slate-600 px-2 py-1 rounded-lg">
                                                                        {day.exercises?.length || 0} exercises
                                                                    </span>
                                                                    {expandedDays.includes(dayKey) ? (
                                                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                    )}
                                                                </div>
                                                            </button>

                                                            {/* Exercises */}
                                                            {expandedDays.includes(dayKey) && day.exercises && (
                                                                <div className="px-4 pb-4 space-y-3">
                                                                    {day.exercises.map((exercise, exIndex) => (
                                                                        <div key={exIndex} className="bg-slate-800 rounded-xl p-4 border border-slate-600">
                                                                            <div className="flex items-start justify-between mb-3">
                                                                                <div>
                                                                                    <h6 className="font-bold text-white capitalize">{exercise.name}</h6>
                                                                                    <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full capitalize">
                                                                                        {exercise.muscle_group}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-4 text-sm">
                                                                                    <div className="flex items-center gap-1 text-blue-400">
                                                                                        <Repeat className="h-4 w-4" />
                                                                                        <span>{exercise.sets} sets</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1 text-green-400">
                                                                                        <Target className="h-4 w-4" />
                                                                                        <span>{exercise.reps} reps</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1 text-orange-400">
                                                                                        <Timer className="h-4 w-4" />
                                                                                        <span>{exercise.rest_seconds}s rest</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Exercise Instructions - Editable by Coach */}
                                                                            {exercise.notes && exercise.notes.length > 0 && (
                                                                                <div className="mt-3 pt-3 border-t border-slate-700">
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <h6 className="text-xs font-bold text-slate-400 uppercase">Instructions</h6>
                                                                                        {editingExercise === exercise.id ? (
                                                                                            <div className="flex gap-2">
                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    variant="ghost"
                                                                                                    onClick={() => handleSaveExerciseNotes(exercise.id)}
                                                                                                    className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                                                                                >
                                                                                                    <Save className="h-3 w-3 mr-1" />
                                                                                                    Save
                                                                                                </Button>
                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    variant="ghost"
                                                                                                    onClick={() => setEditingExercise(null)}
                                                                                                    className="h-7 px-2 text-slate-400 hover:text-slate-300"
                                                                                                >
                                                                                                    <X className="h-3 w-3" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="ghost"
                                                                                                onClick={() => handleEditExercise(exercise.id, exercise.notes)}
                                                                                                className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                                                                            >
                                                                                                <Edit3 className="h-3 w-3 mr-1" />
                                                                                                Edit
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>

                                                                                    {editingExercise === exercise.id ? (
                                                                                        <textarea
                                                                                            value={editedNotes}
                                                                                            onChange={(e) => setEditedNotes(e.target.value)}
                                                                                            className="w-full min-h-[120px] p-3 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                            placeholder="Enter instructions (one per line)"
                                                                                        />
                                                                                    ) : (
                                                                                        <ol className="space-y-1.5">
                                                                                            {exercise.notes.map((note, noteIndex) => (
                                                                                                <li key={noteIndex} className="text-sm text-slate-300 flex items-start gap-2">
                                                                                                    <span className="text-blue-400 font-bold min-w-[20px]">{noteIndex + 1}.</span>
                                                                                                    {note}
                                                                                                </li>
                                                                                            ))}
                                                                                        </ol>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* If no ML plan data */}
                        {!mlPlan && (
                            <Card className="p-8 bg-slate-800 border-slate-700 rounded-2xl text-center">
                                <Dumbbell className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">No Workout Details Available</h3>
                                <p className="text-slate-400">
                                    This plan doesn't have detailed exercise information. It may be a template or coach-created plan.
                                </p>
                            </Card>
                        )}

                        {/* Plan Dates */}
                        <Card className="p-6 bg-slate-800 border-slate-700 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                Plan Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                    <span className="text-slate-400">Plan Name</span>
                                    <span className="font-semibold text-white">{plan.planName}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                    <span className="text-slate-400">Status</span>
                                    <span className={cn(
                                        "font-semibold",
                                        plan.statusText === "Active" ? "text-green-400" :
                                            plan.statusText === "Draft" ? "text-orange-400" : "text-slate-300"
                                    )}>
                                        {plan.statusText}
                                    </span>
                                </div>
                                {plan.startDate && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                        <span className="text-slate-400">Start Date</span>
                                        <span className="font-semibold text-white">
                                            {new Date(plan.startDate).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            })}
                                        </span>
                                    </div>
                                )}
                                {plan.endDate && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                        <span className="text-slate-400">End Date</span>
                                        <span className="font-semibold text-white">
                                            {new Date(plan.endDate).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}

export default function CoachClientDetailsPage({ params }: PageProps) {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Coach]}>
            <CoachClientDetails params={params} />
        </ProtectedRoute>
    );
}
