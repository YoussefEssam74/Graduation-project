"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import SubscriptionGate from "@/components/SubscriptionGate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dumbbell,
  Zap,
  TrendingUp,
  Calendar,
  Target,
  Heart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Activity,
  User,
  X,
  Edit2,
  Save,
  Share2,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  ClipboardList,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Star,
  BadgeCheck,
  Clock,
  BedDouble,
  HeartPulse,
  Check,
  Shield,
  Flame,
  Wind,
  Weight,
  Bike,
} from "lucide-react";
import Link from "next/link";
import {
  generateAIWorkoutPlan,
  checkMLServiceHealth,
  getUserStrengthProfile,
  getLatestMuscleScan,
  saveAIWorkoutPlan,
  sharePlanWithCoach,
  getExerciseAlternatives,
  type GenerateAIWorkoutPlanRequest,
  type AIWorkoutPlanResult,
  type AIWorkoutDay,
  type AIExercise,
  type UserStrengthProfileDto,
  type MuscleScanResultDto,
} from "@/lib/api/workoutAI";
import {
  workoutLogsApi,
  type CreateWorkoutLogDto,
  type CreateLoggedExerciseDto,
  type CreateSetLogDto,
} from "@/lib/api/workoutLogs";
import { inbodyApi, type InBodyMeasurementDto } from "@/lib/api/inbody";
import { usersApi, type CoachDto } from "@/lib/api";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type InjurySeverity = "mild" | "moderate" | "severe";
type PlanStatus = "draft" | "under_review" | "approved";

// ─── Constants ────────────────────────────────────────────────────────────────
const GOAL_OPTIONS = [
  { value: "Muscle", label: "Build Muscle", icon: Dumbbell, color: "from-violet-500 to-purple-600", desc: "Hypertrophy & size" },
  { value: "Strength", label: "Strength", icon: Shield, color: "from-blue-500 to-indigo-600", desc: "Max force output" },
  { value: "WeightLoss", label: "Weight Loss", icon: Flame, color: "from-orange-500 to-red-500", desc: "Fat burning" },
  { value: "Cardio", label: "Cardio", icon: Wind, color: "from-cyan-500 to-teal-500", desc: "Cardiovascular health" },
  { value: "Endurance", label: "Endurance", icon: Bike, color: "from-green-500 to-emerald-600", desc: "Stamina & energy" },
] as const;

const FITNESS_LEVELS = [
  { value: "Beginner", label: "Beginner", desc: "0–1 years", emoji: "🌱" },
  { value: "Intermediate", label: "Intermediate", desc: "1–3 years", emoji: "⚡" },
  { value: "Advanced", label: "Advanced", desc: "3+ years", emoji: "🔥" },
] as const;

const EQUIPMENT_OPTIONS = [
  { value: "Barbell", icon: "🏋", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { value: "Dumbbells", icon: "💪", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { value: "Cable Machine", icon: "🔗", color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  { value: "Body Weight", icon: "🧘", color: "bg-green-50 border-green-200 text-green-700" },
  { value: "Kettlebell", icon: "🔔", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { value: "Resistance Bands", icon: "🎀", color: "bg-pink-50 border-pink-200 text-pink-700" },
  { value: "Pull-up Bar", icon: "🏋", color: "bg-teal-50 border-teal-200 text-teal-700" },
  { value: "Bench", icon: "🪑", color: "bg-slate-50 border-slate-200 text-slate-700" },
];

const INJURY_OPTIONS = [
  { value: "Lower Back", emoji: "🦴", muscles: ["lower back", "deadlift", "squat", "lumbar"] },
  { value: "Shoulder", emoji: "💆", muscles: ["shoulder", "delt", "rotator", "overhead"] },
  { value: "Knee", emoji: "🦵", muscles: ["knee", "quad", "leg press", "squat", "lunge"] },
  { value: "Wrist", emoji: "🤚", muscles: ["wrist", "forearm", "grip", "curl"] },
  { value: "Elbow", emoji: "💪", muscles: ["elbow", "tricep", "bicep", "curl", "extension"] },
  { value: "Hip", emoji: "🍑", muscles: ["hip", "glute", "squat", "deadlift", "lunge"] },
  { value: "Ankle", emoji: "🦶", muscles: ["ankle", "calf", "jump", "run"] },
];

const SEVERITY_CONFIG = {
  mild: {
    label: "Mild",
    desc: "Slight discomfort — swap to low-impact alternatives",
    color: "border-yellow-400 bg-yellow-50 text-yellow-800",
    badge: "bg-yellow-100 text-yellow-800",
    icon: AlertTriangle,
  },
  moderate: {
    label: "Moderate",
    desc: "Noticeable pain — remove stressing exercises",
    color: "border-orange-400 bg-orange-50 text-orange-800",
    badge: "bg-orange-100 text-orange-800",
    icon: ShieldAlert,
  },
  severe: {
    label: "Severe",
    desc: "Significant injury — replace affected day with rest",
    color: "border-red-500 bg-red-50 text-red-800",
    badge: "bg-red-100 text-red-800",
    icon: HeartPulse,
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
function exerciseAffectedByInjury(exerciseName: string, targetMuscles: string[], injuryArea: string): boolean {
  const injury = INJURY_OPTIONS.find((o) => o.value === injuryArea);
  if (!injury) return false;
  const nameLC = exerciseName.toLowerCase();
  const musclesLC = (targetMuscles || []).map((m) => m.toLowerCase());
  return injury.muscles.some((kw) => nameLC.includes(kw) || musclesLC.some((m) => m.includes(kw)));
}

function getEquipmentStatus(exerciseEquipment: string | undefined, availableEquipment: string[]): {
  status: "available" | "unavailable" | "bodyweight" | "unknown";
  label: string;
  classes: string;
} {
  if (!exerciseEquipment || exerciseEquipment.toLowerCase() === "none") {
    return { status: "bodyweight", label: "No equipment", classes: "bg-green-100 text-green-700" };
  }
  const eqLC = exerciseEquipment.toLowerCase();
  if (eqLC.includes("body") || eqLC.includes("bodyweight")) {
    return { status: "bodyweight", label: "Bodyweight", classes: "bg-green-100 text-green-700" };
  }
  if (availableEquipment.length === 0) {
    return { status: "unknown", label: exerciseEquipment, classes: "bg-slate-100 text-slate-600" };
  }
  const isAvailable = availableEquipment.some((eq) =>
    eqLC.includes(eq.toLowerCase()) || eq.toLowerCase().includes(eqLC.split(" ")[0])
  );
  if (isAvailable) {
    return { status: "available", label: exerciseEquipment, classes: "bg-blue-100 text-blue-700" };
  }
  return { status: "unavailable", label: `${exerciseEquipment} (not available)`, classes: "bg-red-100 text-red-700" };
}

const MAX_INBODY_VALID_DAYS = 30;

const getInbodyAgeInDays = (measurementDate: string): number => {
  const ageMs = Date.now() - new Date(measurementDate).getTime();
  return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
};

const isPositiveMetric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isInbodyComplete = (measurement: InBodyMeasurementDto | null): boolean => {
  if (!measurement) return false;
  return (
    isPositiveMetric(measurement.weight) &&
    isPositiveMetric(measurement.height) &&
    isPositiveMetric(measurement.bodyFatPercentage) &&
    isPositiveMetric(measurement.muscleMass)
  );
};

const areInbodyMeasurementsUnchanged = (
  latest: InBodyMeasurementDto,
  previous: InBodyMeasurementDto,
): boolean => {
  const comparableKeys: Array<keyof InBodyMeasurementDto> = [
    "weight", "height", "bodyFatPercentage", "muscleMass", "bmi", "bmr",
  ];
  const keysWithValues = comparableKeys.filter(
    (key) =>
      latest[key] !== undefined && latest[key] !== null &&
      previous[key] !== undefined && previous[key] !== null,
  );
  if (keysWithValues.length === 0) return false;
  return keysWithValues.every(
    (key) => Math.abs(Number(latest[key]) - Number(previous[key])) < 0.0001,
  );
};

// ─── Exercise Detail Modal ────────────────────────────────────────────────────
interface ExerciseDetailModalProps {
  exercise: AIExercise;
  onClose: () => void;
  onSave?: (exercise: AIExercise) => void;
  onSubstitute?: (newExerciseName: string) => void;
  availableEquipment?: string[];
}

function ExerciseDetailModal({
  exercise,
  onClose,
  onSave,
  onSubstitute,
  availableEquipment,
}: ExerciseDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExercise, setEditedExercise] = useState<AIExercise>(exercise);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AIExercise[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleSave = () => {
    if (onSave) onSave(editedExercise);
    setIsEditing(false);
    onClose();
  };

  const eqStatus = getEquipmentStatus(exercise.equipment, availableEquipment || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{exercise.name}</h2>
            <p className="text-sm opacity-90 mt-1">Exercise Details & Form Guide</p>
          </div>
          <button onClick={onClose} aria-label="Close exercise details" title="Close" className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Equipment Availability Banner */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${eqStatus.classes} border-opacity-50`}>
            <Dumbbell className="w-4 h-4 flex-shrink-0" />
            <span>
              {eqStatus.status === "available" && "✅ Equipment available in your gym"}
              {eqStatus.status === "unavailable" && "⚠�? Equipment not in your list — consider a substitution"}
              {eqStatus.status === "bodyweight" && "�? No equipment needed"}
              {eqStatus.status === "unknown" && `Equipment: ${eqStatus.label}`}
            </span>
          </div>

          {exercise.imageUrl && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden border-4 border-blue-200 shadow-lg">
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M22 12h-4l-3 9L9 3l-3 9H2'/%3E%3C/svg%3E";
                }}
              />
            </div>
          )}

          {exercise.description && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Form & Technique
              </h3>
              <p className="text-blue-800 leading-relaxed">{exercise.description}</p>
            </div>
          )}

          {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Target Muscles
              </h3>
              <div className="flex flex-wrap gap-2">
                {exercise.targetMuscles.map((muscle, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 capitalize">{muscle}</span>
                ))}
              </div>
            </div>
          )}

          {exercise.equipment && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-blue-600" />
                Equipment Needed
              </h3>
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${eqStatus.classes}`}>
                {exercise.equipment}
              </span>
            </div>
          )}

          {/* Training Parameters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Training Parameters</h3>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="gap-2">
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Sets</div>
                {isEditing ? (
                  <input type="text" value={editedExercise.sets} onChange={(e) => setEditedExercise({ ...editedExercise, sets: e.target.value })} className="w-full text-xl font-bold text-blue-600 bg-white border-2 border-blue-300 rounded px-2 py-1" placeholder="e.g., 4 or 3-4" />
                ) : (
                  <div className="text-xl font-bold text-blue-600">{exercise.sets}</div>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Reps</div>
                {isEditing ? (
                  <input type="text" value={editedExercise.reps || ""} aria-label="Edit reps" title="Repetitions" placeholder="e.g., 8-12" onChange={(e) => setEditedExercise({ ...editedExercise, reps: e.target.value })} className="w-full text-xl font-bold text-blue-600 bg-white border-2 border-blue-300 rounded px-2 py-1" />
                ) : (
                  <div className="text-xl font-bold text-blue-600">{exercise.reps || "N/A"}</div>
                )}
              </div>
              {(exercise.weightKg || isEditing) && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Weight (kg)</div>
                  {isEditing ? (
                    <input type="number" value={editedExercise.weightKg || ""} aria-label="Edit weight in kilograms" title="Weight in kg" placeholder="e.g., 40" onChange={(e) => setEditedExercise({ ...editedExercise, weightKg: Number(e.target.value) })} className="w-full text-xl font-bold text-blue-600 bg-white border-2 border-blue-300 rounded px-2 py-1" />
                  ) : (
                    <div className="text-xl font-bold text-blue-600">{exercise.weightKg}kg</div>
                  )}
                </div>
              )}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Rest</div>
                {isEditing ? (
                  <input type="text" value={editedExercise.rest || ""} aria-label="Edit rest duration" title="Rest duration" placeholder="e.g., 60s" onChange={(e) => setEditedExercise({ ...editedExercise, rest: e.target.value })} className="w-full text-xl font-bold text-blue-600 bg-white border-2 border-blue-300 rounded px-2 py-1" />
                ) : (
                  <div className="text-xl font-bold text-blue-600">{exercise.restSeconds ? `${exercise.restSeconds}s` : exercise.rest || "N/A"}</div>
                )}
              </div>
            </div>
          </div>

          {exercise.notes && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">💡 Training Tips</h3>
              <p className="text-amber-800">{exercise.notes}</p>
            </div>
          )}

          {/* Alternatives */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-green-600" />
                Exercise Substitution
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setShowAlternatives(!showAlternatives);
                  if (!showAlternatives && alternatives.length === 0) {
                    setLoadingAlternatives(true);
                    try {
                      const res = await getExerciseAlternatives(exercise.name, availableEquipment || [], exercise.targetMuscles || []);
                      if (res.success && res.data) setAlternatives(res.data);
                    } catch { /* use built-in alternatives */ }
                    setLoadingAlternatives(false);
                  }
                }}
                className="gap-1 text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                {showAlternatives ? "Hide" : "Find Alternatives"}
              </Button>
            </div>
            {exercise.alternatives && exercise.alternatives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exercise.alternatives.map((alt, i) => (
                  <button key={i} onClick={() => onSubstitute?.(alt)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all cursor-pointer" title={`Replace with ${alt}`}>
                    <RefreshCw className="w-3 h-3 inline mr-1" />{alt}
                  </button>
                ))}
              </div>
            )}
            {showAlternatives && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                {loadingAlternatives ? (
                  <div className="flex items-center gap-2 text-green-700"><Loader2 className="w-4 h-4 animate-spin" />Finding alternatives...</div>
                ) : alternatives.length > 0 ? (
                  <div className="space-y-2">
                    {alternatives.map((alt, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                        <div>
                          <p className="font-medium text-sm text-slate-900">{alt.name}</p>
                          <p className="text-xs text-slate-500">{alt.equipment} · {alt.targetMuscles?.join(", ")}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onSubstitute?.(alt.name)} className="text-xs border-green-300 text-green-700 hover:bg-green-100">Swap</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-700">Use the built-in alternatives above, or edit the exercise name directly.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 bg-slate-50 border-t flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
            </>
          ) : (
            <Button onClick={onClose} className="flex-1">Close</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Injury Adaptation Modal ──────────────────────────────────────────────────
interface InjuryAdaptationModalProps {
  onClose: () => void;
  onAdapt: (bodyPart: string, severity: InjurySeverity) => void;
  isLoading: boolean;
}

function InjuryAdaptationModal({ onClose, onAdapt, isLoading }: InjuryAdaptationModalProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<InjurySeverity | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Adapt Plan for Injury</h2>
                <p className="text-sm opacity-90">We'll modify your plan to keep you safe</p>
              </div>
            </div>
            <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Body Part */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">1</span>
              Where is the injury?
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {INJURY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedBodyPart(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    selectedBodyPart === opt.value
                      ? "border-red-500 bg-red-50 text-red-800"
                      : "border-slate-200 hover:border-red-300 hover:bg-red-50/50"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="font-medium text-sm">{opt.value}</span>
                  {selectedBodyPart === opt.value && <Check className="w-4 h-4 ml-auto text-red-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Severity */}
          {selectedBodyPart && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">2</span>
                How severe is the pain?
              </h3>
              <div className="space-y-2">
                {(["mild", "moderate", "severe"] as InjurySeverity[]).map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={sev}
                      onClick={() => setSelectedSeverity(sev)}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedSeverity === sev ? cfg.color : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{cfg.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{cfg.desc}</p>
                      </div>
                      {selectedSeverity === sev && <Check className="w-4 h-4 flex-shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>Cancel</Button>
          <Button
            onClick={() => selectedBodyPart && selectedSeverity && onAdapt(selectedBodyPart, selectedSeverity)}
            disabled={!selectedBodyPart || !selectedSeverity || isLoading}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adapting...</> : <><HeartPulse className="w-4 h-4 mr-2" />Adapt Plan</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Coach Card ───────────────────────────────────────────────────────────────
interface CoachCardProps {
  coach: CoachDto;
  onSelect: (coach: CoachDto) => void;
}

function CoachCard({ coach, onSelect }: CoachCardProps) {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all flex flex-col gap-4">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          {coach.profileImageUrl ? (
            <img src={coach.profileImageUrl} alt={coach.name} className="w-14 h-14 rounded-full object-cover border-2 border-blue-200" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
              {coach.name?.charAt(0) || "C"}
            </div>
          )}
          {coach.isAvailable && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" title="Available" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 truncate">{coach.name}</h4>
            {coach.certifications && coach.certifications.length > 0 && (
              <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" aria-label="Certified" />
            )}
          </div>
          {coach.specialization && (
            <p className="text-sm text-slate-600 mt-0.5 truncate">{coach.specialization}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
              <span className="text-sm font-semibold text-slate-700">{coach.rating?.toFixed(1) || "N/A"}</span>
              <span className="text-xs text-slate-400">({coach.totalReviews || 0})</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">{coach.totalClients || 0} clients</span>
          </div>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-3 text-xs text-slate-600">
        {coach.experienceYears !== undefined && (
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
            <Clock className="w-3 h-3" />{coach.experienceYears}y exp
          </span>
        )}
        {coach.hourlyRate !== undefined && (
          <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
            ${coach.hourlyRate}/hr
          </span>
        )}
        {coach.isAvailable ? (
          <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg ml-auto">
            <Check className="w-3 h-3" />Available
          </span>
        ) : (
          <span className="flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded-lg ml-auto">Busy</span>
        )}
      </div>

      {coach.bio && <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{coach.bio}</p>}

      <Button
        onClick={() => onSelect(coach)}
        size="sm"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        disabled={!coach.isAvailable}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Send Plan for Review
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AIWorkoutGeneratorContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // ── Form State ──────────────────────────────────────────────────────────────
  const [fitnessLevel, setFitnessLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [goal, setGoal] = useState<"Muscle" | "Strength" | "WeightLoss" | "Cardio" | "Endurance">("Muscle");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [injuries, setInjuries] = useState<string[]>([]);
  const [includeUserContext, setIncludeUserContext] = useState(true);
  const [configStep, setConfigStep] = useState<1 | 2 | 3>(1);

  // ── Generated Plan State ────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<AIWorkoutPlanResult | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<number | null>(null);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("draft");

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [selectedExercise, setSelectedExercise] = useState<AIExercise | null>(null);
  const [selectedDayForExercise, setSelectedDayForExercise] = useState<number | null>(null);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [injuryAdaptOpen, setInjuryAdaptOpen] = useState(false);
  const [isAdaptingPlan, setIsAdaptingPlan] = useState(false);

  // ── Coaches State ───────────────────────────────────────────────────────────
  const [coaches, setCoaches] = useState<CoachDto[]>([]);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
  const [showCoachesSection, setShowCoachesSection] = useState(false);

  // ── User Context State ──────────────────────────────────────────────────────
  const [strengthProfile, setStrengthProfile] = useState<UserStrengthProfileDto | null>(null);
  const [muscleScan, setMuscleScan] = useState<MuscleScanResultDto | null>(null);
  const [inbodyData, setInbodyData] = useState<InBodyMeasurementDto | null>(null);
  const [inbodyHistory, setInbodyHistory] = useState<InBodyMeasurementDto[]>([]);
  const [isLoadingInbodyStatus, setIsLoadingInbodyStatus] = useState(false);
  const [mlServiceHealthy, setMlServiceHealthy] = useState<boolean | null>(null);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await checkMLServiceHealth();
        setMlServiceHealthy(response.success);
      } catch {
        setMlServiceHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    loadInbodyStatus();
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    if (includeUserContext) loadUserContext();
    else { setStrengthProfile(null); setMuscleScan(null); }
  }, [user?.userId, includeUserContext]);

  // ── Data Loaders ─────────────────────────────────────────────────────────────
  const loadUserContext = async () => {
    if (!user) return;
    try {
      const [strengthRes, scanRes] = await Promise.all([getUserStrengthProfile(user.userId), getLatestMuscleScan(user.userId)]);
      if (strengthRes.success && strengthRes.data) setStrengthProfile(strengthRes.data);
      if (scanRes.success && scanRes.data) setMuscleScan(scanRes.data);
    } catch (error) {
      console.error("Failed to load user context:", error);
    }
  };

  const loadInbodyStatus = async () => {
    if (!user?.userId) return;
    setIsLoadingInbodyStatus(true);
    try {
      const inbodyRes = await inbodyApi.getUserMeasurements(user.userId);
      if (inbodyRes.success && inbodyRes.data && inbodyRes.data.length > 0) {
        const sorted = [...inbodyRes.data].sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime());
        setInbodyHistory(sorted);
        setInbodyData(sorted[0]);
      } else {
        setInbodyHistory([]);
        setInbodyData(null);
      }
    } catch (error) {
      console.error("Failed to load InBody measurements:", error);
      setInbodyHistory([]);
      setInbodyData(null);
    } finally {
      setIsLoadingInbodyStatus(false);
    }
  };

  const loadCoaches = async () => {
    setIsLoadingCoaches(true);
    try {
      const res = await usersApi.getCoachesWithProfiles();
      if (res.success && res.data) setCoaches(res.data);
    } catch (error) {
      console.error("Failed to load coaches:", error);
    } finally {
      setIsLoadingCoaches(false);
    }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────
  const inbodyGenerationStatus = useMemo(() => {
    if (isLoadingInbodyStatus) return { canGenerate: false, tone: "pending" as const, message: "Checking your latest InBody scan..." };
    if (!inbodyData) return { canGenerate: false, tone: "blocked" as const, message: "No InBody scan found. Please complete an InBody measurement before generating a workout plan." };
    if (!isInbodyComplete(inbodyData)) return { canGenerate: false, tone: "blocked" as const, message: "Your latest InBody data is incomplete. Please update weight, height, body fat, and muscle mass." };
    const inbodyAgeDays = getInbodyAgeInDays(inbodyData.measurementDate);
    if (inbodyAgeDays > MAX_INBODY_VALID_DAYS) return { canGenerate: false, tone: "blocked" as const, message: `Your InBody scan is ${inbodyAgeDays} days old. Please update it (max ${MAX_INBODY_VALID_DAYS} days).` };
    const previousMeasurement = inbodyHistory[1];
    if (previousMeasurement && areInbodyMeasurementsUnchanged(inbodyData, previousMeasurement)) return { canGenerate: false, tone: "blocked" as const, message: "Your latest InBody values are unchanged compared to the previous scan. Please update InBody before generating a new plan." };
    const inbodyAgeDays2 = getInbodyAgeInDays(inbodyData.measurementDate);
    return { canGenerate: true, tone: "ready" as const, message: `InBody is up to date (${inbodyAgeDays2} day${inbodyAgeDays2 === 1 ? "" : "s"} old).` };
  }, [isLoadingInbodyStatus, inbodyData, inbodyHistory]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleGeneratePlan = async () => {
    if (!user) { showToast("Please log in to generate a workout plan", "error"); return; }
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (!token) { showToast("⚠�? Authentication required. Please log in again.", "error", 6000); return; }
    if (user.tokenBalance !== undefined && user.tokenBalance < 50) { showToast("You need at least 50 tokens to generate an AI workout plan", "error"); return; }
    if (!inbodyGenerationStatus.canGenerate) {
      // Show warning but still allow generation — InBody enriches the plan but isn't required
      showToast(`⚠️ ${inbodyGenerationStatus.message} Generating with default parameters.`, "info", 5000);
    }

    setIsGenerating(true);
    try {
      const request: GenerateAIWorkoutPlanRequest = { userId: user.userId, fitnessLevel, goal, daysPerWeek, equipment, injuries, includeUserContext, forceRegenerate: false };
      const response = await generateAIWorkoutPlan(request);
      if (response.success && response.data) {
        setGeneratedPlan(response.data);
        setSelectedDay(0);
        setPlanStatus("draft");
        setSavedPlanId(null);
        setShowCoachesSection(true);
        loadCoaches();
        showToast(`${response.data.fromCache ? "Retrieved" : "Generated"} ${response.data.planName} in ${response.data.generationLatencyMs}ms!`, "success");
      } else {
        showToast(response.message || response.data?.errorMessage || "Failed to generate workout plan", "error", 8000);
      }
    } catch (error: any) {
      let errorMessage = "Failed to generate workout plan";
      if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        errorMessage = "🔒 Your session has expired. Please log in again.";
        setTimeout(() => { window.location.href = "/login"; }, 3000);
      } else if (error.message?.includes("Network error") || error.message?.includes("Cannot connect")) {
        errorMessage = "⚠�? Cannot connect to server. Please make sure the backend and ML service are running.";
      } else if (error.message?.includes("503") || error.message?.includes("Service Unavailable")) {
        errorMessage = "⚠�? ML service is currently unavailable. Please try again in a moment.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast(errorMessage, "error", 8000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInjuryAdapt = async (bodyPart: string, severity: InjurySeverity) => {
    if (!generatedPlan?.planData?.days) return;
    setIsAdaptingPlan(true);
    try {
      const updatedDays = generatedPlan.planData.days.map((day) => {
        if (!day.exercises || day.exercises.length === 0) return day;
        const affectedExercises = day.exercises.filter((ex) => exerciseAffectedByInjury(ex.name, ex.targetMuscles || [], bodyPart));
        if (affectedExercises.length === 0) return day;

        if (severity === "severe" && affectedExercises.length >= Math.ceil(day.exercises.length * 0.5)) {
          // Replace entire day with rest
          return { ...day, dayName: `${day.dayName} (Rest — Injury Recovery)`, exercises: [], isRestDay: true, notes: `Rest day due to ${bodyPart} injury (${severity}).` };
        }

        const updatedExercises = day.exercises.map((ex) => {
          if (!exerciseAffectedByInjury(ex.name, ex.targetMuscles || [], bodyPart)) return ex;
          if (severity === "mild") {
            return { ...ex, notes: `⚠�? ${bodyPart} injury: reduce weight by 30–40%, focus on form. Original: ${ex.sets} sets.`, sets: "2-3" };
          }
          return null; // remove for moderate/severe
        }).filter(Boolean) as AIExercise[];

        return { ...day, exercises: updatedExercises, notes: `Adapted for ${bodyPart} injury (${severity}).` };
      });

      const updatedPlan = { ...generatedPlan, planData: { ...generatedPlan.planData, days: updatedDays } };
      setGeneratedPlan(updatedPlan);
      setInjuryAdaptOpen(false);
      setShowCoachesSection(true);
      loadCoaches();
      showToast(`Plan adapted for ${bodyPart} injury (${severity}). We recommend sharing it with a coach for review.`, "success", 6000);
    } catch (error) {
      console.error("Error adapting plan:", error);
      showToast("Failed to adapt plan. Please try again.", "error");
    } finally {
      setIsAdaptingPlan(false);
    }
  };

  const handleSavePlan = async () => {
    if (!user || !generatedPlan) { showToast("No plan to save", "error"); return; }
    setIsSaving(true);
    try {
      const response = await saveAIWorkoutPlan({
        userId: user.userId,
        planName: generatedPlan.planName || "AI Generated Plan",
        fitnessLevel, goal, daysPerWeek,
        programDurationWeeks: generatedPlan.planData?.programDurationWeeks || 8,
        days: generatedPlan.planData?.days || [],
        notes: generatedPlan.planData?.notes,
        generationLatencyMs: generatedPlan.generationLatencyMs || 0,
        modelVersion: generatedPlan.modelVersion || "flan-t5-small",
        aiGenerated: true,
      });
      if (response.success && response.data?.planId) {
        setSavedPlanId(response.data.planId);
        showToast("Plan saved successfully! View it in your programs.", "success");
        if (generatedPlan.planData) {
          sessionStorage.setItem("pendingWorkoutPlan", JSON.stringify({
            planName: generatedPlan.planName,
            daysPerWeek,
            programDurationWeeks: generatedPlan.planData.programDurationWeeks || 8,
            fitnessLevel, goal,
            days: generatedPlan.planData.days?.map((d) => ({
              dayNumber: d.dayNumber, dayName: d.dayName,
              focusAreas: d.focusAreas || [d.focus || "General"],
              exercises: d.exercises,
              estimatedDurationMinutes: d.estimatedDurationMinutes || 60,
            })) || [],
          }));
        }
      } else {
        showToast(response.message || "Failed to save plan", "error");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      showToast("Failed to save plan. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWithCoach = async (coach?: CoachDto) => {
    if (!user || !generatedPlan) { showToast("No plan to share", "error"); return; }
    try {
      let planId = savedPlanId;
      if (!planId) {
        setIsSaving(true);
        const saveRes = await saveAIWorkoutPlan({
          userId: user.userId,
          planName: generatedPlan.planName || "AI Generated Plan",
          fitnessLevel, goal, daysPerWeek,
          programDurationWeeks: generatedPlan.planData?.programDurationWeeks || 8,
          days: generatedPlan.planData?.days || [],
          notes: generatedPlan.planData?.notes,
          generationLatencyMs: generatedPlan.generationLatencyMs || 0,
          modelVersion: generatedPlan.modelVersion || "flan-t5-small",
          aiGenerated: true,
        });
        setIsSaving(false);
        if (saveRes.success && saveRes.data?.planId) { planId = saveRes.data.planId; setSavedPlanId(planId); }
      }
      if (planId) {
        const shareRes = await sharePlanWithCoach({ planId });
        if (shareRes.success) {
          setPlanStatus("under_review");
          showToast(`Plan shared with ${coach ? coach.name : "your coach"} for review!`, "success");
        } else {
          showToast(shareRes.message || "Plan saved! Coach sharing will be available soon.", "info");
        }
      } else {
        showToast("Plan saved! Coach sharing will be available once approved.", "info");
      }
    } catch (error) {
      console.error("Error sharing plan:", error);
      showToast("Plan saved but sharing failed. You can share later from programs.", "info");
    }
  };

  const handleExerciseSubstitute = (newExerciseName: string) => {
    if (generatedPlan && selectedDayForExercise !== null && selectedExerciseIndex !== null) {
      const updatedPlan = { ...generatedPlan };
      if (updatedPlan.planData?.days) {
        const day = updatedPlan.planData.days[selectedDayForExercise];
        if (day?.exercises) {
          const current = day.exercises[selectedExerciseIndex];
          day.exercises[selectedExerciseIndex] = { ...current, name: newExerciseName, notes: `Substituted from: ${current.name}` };
        }
        setGeneratedPlan(updatedPlan);
        setSelectedExercise(null);
        setSelectedDayForExercise(null);
        setSelectedExerciseIndex(null);
        showToast(`Swapped to ${newExerciseName}!`, "success");
      }
    }
  };

  const handleLogWorkout = async () => {
    if (!user || !generatedPlan || !generatedPlan.planData?.days?.[selectedDay]) { showToast("No workout day to log", "error"); return; }
    setIsLoggingWorkout(true);
    try {
      const day = generatedPlan.planData.days[selectedDay];
      const logExercises: CreateLoggedExerciseDto[] = day.exercises?.map((ex, idx) => ({
        exerciseId: ex.exerciseId || idx + 1,
        sets: Array.from({ length: parseInt(ex.sets) || 0 }, (_, setIdx) => ({
          setNumber: setIdx + 1, reps: parseInt(ex.reps || "10") || 10, weight: ex.weightKg || 0,
        })),
      })) || [];
      const logData: CreateWorkoutLogDto = {
        memberPlanId: savedPlanId || undefined,
        workoutDate: new Date().toISOString(),
        durationMinutes: day.estimatedDurationMinutes || 60,
        notes: `AI Workout - ${day.dayName || `Day ${selectedDay + 1}`}`,
        exercises: logExercises,
      };
      const res = await workoutLogsApi.createWorkoutLog(logData);
      if (res.success) {
        showToast(`Workout logged! ${day.dayName || "Day " + (selectedDay + 1)} completed!`, "success");
      } else {
        showToast(res.message || "Workout logged locally. Sync when connected.", "info");
      }
    } catch (error) {
      console.error("Error logging workout:", error);
      showToast("Workout saved locally. Will sync when connected.", "info");
    } finally {
      setIsLoggingWorkout(false);
    }
  };

  const handleExerciseClick = (exercise: AIExercise, dayIndex: number, exerciseIndex: number) => {
    setSelectedExercise(exercise);
    setSelectedDayForExercise(dayIndex);
    setSelectedExerciseIndex(exerciseIndex);
  };

  const handleExerciseSave = (updatedExercise: AIExercise) => {
    if (generatedPlan && selectedDayForExercise !== null && selectedExerciseIndex !== null) {
      const updatedPlan = { ...generatedPlan };
      if (updatedPlan.planData?.days) {
        const day = updatedPlan.planData.days[selectedDayForExercise];
        if (day?.exercises) day.exercises[selectedExerciseIndex] = updatedExercise;
        setGeneratedPlan(updatedPlan);
        showToast("✅ Exercise updated successfully!", "success");
      }
    }
  };

  const toggleEquipment = (item: string) => setEquipment((prev) => prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]);
  const toggleInjury = (item: string) => setInjuries((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  // ── Plan Status Badge ─────────────────────────────────────────────────────────
  const STATUS_BADGE = {
    draft: { label: "Draft", classes: "bg-slate-100 text-slate-600 border-slate-300" },
    under_review: { label: "Under Review", classes: "bg-amber-100 text-amber-700 border-amber-300 animate-pulse" },
    approved: { label: "Approved", classes: "bg-green-100 text-green-700 border-green-300" },
  };

  // ?? Render ????????????????????????????????????????????????????????????????????
  return (
    <div className="min-h-screen">
      {/* Modals */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => { setSelectedExercise(null); setSelectedDayForExercise(null); setSelectedExerciseIndex(null); }}
          onSave={handleExerciseSave}
          onSubstitute={handleExerciseSubstitute}
          availableEquipment={equipment}
        />
      )}
      {injuryAdaptOpen && (
        <InjuryAdaptationModal
          onClose={() => setInjuryAdaptOpen(false)}
          onAdapt={(bp, sev) => { setInjuryAdaptOpen(false); handleInjuryAdapt(bp, sev); }}
          isLoading={isAdaptingPlan}
        />
      )}

      <div className="max-w-5xl mx-auto px-6 py-4">
        {!generatedPlan ? (

          /* PRE-GENERATION: Centered 3-Step Wizard */
          <div className="max-w-2xl mx-auto space-y-5">
            {!inbodyGenerationStatus.canGenerate && (
              <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">{inbodyGenerationStatus.message}</p>
                </div>
                <Link href="/inbody" className="text-xs font-semibold text-amber-700 bg-white border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-50 whitespace-nowrap">
                  Update InBody
                </Link>
              </div>
            )}

            <Card className="overflow-hidden shadow-lg border-0">
              {/* Step progress header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 pt-4 pb-3">
                <div className="flex items-center">
                  {([
                    { step: 1 as const, label: "Goal & Level" },
                    { step: 2 as const, label: "Training Setup" },
                    { step: 3 as const, label: "Generate" },
                  ] as Array<{ step: 1 | 2 | 3; label: string }>).map(({ step, label }, i) => (
                    <div key={step} className="flex items-center flex-1">
                      <button
                        onClick={() => configStep > step && setConfigStep(step)}
                        className={`flex flex-col items-center gap-1 mx-auto ${configStep > step ? "cursor-pointer opacity-90 hover:opacity-100" : "cursor-default"}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                          configStep === step ? "bg-white text-blue-700 border-white shadow-md" :
                          configStep > step ? "bg-white/30 text-white border-white/60" :
                          "bg-white/10 text-white/40 border-white/20"
                        }`}>
                          {configStep > step ? <Check className="w-4 h-4" /> : step}
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ${configStep === step ? "text-white" : "text-white/50"}`}>{label}</span>
                      </button>
                      {i < 2 && <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${configStep > step ? "bg-white/60" : "bg-white/20"}`} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5">
                {/* Step 1: Goal + Fitness Level */}
                {configStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        <Zap className="w-4 h-4 inline mr-1.5 mb-0.5 text-blue-500" />
                        Primary Goal
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {GOAL_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = goal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setGoal(opt.value as "Muscle" | "Strength" | "WeightLoss" | "Cardio" | "Endurance")}
                              className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? `border-transparent bg-gradient-to-r ${opt.color} text-white shadow-md`
                                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSelected ? "bg-white/20" : "bg-slate-100"}`}>
                                <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-600"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-xs leading-tight ${isSelected ? "text-white" : "text-slate-800"}`}>{opt.label}</p>
                                <p className={`text-[10px] mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400"}`}>{opt.desc}</p>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white absolute top-2 right-2 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      {goal === "Muscle" && inbodyData && (() => {
                        const heightM = inbodyData.height > 3 ? inbodyData.height / 100 : inbodyData.height;
                        const bmi = inbodyData.bmi || (heightM > 0 ? inbodyData.weight / (heightM * heightM) : 0);
                        if (bmi > 25) {
                          return (
                            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                              <span className="flex-1">BMI {bmi.toFixed(1)}: Consider Weight Loss first to improve joint health.</span>
                              <button onClick={() => setGoal("WeightLoss")} className="text-xs font-semibold text-amber-700 bg-white border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-50 whitespace-nowrap">Switch</button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        <Target className="w-4 h-4 inline mr-1.5 mb-0.5 text-blue-500" />
                        Fitness Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {FITNESS_LEVELS.map((lvl) => (
                          <button
                            key={lvl.value}
                            onClick={() => setFitnessLevel(lvl.value as "Beginner" | "Intermediate" | "Advanced")}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                              fitnessLevel === lvl.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 hover:border-blue-300 bg-white text-slate-700"
                            }`}
                          >
                            <span className="text-2xl">{lvl.emoji}</span>
                            <span className="font-semibold text-xs">{lvl.label}</span>
                            <span className="text-[10px] opacity-60">{lvl.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setConfigStep(2)}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      Next: Training Setup <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 2: Days + Equipment */}
                {configStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        <Calendar className="w-4 h-4 inline mr-1.5 mb-0.5 text-blue-500" />
                        Days Per Week
                      </label>
                      <div className="flex gap-2">
                        {[3, 4, 5, 6].map((d) => (
                          <button
                            key={d}
                            onClick={() => setDaysPerWeek(d)}
                            className={`flex-1 py-4 rounded-xl border-2 font-bold text-xl transition-all ${
                              daysPerWeek === d
                                ? "border-blue-500 bg-blue-600 text-white shadow-md"
                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 text-center">{daysPerWeek} training days per week</p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        <Dumbbell className="w-4 h-4 inline mr-1.5 mb-0.5 text-blue-500" />
                        Available Equipment
                        {equipment.length > 0 && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{equipment.length} selected</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map((opt) => {
                          const isSelected = equipment.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => toggleEquipment(opt.value)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                isSelected ? "border-green-500 bg-green-600 text-white shadow-sm" : `${opt.color} border`
                              }`}
                            >
                              <span>{opt.icon}</span>
                              {opt.value}
                              {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                      {equipment.length === 0 && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">Select at least one equipment option to continue.</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setConfigStep(1)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm">
                        ? Back
                      </button>
                      <button
                        onClick={() => setConfigStep(3)}
                        disabled={equipment.length === 0}
                        className="flex-[2] py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
                      >
                        Next: Finish Setup <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Injuries + Generate */}
                {configStep === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        <Heart className="w-4 h-4 inline mr-1.5 mb-0.5 text-red-500" />
                        Current Injuries
                        <span className="ml-1 text-xs text-slate-400 font-normal">(optional)</span>
                        {injuries.length > 0 && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{injuries.length}</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {INJURY_OPTIONS.map((opt) => {
                          const isSelected = injuries.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => toggleInjury(opt.value)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                isSelected
                                  ? "border-red-500 bg-red-600 text-white shadow-sm"
                                  : "border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100"
                              }`}
                            >
                              <span>{opt.emoji}</span>
                              {opt.value}
                              {isSelected && <X className="w-3 h-3 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                      {injuries.length > 0 && (
                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                          ?? AI will automatically avoid exercises that stress these areas.
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Your Plan Summary</p>
                      <div className="grid grid-cols-2 gap-2.5 text-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                          {(() => { const g = GOAL_OPTIONS.find((o) => o.value === goal); return g ? <g.icon className="w-4 h-4 text-blue-500 flex-shrink-0" /> : null; })()}
                          <span className="font-medium truncate">{GOAL_OPTIONS.find((o) => o.value === goal)?.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <span>{FITNESS_LEVELS.find((l) => l.value === fitnessLevel)?.emoji}</span>
                          <span>{fitnessLevel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span>{daysPerWeek} days / week</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Dumbbell className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span>{equipment.length} equipment types</span>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-100/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeUserContext}
                        onChange={(e) => setIncludeUserContext(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-700">Include strength profile &amp; muscle scan</span>
                        {(strengthProfile || muscleScan) && <span className="ml-2 text-xs text-blue-600 font-medium">&#10003; Data available</span>}
                      </div>
                    </label>

                    <div className="flex gap-3">
                      <button onClick={() => setConfigStep(2)} className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm">
                        ? Back
                      </button>
                      <button
                        onClick={handleGeneratePlan}
                        disabled={isGenerating || !mlServiceHealthy || equipment.length === 0 || !inbodyGenerationStatus.canGenerate}
                        className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        {isGenerating ? (
                          <><Loader2 className="w-5 h-5 animate-spin" />Generating...</>
                        ) : !inbodyGenerationStatus.canGenerate ? (
                          <><AlertCircle className="w-5 h-5" />Update InBody First</>
                        ) : (
                          <><Sparkles className="w-5 h-5" />Generate Workout Plan</>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-center text-slate-400">Costs 50 tokens � {user?.tokenBalance ?? 0} tokens available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

        ) : (

          /* POST-GENERATION: Full-Width Plan Display */
          <div className="space-y-5">

            {/* Plan Header Card */}
            <Card className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h2 className="text-xl font-bold">{generatedPlan.planName}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${STATUS_BADGE[planStatus].classes} bg-white/90`}>
                      {planStatus === "under_review" && "? "}
                      {planStatus === "approved" && "? "}
                      {planStatus === "draft" && "? "}
                      {STATUS_BADGE[planStatus].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm opacity-90 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{generatedPlan.planData?.days?.length} days</span>
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{goal}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{fitnessLevel}</span>
                    <span className="text-xs opacity-60">{generatedPlan.generationLatencyMs}ms � {generatedPlan.modelVersion}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => { setGeneratedPlan(null); setConfigStep(1); setPlanStatus("draft"); setSavedPlanId(null); setShowCoachesSection(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> New Plan
                  </button>
                  <button onClick={handleSavePlan} disabled={isSaving || !!savedPlanId} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-xs font-medium transition-all">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedPlanId ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-300" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Save</>}
                  </button>
                  <button onClick={() => handleShareWithCoach()} disabled={isSaving || planStatus === "under_review"} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-xs font-medium transition-all">
                    {planStatus === "under_review" ? <><Clock className="w-3.5 h-3.5" /> Reviewing</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
                  </button>
                  <button onClick={handleLogWorkout} disabled={isLoggingWorkout} className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-xs font-medium transition-all">
                    {isLoggingWorkout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ClipboardList className="w-3.5 h-3.5" /> Log</>}
                  </button>
                  {savedPlanId && (
                    <Link href="/programs">
                      <span className="flex items-center gap-1.5 px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all cursor-pointer">
                        <ArrowRight className="w-3.5 h-3.5" /> Programs
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </Card>

            {/* Injury Adapt Banner */}
            <div className="flex items-center gap-4 px-5 py-3.5 bg-orange-50 border border-orange-200 rounded-xl">
              <HeartPulse className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Have an injury or discomfort?</p>
                <p className="text-xs text-slate-500 mt-0.5">We can adapt your plan � swap or remove exercises based on injury severity.</p>
              </div>
              <button onClick={() => setInjuryAdaptOpen(true)} className="shrink-0 flex items-center gap-1.5 px-4 py-2 border border-orange-400 text-orange-700 hover:bg-orange-100 rounded-xl text-sm font-semibold transition-all">
                <ShieldAlert className="w-4 h-4" /> Adapt Plan
              </button>
            </div>

            {/* Day Sidebar + Exercise Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

              {/* Day Selector */}
              <div className="lg:col-span-1">
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 lg:sticky lg:top-20">
                  {generatedPlan.planData?.days?.map((day, index) => {
                    const isRest = (day as any).isRestDay || day.exercises?.length === 0;
                    const exerciseCount = day.exercises?.length || 0;
                    const duration = day.estimatedDurationMinutes;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDay(index)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border-2 flex-shrink-0 lg:flex-shrink ${
                          selectedDay === index
                            ? isRest
                              ? "border-slate-500 bg-slate-700 text-white shadow-md"
                              : "border-blue-500 bg-blue-600 text-white shadow-md"
                            : isRest
                              ? "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${selectedDay === index ? "bg-white/20" : "bg-slate-100"}`}>
                          {day.dayNumber || index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm leading-tight truncate">
                            {isRest ? "Rest Day" : (day.dayName || `Day ${index + 1}`).split("�")[0].trim()}
                          </div>
                          <div className={`text-xs mt-0.5 ${selectedDay === index ? "opacity-75" : "opacity-60"}`}>
                            {isRest ? "? Recovery" : `${exerciseCount} ex${duration ? ` � ${duration}m` : ""}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exercise Content */}
              <div className="lg:col-span-3">
                {generatedPlan.planData?.days?.[selectedDay] && (() => {
                  const day = generatedPlan.planData!.days![selectedDay];
                  const isRest = (day as any).isRestDay || day.exercises?.length === 0;
                  return (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{day.dayName || `Day ${selectedDay + 1}`}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {day.focus || day.focusAreas?.join(", ") || (isRest ? "Recovery" : "Training")}
                            {day.estimatedDurationMinutes && !isRest && ` � ${day.estimatedDurationMinutes} min`}
                          </p>
                        </div>
                        {isRest && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold whitespace-nowrap">
                            <BedDouble className="w-3.5 h-3.5" />Rest Day
                          </span>
                        )}
                      </div>

                      {isRest ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-2xl border border-slate-200">
                          <BedDouble className="w-14 h-14 text-slate-300 mb-3" />
                          <p className="font-semibold text-slate-500 text-lg">Rest &amp; Recovery Day</p>
                          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">{(day as any).notes || "Focus on sleep, hydration, and light stretching. Your muscles grow during rest."}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {day.exercises?.map((exercise, idx) => {
                            const eqStatus = getEquipmentStatus(exercise.equipment, equipment);
                            const injuryWarning = injuries.some((inj) => exerciseAffectedByInjury(exercise.name, exercise.targetMuscles || [], inj));
                            return (
                              <div
                                key={idx}
                                onClick={() => handleExerciseClick(exercise, selectedDay, idx)}
                                className={`group relative p-4 bg-white rounded-xl border-2 hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer ${
                                  injuryWarning ? "border-amber-300 bg-amber-50/20" : "border-slate-200 hover:border-blue-300"
                                }`}
                              >
                                {injuryWarning && (
                                  <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                    May affect injured area
                                  </div>
                                )}
                                <div className="flex items-start gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{exercise.name}</h4>
                                      <Eye className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {exercise.equipment && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${eqStatus.classes}`}>
                                          {eqStatus.status === "available" ? "? " : eqStatus.status === "unavailable" ? "? " : ""}{exercise.equipment}
                                        </span>
                                      )}
                                      {exercise.targetMuscles?.slice(0, 2).map((m, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 capitalize">{m}</span>
                                      ))}
                                      {exercise.targetMuscles && exercise.targetMuscles.length > 2 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">+{exercise.targetMuscles.length - 2}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 mt-3">
                                  {[
                                    { label: "Sets", val: exercise.sets },
                                    { label: "Reps", val: exercise.reps || "�" },
                                    { label: "Weight", val: exercise.weightKg ? `${exercise.weightKg}kg` : "�" },
                                    { label: "Rest", val: exercise.restSeconds ? `${exercise.restSeconds}s` : exercise.rest || "�" },
                                  ].map(({ label, val }) => (
                                    <div key={label} className="text-center p-2 bg-slate-50 rounded-lg">
                                      <div className="text-[9px] text-slate-400 uppercase tracking-wide">{label}</div>
                                      <div className="text-sm font-bold text-blue-600 mt-0.5">{val}</div>
                                    </div>
                                  ))}
                                </div>
                                {exercise.notes && (
                                  <p className="mt-2.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 line-clamp-1">
                                    ? {exercise.notes}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {generatedPlan.planData?.progressiveOverload && (
                        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                          <h4 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />Progressive Overload Strategy
                          </h4>
                          <div className="space-y-1 text-xs text-green-800">
                            {generatedPlan.planData.progressiveOverload.strategy && <p><span className="font-medium">Strategy:</span> {generatedPlan.planData.progressiveOverload.strategy}</p>}
                            {generatedPlan.planData.progressiveOverload.weeklyWeightIncreasePercent && <p><span className="font-medium">Weekly Increase:</span> {generatedPlan.planData.progressiveOverload.weeklyWeightIncreasePercent}%</p>}
                            {generatedPlan.planData.progressiveOverload.deloadSchedule && <p><span className="font-medium">Deload:</span> {generatedPlan.planData.progressiveOverload.deloadSchedule}</p>}
                          </div>
                        </Card>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Coaches Section */}
            {showCoachesSection && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-3 pt-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                    Available Coaches for Review
                  </h3>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <p className="text-sm text-slate-500 text-center">Share your plan with a certified coach to get expert feedback and approval.</p>
                {isLoadingCoaches ? (
                  <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />Loading available coaches...
                  </div>
                ) : coaches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coaches.map((coach) => (
                      <CoachCard key={coach.userId || coach.coachProfileId} coach={coach} onSelect={(c) => handleShareWithCoach(c)} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <User className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No coaches available right now</p>
                    <p className="text-sm text-slate-400 mt-1">Check back later or book a session directly.</p>
                    <Link href="/book-coach" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-blue-600 hover:underline">
                      Browse Coaches <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Card>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
export default function AIWorkoutGeneratorPage() {
  return (
    <ProtectedRoute>
      <SubscriptionGate>
        <AIWorkoutGeneratorContent />
      </SubscriptionGate>
    </ProtectedRoute>
  );
}
