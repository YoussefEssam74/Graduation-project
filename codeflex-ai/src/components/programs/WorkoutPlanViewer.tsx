"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Download,
  Share2,
  Info,
  Target,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MLWorkoutPlan,
  MLWorkoutWeek,
  MLWorkoutDay,
  MLExercise,
} from "@/lib/api";

interface WorkoutPlanViewerProps {
  plan: MLWorkoutPlan;
  onStartWorkout?: (weekNum: number, dayNum: number) => void;
}

// Goal icons
const goalIcons: Record<string, React.ReactNode> = {
  muscle_gain: <Dumbbell className="w-4 h-4" />,
  weight_loss: <Flame className="w-4 h-4" />,
  strength: <Target className="w-4 h-4" />,
  endurance: <Clock className="w-4 h-4" />,
  general: <Dumbbell className="w-4 h-4" />,
};

// Format goal text
const formatGoal = (goal: string): string => {
  const goalMap: Record<string, string> = {
    muscle_gain: "Build Muscle",
    weight_loss: "Weight Loss",
    strength: "Strength",
    endurance: "Endurance",
    general: "General Fitness",
  };
  return goalMap[goal] || goal;
};

export default function WorkoutPlanViewer({
  plan,
  onStartWorkout,
}: WorkoutPlanViewerProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]); // First week expanded by default
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(weekNum)
        ? prev.filter((w) => w !== weekNum)
        : [...prev, weekNum]
    );
  };

  const toggleDay = (weekNum: number, dayNum: number) => {
    const key = `${weekNum}-${dayNum}`;
    setExpandedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  const isDayExpanded = (weekNum: number, dayNum: number) => {
    return expandedDays.includes(`${weekNum}-${dayNum}`);
  };

  // Calculate total stats
  const totalWorkouts = plan.weeks.reduce(
    (acc, week) => acc + week.days.length,
    0
  );
  const totalExercises = plan.weeks.reduce(
    (acc, week) =>
      acc + week.days.reduce((dayAcc, day) => dayAcc + day.exercises.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Plan Overview Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
              {goalIcons[plan.goal]}
              <span>{formatGoal(plan.goal)}</span>
              <span className="text-white/50">•</span>
              <span className="capitalize">{plan.fitnessLevel}</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {plan.splitType} Program
            </h2>
            <p className="text-blue-100 text-sm">
              {plan.durationWeeks} weeks • {plan.daysPerWeek} days/week
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalWorkouts}</div>
              <div className="text-blue-100 text-xs">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalExercises}</div>
              <div className="text-blue-100 text-xs">Exercises</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/20">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </Card>

      {/* Notes */}
      {plan.notes && plan.notes.length > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {plan.notes.map((note, i) => (
                <p key={i} className="text-sm text-blue-800 dark:text-blue-200">
                  • {note}
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Breakdown */}
      <div className="space-y-4">
        {plan.weeks.map((week) => (
          <WeekCard
            key={week.week}
            week={week}
            isExpanded={expandedWeeks.includes(week.week)}
            onToggle={() => toggleWeek(week.week)}
            expandedDays={expandedDays}
            onToggleDay={toggleDay}
            onStartWorkout={onStartWorkout}
          />
        ))}
      </div>
    </div>
  );
}

interface WeekCardProps {
  week: MLWorkoutWeek;
  isExpanded: boolean;
  onToggle: () => void;
  expandedDays: string[];
  onToggleDay: (weekNum: number, dayNum: number) => void;
  onStartWorkout?: (weekNum: number, dayNum: number) => void;
}

function WeekCard({
  week,
  isExpanded,
  onToggle,
  expandedDays,
  onToggleDay,
  onStartWorkout,
}: WeekCardProps) {
  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Week Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            {week.week}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Week {week.week}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {week.theme}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {week.days.length} workouts
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Week Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {week.days.map((day) => (
            <DayCard
              key={day.day}
              day={day}
              weekNum={week.week}
              isExpanded={expandedDays.includes(`${week.week}-${day.day}`)}
              onToggle={() => onToggleDay(week.week, day.day)}
              onStart={() => onStartWorkout?.(week.week, day.day)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

interface DayCardProps {
  day: MLWorkoutDay;
  weekNum: number;
  isExpanded: boolean;
  onToggle: () => void;
  onStart: () => void;
}

function DayCard({
  day,
  weekNum,
  isExpanded,
  onToggle,
  onStart,
}: DayCardProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Day Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {day.name}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {day.focus}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {day.exercises.length} exercises
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Exercises */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {day.exercises.map((exercise, index) => (
              <ExerciseRow key={index} exercise={exercise} index={index} />
            ))}
          </div>

          {/* Start Workout Button */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
            >
              <Play className="w-4 h-4" />
              Start This Workout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExerciseRowProps {
  exercise: MLExercise;
  index: number;
}

function ExerciseRow({ exercise, index }: ExerciseRowProps) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h5 className="font-medium text-slate-900 dark:text-white">
                {exercise.name}
              </h5>
              {exercise.muscleGroup && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {exercise.muscleGroup}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm flex-shrink-0">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                {exercise.sets} × {exercise.reps}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {exercise.restSeconds}s
              </span>
            </div>
          </div>

          {/* Notes Toggle */}
          {exercise.notes && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
            >
              {showNotes ? "Hide tips" : "Show tips"}
            </button>
          )}

          {/* Notes Content */}
          {showNotes && exercise.notes && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              {exercise.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
