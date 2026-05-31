"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  inbodyApi,
  workoutLogsApi,
  usersApi,
  type InBodyMeasurementDto,
  type WorkoutLogDto,
  type UserAIContextDto,
  type CoachClientDto,
} from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Dumbbell,
  Flame,
  Scale,
  Percent,
  Zap,
  Loader2,
  Mail,
  Phone,
  Calendar,
  User,
  AlertCircle,
  Heart,
  FileText,
} from "lucide-react";

interface ClientProgressModalProps {
  client: CoachClientDto;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (userId: number, userName: string) => void;
}

export function ClientProgressModal({
  client,
  isOpen,
  onClose,
  onOpenChat,
}: ClientProgressModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [aiContext, setAiContext] = useState<UserAIContextDto | null>(null);
  const [measurements, setMeasurements] = useState<InBodyMeasurementDto[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogDto[]>([]);

  useEffect(() => {
    if (!isOpen || !client.userId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [contextRes, measurementsRes, logsRes] = await Promise.all([
          usersApi.getUserAIContext(client.userId),
          inbodyApi.getUserMeasurements(client.userId),
          workoutLogsApi.getUserWorkoutLogs(client.userId),
        ]);

        if (contextRes.success && contextRes.data) {
          setAiContext(contextRes.data);
        }
        if (measurementsRes.success && measurementsRes.data) {
          setMeasurements(measurementsRes.data);
        }
        if (logsRes.success && logsRes.data) {
          setWorkoutLogs(logsRes.data);
        }
      } catch (error) {
        console.error("Failed to load client details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [client.userId, isOpen]);

  // Calculations for display
  const weightChange = () => {
    if (measurements.length < 2) return null;
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];
    const diff = latest.weight - previous.weight;
    return {
      current: latest.weight,
      change: diff,
      isLoss: diff < 0,
    };
  };

  const bodyFatChange = () => {
    if (measurements.length < 2) return null;
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];
    if (latest.bodyFatPercentage === undefined || previous.bodyFatPercentage === undefined) return null;
    const diff = latest.bodyFatPercentage - previous.bodyFatPercentage;
    return {
      current: latest.bodyFatPercentage,
      change: diff,
      isLoss: diff < 0,
    };
  };

  const totalCaloriesBurned = workoutLogs.reduce(
    (sum, log) => sum + (log.caloriesBurned || 0),
    0
  );

  const stats = weightChange();
  const fatStats = bodyFatChange();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {client.name.charAt(0)}
              </div>
              <div className="text-center sm:text-left">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {client.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center sm:justify-start">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {client.membershipType || "Member"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Joined: {new Date(client.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChat(client.userId, client.name)}
              >
                Send Message
              </Button>
              <Button variant="default" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-muted-foreground text-sm font-medium">
              Loading client records...
            </span>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full mt-4">
            <TabsList className="grid grid-cols-3 bg-muted p-1 rounded-lg">
              <TabsTrigger value="overview">Overview & Health</TabsTrigger>
              <TabsTrigger value="composition">Body Composition</TabsTrigger>
              <TabsTrigger value="workouts">Workout History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Client Contact Info */}
                <Card className="p-5 border border-border space-y-4">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Contact Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{client.phone || "No phone number"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Joined {new Date(client.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>

                {/* Fitness Goals */}
                <Card className="p-5 border border-border space-y-4">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Fitness Goal & Level
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground block">Fitness Goal</span>
                      <span className="font-semibold text-foreground capitalize">
                        {aiContext?.metrics?.fitnessGoal?.replace(/([A-Z])/g, " $1").trim() || "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Fitness Level</span>
                      <span className="font-semibold text-foreground capitalize">
                        {aiContext?.metrics?.fitnessLevel || "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Target Weight</span>
                      <span className="font-semibold text-foreground">
                        {aiContext?.metrics?.targetWeight ? `${aiContext.metrics.targetWeight} kg` : "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Age</span>
                      <span className="font-semibold text-foreground">
                        {aiContext?.metrics?.age ? `${aiContext.metrics.age} years` : "N/A"}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Medical Conditions & Allergies */}
              <Card className="p-5 border border-border space-y-4">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" /> Health Conditions & Dietary Preferences
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-500" /> Medical / Health Issues
                    </span>
                    <div className="p-3 bg-muted/50 rounded-lg min-h-[80px] text-sm text-foreground">
                      {aiContext?.healthConditions && aiContext.healthConditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {aiContext.healthConditions.map((condition, idx) => (
                            <span key={idx} className="bg-red-500/10 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">
                              {condition}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">No health issues reported.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-green-500" /> Allergies & Dietary Preferences
                    </span>
                    <div className="p-3 bg-muted/50 rounded-lg min-h-[80px] text-sm text-foreground">
                      {aiContext?.dietaryPreferences && aiContext.dietaryPreferences.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {aiContext.dietaryPreferences.map((pref, idx) => (
                            <span key={idx} className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-xs font-semibold">
                              {pref}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">No allergies reported.</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Body Composition Tab */}
            <TabsContent value="composition" className="space-y-6 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Weight Card */}
                <Card className="p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Current Weight</span>
                    <Scale className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-black text-foreground">
                    {stats?.current ? `${stats.current} kg` : "N/A"}
                  </div>
                  {stats && (
                    <div
                      className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                        stats.isLoss ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {stats.isLoss ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                      <span>
                        {Math.abs(stats.change).toFixed(1)} kg ({stats.isLoss ? "Lost" : "Gained"})
                      </span>
                    </div>
                  )}
                </Card>

                {/* Body Fat Card */}
                <Card className="p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Body Fat</span>
                    <Percent className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-black text-foreground">
                    {fatStats?.current ? `${fatStats.current}%` : "N/A"}
                  </div>
                  {fatStats && (
                    <div
                      className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                        fatStats.isLoss ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {fatStats.isLoss ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                      <span>
                        {Math.abs(fatStats.change).toFixed(1)}% ({fatStats.isLoss ? "Reduced" : "Increased"})
                      </span>
                    </div>
                  )}
                </Card>

                {/* BMI Card */}
                <Card className="p-5 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">BMI Score</span>
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-black text-foreground">
                    {aiContext?.metrics?.bmi ? aiContext.metrics.bmi.toFixed(1) : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {aiContext?.metrics?.bmi && (
                      aiContext.metrics.bmi < 18.5
                        ? "Underweight"
                        : aiContext.metrics.bmi < 25
                        ? "Normal Range"
                        : aiContext.metrics.bmi < 30
                        ? "Overweight"
                        : "Obese"
                    )}
                  </div>
                </Card>
              </div>

              {/* InBody Scan History Table */}
              <Card className="p-6 border border-border bg-card/50">
                <h3 className="font-bold text-lg text-foreground mb-4">
                  InBody Scan History
                </h3>
                {measurements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm italic">
                    No InBody measurements recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-medium text-left">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-right">Weight</th>
                          <th className="py-2 px-3 text-right">Height</th>
                          <th className="py-2 px-3 text-right">Body Fat %</th>
                          <th className="py-2 px-3 text-right">Muscle Mass</th>
                          <th className="py-2 px-3 text-right">BMR (kcal)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measurements.map((m) => (
                          <tr
                            key={m.measurementId}
                            className="border-b border-border/50 hover:bg-muted/30 text-foreground"
                          >
                            <td className="py-2.5 px-3">
                              {new Date(m.measurementDate).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium">{m.weight} kg</td>
                            <td className="py-2.5 px-3 text-right">{m.height} cm</td>
                            <td className="py-2.5 px-3 text-right">{m.bodyFatPercentage ?? "--"}%</td>
                            <td className="py-2.5 px-3 text-right">{m.muscleMass ?? "--"} kg</td>
                            <td className="py-2.5 px-3 text-right">{m.bmr ?? "--"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Workout History Tab */}
            <TabsContent value="workouts" className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-5 border border-border text-center">
                  <Dumbbell className="h-6 w-6 text-primary mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground block">Total Workouts Completed</span>
                  <span className="text-3xl font-black text-foreground">{workoutLogs.length}</span>
                </Card>
                <Card className="p-5 border border-border text-center">
                  <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground block">Total Calories Burned</span>
                  <span className="text-3xl font-black text-foreground">
                    {totalCaloriesBurned.toLocaleString()} kcal
                  </span>
                </Card>
              </div>

              {/* Workouts List */}
              <Card className="p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4">
                  Workout Log Entries
                </h3>
                {workoutLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm italic">
                    No logged workouts found for this member.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workoutLogs.map((log) => (
                      <div
                        key={log.logId}
                        className="flex items-center justify-between p-4 bg-muted/40 border border-border/80 rounded-xl hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-sm">
                              {log.planName || "Custom Workout"}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {new Date(log.workoutDate).toLocaleDateString()}
                              </span>
                              <span>{log.durationMinutes} min duration</span>
                              {log.caloriesBurned && (
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                                  {log.caloriesBurned} kcal burned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.feelingRating && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-500/10 text-green-600">
                              Feeling: {log.feelingRating}/5
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground bg-muted border border-border/80 px-2 py-0.5 rounded">
                            {log.exercises?.length || 0} exercises
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
