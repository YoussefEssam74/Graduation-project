"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { milestonesApi, type UserMilestoneDto, statsApi, achievementsApi, type AchievementDto, type UserAchievementDto, workoutLogsApi, type WorkoutLogDto, apiFetch } from "@/lib/api";
import {
  Award,
  Trophy,
  Flame,
  CheckCircle,
  Loader2,
  Target,
  CoinsIcon,
  Lock,
  Dumbbell,
  Plus,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Progress } from "@/components/ui/progress";
import { UserRole } from "@/types/gym";

const RARITY_COLORS: Record<string, string> = {
  common: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  rare: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  epic: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  legendary: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
};

const CATEGORY_ICONS: Record<string, string> = {
  workout: "🏋️",
  nutrition: "🥗",
  consistency: "🔥",
  social: "👥",
  milestone: "🏆",
};

interface ExerciseItem { exerciseId: number; name: string; targetMuscleGroup?: string; }

function AchievementsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [milestones, setMilestones] = useState<UserMilestoneDto[]>([]);
  const [allAchievements, setAllAchievements] = useState<AchievementDto[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievementDto[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [activeTab, setActiveTab] = useState<"achievements" | "milestones" | "progress">("achievements");

  // Progress tab state
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogDto[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFetched, setLogsFetched] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseList, setExerciseList] = useState<ExerciseItem[]>([]);
  const [exerciseListLoading, setExerciseListLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [quickLogSets, setQuickLogSets] = useState([{ reps: 10, weight: 20 }]);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;

      try {
        const [milestonesRes, statsRes, allAchRes, myAchRes] = await Promise.all([
          milestonesApi.getUserMilestones(user.userId),
          statsApi.getMemberStats(user.userId),
          achievementsApi.getAllAchievements(),
          achievementsApi.getMyAchievements(),
        ]);

        if (milestonesRes.success && milestonesRes.data) setMilestones(milestonesRes.data);
        if (statsRes.success && statsRes.data) setTotalWorkouts(statsRes.data.totalWorkoutsCompleted);
        if (allAchRes.success && allAchRes.data) setAllAchievements(allAchRes.data);
        if (myAchRes.success && myAchRes.data) setUserAchievements(myAchRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showToast("Failed to load achievements", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, showToast]);

  const completedMilestones = milestones.filter((m) => m.isCompleted);
  const inProgressMilestones = milestones.filter((m) => !m.isCompleted);

  const earnedAchievementIds = new Set(userAchievements.filter(ua => ua.isEarned).map(ua => ua.achievementId));
  const earnedCount = earnedAchievementIds.size;
  const tokenEarned = userAchievements
    .filter(ua => ua.isEarned)
    .reduce((sum, ua) => sum + (ua.achievement?.tokenReward ?? 0), 0);

  // Calculate progress percentage
  const getProgressPercentage = (milestone: UserMilestoneDto) => {
    if (!milestone.milestoneTarget || milestone.milestoneTarget === 0) return 0;
    return Math.min(100, Math.round((milestone.currentProgress / milestone.milestoneTarget) * 100));
  };

  // Exercise PRs derived from workout logs
  const exercisePRs = useMemo(() => {
    const prMap = new Map<string, { exerciseId: number; name: string; maxWeight: number; bestReps: number; date: string }>();
    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex) => {
        ex.sets?.forEach((set) => {
          const existing = prMap.get(ex.exerciseName);
          if (!existing || set.weight > existing.maxWeight) {
            prMap.set(ex.exerciseName, { exerciseId: ex.exerciseId, name: ex.exerciseName, maxWeight: set.weight, bestReps: set.reps, date: log.workoutDate });
          }
        });
      });
    });
    return Array.from(prMap.values()).sort((a, b) => b.maxWeight - a.maxWeight);
  }, [workoutLogs]);

  const getExerciseHistory = (exerciseName: string) =>
    workoutLogs
      .filter((log) => log.exercises?.some((e) => e.exerciseName === exerciseName))
      .map((log) => {
        const ex = log.exercises.find((e) => e.exerciseName === exerciseName)!;
        const maxW = Math.max(...ex.sets.map((s) => s.weight));
        return { date: log.workoutDate, maxWeight: maxW, sets: ex.sets.length };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleProgressTabClick = async () => {
    setActiveTab("progress");
    if (!logsFetched && user?.userId) {
      setLogsLoading(true);
      try {
        const res = await workoutLogsApi.getUserWorkoutLogs(user.userId);
        if (res.success && res.data) setWorkoutLogs(res.data);
      } finally { setLogsLoading(false); setLogsFetched(true); }
    }
  };

  const handleOpenQuickLog = async () => {
    setShowQuickLog(true);
    if (exerciseList.length === 0) {
      setExerciseListLoading(true);
      try {
        const res = await apiFetch<ExerciseItem[]>('/exercises/active');
        if (res.success && res.data) setExerciseList(res.data);
      } finally { setExerciseListLoading(false); }
    }
  };

  const handleSubmitQuickLog = async () => {
    if (!selectedExercise || !user?.userId) return;
    setIsSubmittingLog(true);
    try {
      const res = await workoutLogsApi.createWorkoutLog({
        workoutDate: new Date().toISOString(),
        durationMinutes: 0,
        exercises: [{ exerciseId: selectedExercise.exerciseId, sets: quickLogSets.map((s, i) => ({ setNumber: i + 1, reps: s.reps, weight: s.weight })) }],
      });
      if (res.success) {
        showToast("Workout logged! Keep it up! 💪", "success");
        setShowQuickLog(false); setSelectedExercise(null);
        setQuickLogSets([{ reps: 10, weight: 20 }]); setExerciseSearch("");
        const logsRes = await workoutLogsApi.getUserWorkoutLogs(user.userId);
        if (logsRes.success && logsRes.data) setWorkoutLogs(logsRes.data);
      }
    } catch { showToast("Failed to log workout", "error"); }
    finally { setIsSubmittingLog(false); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Your Achievements</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Unlock achievements and earn token rewards
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{earnedCount} / {allAchievements.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Achievements Earned</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <CoinsIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{tokenEarned}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tokens Earned</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Flame className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{totalWorkouts}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Workouts Done</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "achievements"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            🏆 Achievements
          </button>
          <button
            onClick={() => setActiveTab("milestones")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "milestones"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            🎯 Milestones
          </button>
          <button
            onClick={handleProgressTabClick}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "progress"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            💪 Progress
          </button>
        </div>

        {activeTab === "achievements" && (
          <div>
            {allAchievements.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                <Award className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Achievements Available</h3>
                <p className="text-slate-500 dark:text-slate-400">Achievements will appear here once added by the admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAchievements.map((ach) => {
                  const isEarned = earnedAchievementIds.has(ach.achievementId);
                  const ua = userAchievements.find(u => u.achievementId === ach.achievementId);
                  return (
                    <div
                      key={ach.achievementId}
                      className={`relative bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border transition-all ${
                        isEarned
                          ? "border-green-200 dark:border-green-800"
                          : "border-slate-100 dark:border-slate-700 opacity-70"
                      }`}
                    >
                      {isEarned && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                      {!isEarned && (
                        <div className="absolute top-3 right-3">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                      )}

                      <div className="text-3xl mb-3">
                        {ach.iconUrl || CATEGORY_ICONS[ach.category] || "🏅"}
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{ach.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RARITY_COLORS[ach.rarity] ?? RARITY_COLORS.common}`}>
                          {ach.rarity}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{ach.description}</p>

                      <div className="flex items-center gap-3 text-xs">
                        {ach.tokenReward > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                            <CoinsIcon size={12} />
                            +{ach.tokenReward}
                          </span>
                        )}
                        {isEarned && ua?.earnedAt && (
                          <span className="text-green-600 font-medium">
                            {new Date(ua.earnedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "milestones" && (milestones.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-700">
            <Award className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Milestones Yet</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Start working out and you&apos;ll unlock achievements!
            </p>
          </div>
        ) : (
          <div>
          {/* Completed Milestones */}
            {completedMilestones.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Completed ({completedMilestones.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedMilestones.map((milestone) => (
                    <div
                      key={milestone.userMilestoneId}
                      className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-green-100 dark:border-green-900/50 relative overflow-hidden"
                    >
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                        {milestone.milestoneName || `Milestone #${milestone.milestoneId}`}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        {milestone.milestoneDescription || 'Achievement unlocked!'}
                      </p>
                      {milestone.completedAt && (
                        <p className="text-xs text-green-600 font-semibold">
                          Completed {new Date(milestone.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Milestones */}
            {inProgressMilestones.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  In Progress ({inProgressMilestones.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressMilestones.map((milestone) => {
                    const progress = getProgressPercentage(milestone);
                    return (
                      <div
                        key={milestone.userMilestoneId}
                        className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
                      >
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                          <Award className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                          {milestone.milestoneName || `Milestone #${milestone.milestoneId}`}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          {milestone.milestoneDescription || 'Keep going!'}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>{milestone.currentProgress} / {milestone.milestoneTarget || '?'}</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          )
        )}

        {activeTab === "progress" && (
          <div className="space-y-6">
            {/* Quick Log Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Exercise Progress</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track your personal records and strength gains</p>
              </div>
              <button
                onClick={handleOpenQuickLog}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" />
                Quick Log
              </button>
            </div>

            {/* Quick Log Form */}
            {showQuickLog && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-blue-600" />
                    Log a Workout Set
                  </h3>
                  <button title="Close" onClick={() => { setShowQuickLog(false); setSelectedExercise(null); setExerciseSearch(""); }} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Exercise Search */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Exercise</label>
                  {exerciseListLoading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading exercises...
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search exercises..."
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {exerciseSearch && (
                        <div className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                          {exerciseList
                            .filter((e) => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                            .slice(0, 10)
                            .map((e) => (
                              <button
                                key={e.exerciseId}
                                onClick={() => { setSelectedExercise(e); setExerciseSearch(e.name); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                              >
                                <span className="font-medium">{e.name}</span>
                                {e.targetMuscleGroup && <span className="text-xs text-slate-400 ml-2">{e.targetMuscleGroup}</span>}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedExercise && (
                    <p className="text-xs text-blue-600 font-medium mt-1">✓ {selectedExercise.name} selected</p>
                  )}
                </div>

                {/* Sets */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">Sets</label>
                  <div className="space-y-2">
                    {quickLogSets.map((set, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-8 text-center font-medium">#{i + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Reps</label>
                          <input
                            type="number"
                            min={1}
                            title="Reps"
                            placeholder="10"
                            value={set.reps}
                            onChange={(e) => {
                              const updated = [...quickLogSets];
                              updated[i] = { ...updated[i], reps: Number(e.target.value) };
                              setQuickLogSets(updated);
                            }}
                            className="w-16 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">kg</label>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            title="Weight (kg)"
                            placeholder="20"
                            value={set.weight}
                            onChange={(e) => {
                              const updated = [...quickLogSets];
                              updated[i] = { ...updated[i], weight: Number(e.target.value) };
                              setQuickLogSets(updated);
                            }}
                            className="w-20 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {quickLogSets.length > 1 && (
                          <button title="Remove set" onClick={() => setQuickLogSets(quickLogSets.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setQuickLogSets([...quickLogSets, { reps: 10, weight: 20 }])}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Set
                  </button>
                </div>

                <button
                  onClick={handleSubmitQuickLog}
                  disabled={!selectedExercise || isSubmittingLog}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmittingLog ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Workout"}
                </button>
              </div>
            )}

            {/* PR Grid / Loading / Empty */}
            {logsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : exercisePRs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                <Dumbbell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No workout history yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">Log your first workout to start tracking personal records!</p>
                <button onClick={handleOpenQuickLog} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Log First Workout
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Records</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">({exercisePRs.length} exercises)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exercisePRs.map((pr, idx) => {
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                    const isExpanded = expandedExercise === pr.name;
                    const history = isExpanded ? getExerciseHistory(pr.name) : [];
                    return (
                      <div key={pr.name} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <button
                          className="w-full text-left p-5"
                          onClick={() => setExpandedExercise(isExpanded ? null : pr.name)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {medal && <span className="text-lg">{medal}</span>}
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{pr.name}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="text-blue-600 font-bold text-base">{pr.maxWeight} kg</span>
                                <span>× {pr.bestReps} reps</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{new Date(pr.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-slate-400 mt-1">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </button>
                        {isExpanded && history.length > 0 && (
                          <div className="border-t border-slate-100 dark:border-slate-700 px-5 pb-4 pt-3">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">History</p>
                            <div className="space-y-2">
                              {history.map((h, hi) => (
                                <div key={hi} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 dark:text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-900 dark:text-white">{h.maxWeight} kg</span>
                                    <span className="text-slate-400">{h.sets} sets</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <AchievementsContent />
    </ProtectedRoute>
  );
}
