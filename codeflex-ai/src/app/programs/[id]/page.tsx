"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { workoutPlansApi, type MemberWorkoutPlanDto, type ScheduleWorkoutPlanDto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Dumbbell,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Play,
  Target,
  Zap,
  User,
  AlertCircle,
  CalendarDays,
  Timer,
  Repeat,
  Info,
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { equipmentApi, bookingsApi, type EquipmentDto } from "@/lib/api";

// Types for ML Plan JSON structure
interface MLExercise {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string[];
  equipment?: string[];
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

type PageProps = { params: Promise<{ id: string }> };

function ProgramDetails({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [plan, setPlan] = useState<MemberWorkoutPlanDto | null>(null);
  const [mlPlan, setMlPlan] = useState<MLPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);
  const [expandedDays, setExpandedDays] = useState<string[]>(["1-1"]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    preferredTime: "09:00",
    workoutDays: [1, 3, 5], // Mon, Wed, Fri by default
  });

  // Equipment Booking State
  const [allEquipment, setAllEquipment] = useState<EquipmentDto[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingEquipment, setBookingEquipment] = useState<EquipmentDto | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    async function loadEquipment() {
      const res = await equipmentApi.getAllEquipment();
      if (res.success && res.data) {
        setAllEquipment(res.data);
      }
    }
    loadEquipment();
  }, []);

  useEffect(() => {
    async function fetchPlan() {
      if (!user?.userId) return;
      try {
        const response = await workoutPlansApi.getMemberPlans(user.userId);
        if (response.success && response.data) {
          // Try to find by planId first (for AI plans), then by memberPlanId
          const foundPlan = response.data.find(p => p.planId === Number(id)) ||
            response.data.find(p => p.memberPlanId === Number(id));
          if (foundPlan) {
            setPlan(foundPlan);
            // Parse the mlPlanJson if available
            if (foundPlan.mlPlanJson) {
              try {
                const parsed = JSON.parse(foundPlan.mlPlanJson);
                setMlPlan(parsed.plan || parsed);
              } catch (e) {
                console.error("Failed to parse mlPlanJson:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch plan details", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlan();
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

  const findMatchingEquipment = (exercise: MLExercise): EquipmentDto | null => {
    if (!allEquipment.length) return null;

    // 1. Try exact match from AI equipment list
    if (exercise.equipment && exercise.equipment.length > 0) {
      for (const eqName of exercise.equipment) {
        const match = allEquipment.find(e => e.name.toLowerCase() === eqName.toLowerCase());
        if (match) return match;
        const fuzzy = allEquipment.find(e => e.name.toLowerCase().includes(eqName.toLowerCase()));
        if (fuzzy) return fuzzy;
      }
    }

    // 2. Fallback: Fuzzy match exercise Name to Equipment Name
    const match = allEquipment.find(e =>
      exercise.name.toLowerCase().includes(e.name.toLowerCase()) ||
      e.name.toLowerCase().includes(exercise.name.toLowerCase())
    );

    return match || null;
  };

  const handleOpenBooking = (matchedEq: EquipmentDto, weekNum: number, dayNum: number) => {
    setBookingEquipment(matchedEq);

    // Default to today or plan start
    let dateToUse = new Date().toISOString().split('T')[0];
    let timeToUse = "09:00";

    // Try to find scheduled date
    if (plan?.scheduledDays) {
      const scheduled = plan.scheduledDays.find(d => d.weekNumber === weekNum && d.dayNumber === dayNum);
      if (scheduled) {
        dateToUse = new Date(scheduled.scheduledDate).toISOString().split('T')[0];
        timeToUse = String(scheduled.startTime).substring(0, 5);
      }
    }

    setBookingDate(dateToUse);
    setBookingTime(timeToUse);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!user?.userId || !bookingEquipment || !bookingDate || !bookingTime) {
      showToast("Please check booking details", "error");
      return;
    }

    setIsBooking(true);
    try {
      const startTime = new Date(`${bookingDate}T${bookingTime}:00`);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1); // 1 hour session

      const res = await bookingsApi.createBooking({
        userId: user.userId,
        equipmentId: bookingEquipment.equipmentId,
        bookingType: "Equipment",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: "Booked via Workout Plan"
      });

      if (res.success) {
        showToast(`Booked ${bookingEquipment.name} successfully!`, "success");
        setShowBookingModal(false);
      } else {
        showToast(res.message || "Failed to book equipment", "error");
      }
    } catch (err) {
      showToast("Booking failed", "error");
    } finally {
      setIsBooking(false);
    }
  };

  const handleSchedulePlan = async () => {
    if (!plan || !user?.userId) return;

    setIsScheduling(true);
    try {
      const scheduleDto: ScheduleWorkoutPlanDto = {
        userId: user.userId,
        planId: plan.planId,
        startDate: scheduleData.startDate,
        preferredWorkoutTime: scheduleData.preferredTime + ":00",
        workoutDays: scheduleData.workoutDays,
        autoBookEquipment: true,
      };

      const response = await workoutPlansApi.scheduleWorkoutPlan(plan.planId, scheduleDto);
      if (response.success) {
        showToast("Plan scheduled successfully!", "success");
        // Refresh the plan data
        const planResponse = await workoutPlansApi.getMemberPlans(user.userId);
        if (planResponse.success && planResponse.data) {
          const updatedPlan = planResponse.data.find(p => p.planId === plan.planId);
          if (updatedPlan) {
            setPlan(updatedPlan);
          }
        }
      } else {
        showToast(response.message || "Failed to schedule plan", "error");
      }
    } catch (error) {
      showToast("An error occurred while scheduling", "error");
    } finally {
      setIsScheduling(false);
    }
  };

  const weekDays = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

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

  if (!plan) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-slate-900 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/programs">
            <Button variant="ghost" className="mb-6 gap-2 font-semibold text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Button>
          </Link>
          <Card className="p-12 text-center bg-slate-800 border-slate-700 rounded-2xl">
            <Dumbbell className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Plan Not Found</h2>
            <p className="text-slate-400">This workout plan does not exist or you don't have access to it.</p>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = (plan.totalWorkouts ?? 0) > 0
    ? Math.round(((plan.completedWorkouts ?? 0) / (plan.totalWorkouts ?? 1)) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-900 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/programs">
          <Button variant="ghost" className="gap-2 font-semibold text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-3">{plan.planName}</h1>
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
            {plan.statusText === "Draft" && (
              <Link href="/book-coach">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
                  <User className="h-4 w-4" />
                  Book a Coach
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Schedule Section (for Draft plans) */}
        {plan.statusText === "Draft" && (
          <Card className="p-6 bg-slate-800 border-slate-700 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              Schedule Your Plan
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={scheduleData.startDate}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Preferred Time</label>
                <input
                  type="time"
                  value={scheduleData.preferredTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSchedulePlan}
                  disabled={isScheduling}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
                >
                  {isScheduling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Schedule & Activate
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">Workout Days</label>
              <div className="flex flex-wrap gap-2">
                {weekDays.map(day => (
                  <button
                    key={day.value}
                    onClick={() => {
                      setScheduleData(prev => ({
                        ...prev,
                        workoutDays: prev.workoutDays.includes(day.value)
                          ? prev.workoutDays.filter(d => d !== day.value)
                          : [...prev.workoutDays, day.value].sort()
                      }));
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all",
                      scheduleData.workoutDays.includes(day.value)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Progress Card */}
        <Card className="p-6 bg-slate-800 border-slate-700 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Progress</h2>
              <p className="text-sm text-slate-400">
                {plan.completedWorkouts ?? 0} of {plan.totalWorkouts ?? (mlPlan ? mlPlan.days_per_week * mlPlan.duration_weeks : 0)} workouts completed
              </p>
            </div>
            <span className="text-2xl font-bold text-blue-400">{progressPercentage}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </Card>

        {/* Plan Overview */}
        {mlPlan && (
          <Card className="p-6 bg-slate-800 border-slate-700 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-yellow-500" />
              Plan Overview
            </h2>
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
                <p className="text-2xl font-bold text-white">{mlPlan.fitness_level}</p>
                <p className="text-sm text-slate-400">Level</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{mlPlan.split_type}</p>
                <p className="text-sm text-slate-400">Split</p>
              </div>
            </div>
            {mlPlan.notes && mlPlan.notes.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Important Notes
                </h3>
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

        {/* Workout Weeks */}
        {mlPlan && mlPlan.weeks && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-purple-500" />
              Workout Schedule
            </h2>

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
                      <h3 className="font-bold text-white">Week {week.week || weekIndex + 1}</h3>
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
                                <h4 className="font-bold text-white">{day.name || `Day ${day.day || dayIndex + 1}`}</h4>
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
                                      <h5 className="font-bold text-white capitalize">{exercise.name}</h5>
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

                                      {/* Equipment Booking Button */}
                                      {(() => {
                                        const matchedEq = findMatchingEquipment(exercise);
                                        if (matchedEq) {
                                          return (
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              className="h-7 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 ml-auto"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenBooking(matchedEq, week.week || weekIndex + 1, day.day || dayIndex + 1);
                                              }}
                                            >
                                              Book {matchedEq.name}
                                            </Button>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>

                                  {/* Exercise Instructions */}
                                  {
                                    exercise.notes && exercise.notes.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-slate-700">
                                        <h6 className="text-xs font-bold text-slate-400 uppercase mb-2">Instructions</h6>
                                        <ol className="space-y-1.5">
                                          {exercise.notes.map((note, noteIndex) => (
                                            <li key={noteIndex} className="text-sm text-slate-300 flex items-start gap-2">
                                              <span className="text-blue-400 font-bold min-w-[20px]">{noteIndex + 1}.</span>
                                              {note}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )
                                  }
                                </div>
                              ))}
                            </div>
                          )
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* If no ML plan data, show simple message */}
        {!mlPlan && (
          <Card className="p-8 bg-slate-800 border-slate-700 rounded-2xl text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Workout Details Available</h3>
            <p className="text-slate-400">
              This plan doesn't have detailed exercise information. It may be a template or coach-created plan.
            </p>
          </Card>
        )}

        {/* Plan Details Summary */}
        <Card className="p-6 bg-slate-800 border-slate-700 rounded-2xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Plan Information
          </h2>
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
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Book Equipment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Reserve {bookingEquipment?.name} for your workout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">Date</label>
              <Input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">Time</label>
              <Input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/20 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-blue-300">
                Booking ensures this equipment is available for you.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleConfirmBooking} disabled={isBooking} className="bg-blue-600 hover:bg-blue-700">
              {isBooking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}

export default function ProgramDetailsPage({ params }: PageProps) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ProgramDetails params={params} />
    </ProtectedRoute>
  );
}
