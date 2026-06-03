"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  RefreshCw,
  Save,
  Loader2,
  AlertCircle,
  Dumbbell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  editWorkoutPlan,
  getExerciseAlternatives,
  type UserAIWorkoutPlan,
  type UserAIPlanDay,
  type UserAIPlanExercise
} from "@/lib/api/workoutAI";

interface WorkoutPlanEditModalProps {
  plan: UserAIWorkoutPlan;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function WorkoutPlanEditModal({
  plan,
  isOpen,
  onClose,
  onSaveSuccess
}: WorkoutPlanEditModalProps) {
  const [planName, setPlanName] = useState(plan.planName);
  const [description, setDescription] = useState(plan.description || "");
  const [coachNotes, setCoachNotes] = useState(plan.approvalNotes || "");
  const [days, setDays] = useState<UserAIPlanDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan.days) {
      // Create a deep copy of the days to avoid mutating the prop
      const copy = JSON.parse(JSON.stringify(plan.days)) as UserAIPlanDay[];
      // Ensure day name is initialized if empty
      copy.forEach(d => {
        if (!d.dayName) d.dayName = `Day ${d.dayNumber}`;
      });
      setDays(copy);
    }
  }, [plan]);

  if (!isOpen) return null;

  const handleFieldChange = (
    dayNumber: number,
    exerciseIndex: number,
    field: keyof UserAIPlanExercise,
    value: any
  ) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const newExercises = [...d.exercises];
        newExercises[exerciseIndex] = {
          ...newExercises[exerciseIndex],
          [field]: value
        };
        return { ...d, exercises: newExercises };
      })
    );
  };

  const handleDayFieldChange = (dayNumber: number, field: "dayName" | "focus", value: string) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        return { ...d, [field]: value };
      })
    );
  };

  const handleDeleteExercise = (dayNumber: number, index: number) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const newExercises = d.exercises.filter((_, idx) => idx !== index);
        // Recalculate order indices
        const reordered = newExercises.map((ex, i) => ({
          ...ex,
          orderInDay: i + 1
        }));
        return { ...d, exercises: reordered };
      })
    );
  };

  const handleMoveExercise = (dayNumber: number, index: number, direction: "up" | "down") => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= d.exercises.length) return d;

        const newExercises = [...d.exercises];
        const temp = newExercises[index];
        newExercises[index] = newExercises[targetIndex];
        newExercises[targetIndex] = temp;

        // Recalculate order indices
        const reordered = newExercises.map((ex, i) => ({
          ...ex,
          orderInDay: i + 1
        }));
        return { ...d, exercises: reordered };
      })
    );
  };

  const handleAddExercise = (dayNumber: number) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const newEx: UserAIPlanExercise = {
          workoutPlanExerciseId: 0,
          exerciseId: 1, // Default exercise placeholder ID
          exerciseName: "New Exercise",
          dayNumber: dayNumber,
          orderInDay: d.exercises.length + 1,
          sets: 3,
          reps: 10,
          restSeconds: 60,
          notes: ""
        };
        return { ...d, exercises: [...d.exercises, newEx] };
      })
    );
  };

  const handleFetchAlternatives = async (dayNumber: number, index: number, name: string, muscleGroup?: string) => {
    const key = `${dayNumber}-${index}`;
    setSwapLoading(key);
    setError(null);
    try {
      let targetMuscles: string[] = [];
      if (muscleGroup && muscleGroup.trim()) {
        targetMuscles = [muscleGroup.trim().toLowerCase()];
      } else {
        const dayObj = days.find(d => d.dayNumber === dayNumber);
        if (dayObj && dayObj.focus) {
          targetMuscles = dayObj.focus
            .split(/[,&\/+\s]+/)
            .map(m => m.trim().toLowerCase())
            .filter(m => m.length > 1 && !["day", "workout", "rest", "focus", "training"].includes(m));
        }
        if (targetMuscles.length === 0 && name) {
          const lowerName = name.toLowerCase();
          if (lowerName.includes("bench") || lowerName.includes("chest") || lowerName.includes("pec") || lowerName.includes("fly")) {
            targetMuscles.push("chest");
          }
          if (lowerName.includes("row") || lowerName.includes("lat") || lowerName.includes("pull") || lowerName.includes("chinups")) {
            targetMuscles.push("back");
          }
          if (lowerName.includes("shoulder") || lowerName.includes("delt") || lowerName.includes("press") || lowerName.includes("lateral")) {
            targetMuscles.push("shoulders");
          }
          if (lowerName.includes("bicep") || lowerName.includes("curl")) {
            targetMuscles.push("biceps");
          }
          if (lowerName.includes("tricep") || lowerName.includes("pushdown") || lowerName.includes("extension")) {
            targetMuscles.push("triceps");
          }
          if (lowerName.includes("squat") || lowerName.includes("leg") || lowerName.includes("quad") || lowerName.includes("hamstring") || lowerName.includes("glute") || lowerName.includes("calf") || lowerName.includes("calves") || lowerName.includes("lunge")) {
            targetMuscles.push("legs");
          }
          if (lowerName.includes("crunch") || lowerName.includes("abs") || lowerName.includes("plank") || lowerName.includes("core")) {
            targetMuscles.push("abs");
          }
        }
      }

      const response = await getExerciseAlternatives(name, [], targetMuscles);
      if (response.success && response.data) {
        setAlternatives(prev => ({ ...prev, [key]: response.data || [] }));
      } else {
        setError("Failed to fetch exercise alternatives.");
      }
    } catch {
      setError("An error occurred while loading alternatives.");
    } finally {
      setSwapLoading(null);
    }
  };

  const handleApplyAlternative = (dayNumber: number, index: number, selectedEx: any) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const newExercises = [...d.exercises];
        newExercises[index] = {
          ...newExercises[index],
          exerciseId: selectedEx.exerciseId,
          exerciseName: selectedEx.name,
          muscleGroup: selectedEx.muscleGroup || selectedEx.targetMuscles?.[0]
        };
        return { ...d, exercises: newExercises };
      })
    );
    // Clear alternatives list for this slot
    const key = `${dayNumber}-${index}`;
    setAlternatives(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const requestData = {
        planName,
        description,
        coachNotes,
        days: days.map(d => ({
          dayNumber: d.dayNumber,
          dayName: d.dayName,
          focus: d.focus,
          exercises: d.exercises.map(e => ({
            workoutPlanExerciseId: e.workoutPlanExerciseId > 0 ? e.workoutPlanExerciseId : undefined,
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            dayNumber: e.dayNumber,
            orderInDay: e.orderInDay,
            sets: e.sets || 3,
            reps: e.reps || 10,
            restSeconds: e.restSeconds || 60,
            notes: e.notes
          }))
        }))
      };

      const response = await editWorkoutPlan(plan.planId, requestData);
      if (response.success) {
        onSaveSuccess();
        onClose();
      } else {
        setError(response.message || "Failed to save edits.");
      }
    } catch {
      setError("An error occurred while editing the workout plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Edit Workout Plan</h2>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Plan Settings */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan Name</label>
              <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="E.g., Hypertrophy Split" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overview Description</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Overview of targets/goals" />
            </div>
          </div>

          {/* Coach Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coach Comments / Notes (will be saved in DB)</label>
            <textarea
              className="w-full text-sm bg-muted rounded-lg p-3 border border-border outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={2}
              placeholder="Provide comments regarding your modifications (e.g. customized sets for strength)..."
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
            />
          </div>

          {/* Days & Exercises */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-1">Days & Exercise List</h3>
            {days.map((day) => (
              <Card key={day.dayNumber} className="p-4 border border-border/80 bg-muted/20 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Input
                      value={day.dayName || `Day ${day.dayNumber}`}
                      onChange={e => handleDayFieldChange(day.dayNumber, "dayName", e.target.value)}
                      className="font-bold text-base h-8 py-0 max-w-[200px] border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary bg-transparent hover:bg-muted"
                    />
                    <span className="text-xs text-muted-foreground">•</span>
                    <Input
                      value={day.focus || ""}
                      onChange={e => handleDayFieldChange(day.dayNumber, "focus", e.target.value)}
                      placeholder="Focus areas (e.g. Push, Chest)"
                      className="text-xs h-7 py-0 max-w-[220px] text-muted-foreground border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary bg-transparent hover:bg-muted"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => handleAddExercise(day.dayNumber)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Exercise
                  </Button>
                </div>

                {/* Exercises list */}
                <div className="space-y-2">
                  {day.exercises.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No exercises added to this day.</p>
                  ) : (
                    day.exercises.map((ex, idx) => {
                      const swapKey = `${day.dayNumber}-${idx}`;
                      const exerciseAlts = alternatives[swapKey] || [];
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2 bg-background p-3 rounded-lg border border-border/60 hover:border-border transition-colors flex-wrap md:flex-nowrap"
                        >
                          {/* Ordering buttons */}
                          <div className="flex flex-col gap-1 mt-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded"
                              disabled={idx === 0}
                              onClick={() => handleMoveExercise(day.dayNumber, idx, "up")}
                            >
                              <MoveUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded"
                              disabled={idx === day.exercises.length - 1}
                              onClick={() => handleMoveExercise(day.dayNumber, idx, "down")}
                            >
                              <MoveDown className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Exercise Content Grid */}
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 min-w-[250px]">
                            {/* Exercise Name & Substitution */}
                            <div className="col-span-2 space-y-1 relative">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">Exercise</label>
                              <div className="flex gap-1.5 items-center">
                                <Input
                                  value={ex.exerciseName}
                                  onChange={e => handleFieldChange(day.dayNumber, idx, "exerciseName", e.target.value)}
                                  className="h-8 text-xs font-semibold"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg border border-border"
                                  onClick={() => handleFetchAlternatives(day.dayNumber, idx, ex.exerciseName, ex.muscleGroup)}
                                  disabled={swapLoading === swapKey}
                                >
                                  {swapLoading === swapKey ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>

                              {/* Substitution Dropdown */}
                              {exerciseAlts.length > 0 && (
                                <div className="absolute left-0 md:-left-4 top-12 z-50 w-[320px] sm:w-[400px] md:w-[450px] bg-background/95 backdrop-blur-md border border-primary/30 rounded-xl shadow-2xl p-3 max-h-80 overflow-y-auto space-y-2 text-foreground">
                                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pb-2 border-b border-border">
                                    <span className="flex items-center gap-1 text-primary">
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                                      Substitution Alternatives
                                    </span>
                                    <button
                                      onClick={() => setAlternatives(p => {
                                        const c = { ...p };
                                        delete c[swapKey];
                                        return c;
                                      })}
                                      className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-0.5 font-semibold text-xs"
                                    >
                                      <X className="h-3 w-3" /> Dismiss
                                    </button>
                                  </div>
                                  <div className="space-y-2 pt-1">
                                    {exerciseAlts.map((alt, aidx) => (
                                      <button
                                        key={aidx}
                                        type="button"
                                        onClick={() => handleApplyAlternative(day.dayNumber, idx, alt)}
                                        className="w-full text-left p-2.5 rounded-lg border border-border/40 hover:border-primary/40 bg-card/50 hover:bg-primary/5 transition-all flex flex-col gap-1.5 group"
                                      >
                                        <div className="flex items-start justify-between gap-2 w-full">
                                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                            {alt.name}
                                          </span>
                                          <span className="shrink-0 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                            {alt.targetMuscles?.[0] || alt.muscleGroup || "General"}
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 items-center text-[10px]">
                                          {alt.exerciseType && (
                                            <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                                              {alt.exerciseType}
                                            </span>
                                          )}
                                          {alt.equipment && (
                                            <span className="text-muted-foreground/80">
                                              Equipment: <strong className="text-foreground/90 font-medium">{alt.equipment}</strong>
                                            </span>
                                          )}
                                          {alt.notes && (
                                            <span className="text-muted-foreground/80">
                                              • Diff: <strong className="text-foreground/90 font-medium">{alt.notes}</strong>
                                            </span>
                                          )}
                                        </div>
                                        {alt.description && (
                                          <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic border-l-2 border-border/80 pl-2 mt-1 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                                            {alt.description}
                                          </p>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Sets */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">Sets</label>
                              <Input
                                type="number"
                                value={ex.sets || ""}
                                onChange={e => handleFieldChange(day.dayNumber, idx, "sets", parseInt(e.target.value) || 0)}
                                className="h-8 text-xs tabular-nums"
                              />
                            </div>

                            {/* Reps */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">Reps</label>
                              <Input
                                value={ex.reps || ""}
                                onChange={e => handleFieldChange(day.dayNumber, idx, "reps", parseInt(e.target.value) || e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>

                            {/* Rest (seconds) */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">Rest (sec)</label>
                              <Input
                                type="number"
                                value={ex.restSeconds || ""}
                                onChange={e => handleFieldChange(day.dayNumber, idx, "restSeconds", parseInt(e.target.value) || 0)}
                                className="h-8 text-xs tabular-nums"
                              />
                            </div>
                          </div>

                          {/* Exercise Notes */}
                          <div className="flex-1 w-full md:w-auto grid grid-cols-6 gap-2 items-end">
                            <div className="col-span-5 space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase">Exercise Notes / Description</label>
                              <Input
                                value={ex.notes || ""}
                                onChange={e => handleFieldChange(day.dayNumber, idx, "notes", e.target.value)}
                                placeholder="Tempo, progressive overload cues, form tips..."
                                className="h-8 text-xs"
                              />
                            </div>

                            {/* Delete Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg border border-border"
                              onClick={() => handleDeleteExercise(day.dayNumber, idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save & Approve Plan
          </Button>
        </div>
      </Card>
    </div>
  );
}
