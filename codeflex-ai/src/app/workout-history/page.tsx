"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { workoutLogsApi, type WorkoutLogDto } from "@/lib/api";
import {
  Dumbbell,
  Calendar,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  Search,
  Target,
  Trash2,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function WorkoutHistoryContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogDto[]>([]);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "week" | "month" | "year">("all");
  const [selectedLog, setSelectedLog] = useState<WorkoutLogDto | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.userId) return;

      try {
        const response = await workoutLogsApi.getUserWorkoutLogs(user.userId);
        if (response.success && response.data) {
          setWorkoutLogs(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch workout logs:", error);
        showToast("Failed to load workout history", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [user?.userId, showToast]);

  // Filter and search
  const filteredLogs = workoutLogs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const logDate = new Date(log.workoutDate);
    const now = new Date();
    let matchesPeriod = true;

    if (filterPeriod === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesPeriod = logDate >= weekAgo;
    } else if (filterPeriod === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesPeriod = logDate >= monthAgo;
    } else if (filterPeriod === "year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      matchesPeriod = logDate >= yearAgo;
    }

    return matchesSearch && matchesPeriod;
  });

  // Calculate stats
  const totalWorkouts = workoutLogs.length;
  const totalDuration = workoutLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
  const totalCalories = workoutLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

  const handleDeleteLog = async (logId: number) => {
    setIsDeleting(true);
    try {
      const response = await workoutLogsApi.deleteWorkoutLog(logId);
      if (response.success) {
        setWorkoutLogs((prev) => prev.filter((log) => log.logId !== logId));
        showToast("Workout log deleted", "success");
        setShowDetailsModal(false);
      } else {
        showToast(response.message || "Failed to delete", "error");
      }
    } catch (error) {
      showToast("Failed to delete workout log", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">
          <span className="text-foreground">Workout </span>
          <span className="text-primary">History</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all your completed workouts and progress
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Dumbbell className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">Total Workouts</span>
          </div>
          <div className="text-3xl font-bold">{totalWorkouts}</div>
        </Card>

        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">Total Time</span>
          </div>
          <div className="text-3xl font-bold">{Math.round(totalDuration / 60)}h</div>
          <div className="text-xs text-muted-foreground">{totalDuration} mins</div>
        </Card>

        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Flame className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-sm text-muted-foreground">Calories Burned</span>
          </div>
          <div className="text-3xl font-bold">{totalCalories.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">kcal</div>
        </Card>

        <Card className="p-5 border border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <span className="text-sm text-muted-foreground">Avg Duration</span>
          </div>
          <div className="text-3xl font-bold">{avgDuration}</div>
          <div className="text-xs text-muted-foreground">mins/workout</div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "week", "month", "year"] as const).map((period) => (
            <Button
              key={period}
              variant={filterPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPeriod(period)}
            >
              {period === "all" ? "All Time" : period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Workout List */}
      {filteredLogs.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card/50">
          <Dumbbell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Workouts Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterPeriod !== "all"
              ? "Try adjusting your search or filters"
              : "Complete a workout to see it here"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card
              key={log.logId}
              className="border border-border bg-card/50 overflow-hidden"
            >
              {/* Log Header */}
              <div
                className="p-5 cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => setExpandedLog(expandedLog === log.logId ? null : log.logId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {log.planName || "Custom Workout"}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(log.workoutDate).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {log.durationMinutes} min
                        </span>
                        {log.caloriesBurned && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5" />
                            {log.caloriesBurned} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-medium">
                        {log.exercises?.length || 0} exercises
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.exercises?.reduce((sum, e) => sum + (e.sets?.length || 0), 0) || 0} sets
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {expandedLog === log.logId ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedLog === log.logId && (
                <div className="border-t border-border px-5 py-4 bg-primary/5">
                  {log.notes && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Notes: </span>
                      <span className="text-sm">{log.notes}</span>
                    </div>
                  )}

                  {log.exercises && log.exercises.length > 0 ? (
                    <div className="space-y-3">
                      {log.exercises.map((exercise, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-background rounded-lg border border-border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{exercise.exerciseName}</h4>
                            <span className="text-sm text-muted-foreground">
                              {exercise.sets?.length || 0} sets
                            </span>
                          </div>
                          {exercise.sets && exercise.sets.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-muted-foreground font-medium">Set</div>
                              <div className="text-muted-foreground font-medium">Weight</div>
                              <div className="text-muted-foreground font-medium">Reps</div>
                              {exercise.sets.map((set, setIdx) => (
                                <>
                                  <div key={`set-${setIdx}`}>{setIdx + 1}</div>
                                  <div key={`weight-${setIdx}`}>
                                    {set.weight ? `${set.weight} kg` : "-"}
                                  </div>
                                  <div key={`reps-${setIdx}`}>{set.reps || "-"}</div>
                                </>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No exercises logged
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              {selectedLog?.planName || "Custom Workout"}
            </DialogTitle>
            <DialogDescription>
              {selectedLog &&
                new Date(selectedLog.workoutDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 mt-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-lg font-bold">{selectedLog.durationMinutes}</div>
                  <div className="text-xs text-muted-foreground">minutes</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-lg font-bold">{selectedLog.caloriesBurned || 0}</div>
                  <div className="text-xs text-muted-foreground">calories</div>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-lg font-bold">{selectedLog.exercises?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">exercises</div>
                </div>
              </div>

              {/* Notes */}
              {selectedLog.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedLog.notes}</p>
                </div>
              )}

              {/* Exercises */}
              {selectedLog.exercises && selectedLog.exercises.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Exercises</h4>
                  <div className="space-y-3">
                    {selectedLog.exercises.map((exercise, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-lg">
                        <h5 className="font-medium mb-2">{exercise.exerciseName}</h5>
                        {exercise.sets && exercise.sets.length > 0 && (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left py-1">Set</th>
                                <th className="text-right py-1">Weight</th>
                                <th className="text-right py-1">Reps</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercise.sets.map((set, setIdx) => (
                                <tr key={setIdx}>
                                  <td className="py-1">{setIdx + 1}</td>
                                  <td className="text-right py-1">
                                    {set.weight ? `${set.weight} kg` : "-"}
                                  </td>
                                  <td className="text-right py-1">{set.reps || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="destructive"
              onClick={() => selectedLog && handleDeleteLog(selectedLog.logId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Log
            </Button>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WorkoutHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <WorkoutHistoryContent />
    </ProtectedRoute>
  );
}
