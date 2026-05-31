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
import { Progress } from "@/components/ui/progress";
import {
  getUserAIPlans,
  nutritionPlansApi,
  type UserAIWorkoutPlan,
  type NutritionPlanDto,
  type CoachClientDto,
} from "@/lib/api";
import { type NutritionMLResponse, type NutritionMLPlanDay } from "@/lib/api/nutritionMLService";
import {
  Dumbbell,
  Utensils,
  Flame,
  Scale,
  Sparkles,
  Clock,
  Activity,
  AlertCircle,
  Calendar,
  Loader2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface ClientPlansProgressModalProps {
  client: CoachClientDto;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientPlansProgressModal({
  client,
  isOpen,
  onClose,
}: ClientPlansProgressModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [workoutPlans, setWorkoutPlans] = useState<UserAIWorkoutPlan[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanDto[]>([]);
  
  // Selected Plan States
  const [activeWorkout, setActiveWorkout] = useState<UserAIWorkoutPlan | null>(null);
  const [activeNutrition, setActiveNutrition] = useState<NutritionPlanDto | null>(null);
  const [parsedNutritionJson, setParsedNutritionJson] = useState<NutritionMLResponse | null>(null);
  
  // Day selection states
  const [selectedNutritionDay, setSelectedNutritionDay] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !client.userId) return;

    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const [workoutRes, nutritionRes] = await Promise.all([
          getUserAIPlans(client.userId),
          nutritionPlansApi.getMemberPlans(client.userId),
        ]);

        if (workoutRes.success && workoutRes.data) {
          setWorkoutPlans(workoutRes.data);
          // Find active, fallback to latest
          const active = workoutRes.data.find(p => p.isActive) || workoutRes.data[0] || null;
          setActiveWorkout(active);
        }

        if (nutritionRes.success && nutritionRes.data) {
          setNutritionPlans(nutritionRes.data);
          // Find active, fallback to latest
          const active = nutritionRes.data.find(p => p.isActive) || nutritionRes.data[0] || null;
          setActiveNutrition(active);
          
          if (active && active.aiPlanJson) {
            try {
              setParsedNutritionJson(JSON.parse(active.aiPlanJson));
            } catch (e) {
              console.error("Failed to parse nutrition plan JSON:", e);
              setParsedNutritionJson(null);
            }
          } else {
            setParsedNutritionJson(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch client plans:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [client.userId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-xl shadow-md">
                {client.name.charAt(0)}
              </div>
              <div className="text-center sm:text-left">
                <DialogTitle className="text-xl font-bold text-foreground">
                  Active Plans Tracker: {client.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track and review {client.name}'s currently assigned fitness and diet plans
                </p>
              </div>
            </div>
            <Button variant="default" size="sm" onClick={onClose}>
              Close Tracker
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-muted-foreground text-sm font-medium">
              Loading active workout and diet plans...
            </span>
          </div>
        ) : (
          <Tabs defaultValue="workoutPlan" className="w-full mt-4">
            <TabsList className="grid grid-cols-2 bg-muted p-1 rounded-lg">
              <TabsTrigger value="workoutPlan" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Active Workout Plan
              </TabsTrigger>
              <TabsTrigger value="nutritionPlan" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Active Nutrition Plan
              </TabsTrigger>
            </TabsList>

            {/* WORKOUT PLAN TAB */}
            <TabsContent value="workoutPlan" className="space-y-6 mt-4">
              {!activeWorkout ? (
                <Card className="p-12 border border-dashed border-border text-center space-y-4">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <h3 className="text-lg font-bold text-foreground">No Workout Plan Assigned</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    This client does not have an active or approved workout plan. You can generate or approve a plan in the Programs tab.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Plan Overview Card */}
                  <Card className="p-5 border border-border bg-gradient-to-br from-primary/5 via-card to-card">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-foreground">
                            {activeWorkout.planName}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                            Active
                          </span>
                        </div>
                        {activeWorkout.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeWorkout.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Generated via <span className="font-semibold text-foreground">{activeWorkout.modelVersion || "AI Model"}</span> • Created: {new Date(activeWorkout.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center border-l border-border pl-0 md:pl-6">
                        <div className="px-2">
                          <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Goal</span>
                          <span className="text-sm font-bold text-foreground capitalize">
                            {activeWorkout.goal || "Muscle"}
                          </span>
                        </div>
                        <div className="px-2">
                          <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Level</span>
                          <span className="text-sm font-bold text-foreground capitalize">
                            {activeWorkout.fitnessLevel || "Intermediate"}
                          </span>
                        </div>
                        <div className="px-2">
                          <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Frequency</span>
                          <span className="text-sm font-bold text-foreground">
                            {activeWorkout.daysPerWeek || activeWorkout.days?.length || 3} days/wk
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Days/Exercises Routine */}
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" /> Training Routine Schedule
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {activeWorkout.days?.map((day) => (
                        <Card key={day.dayNumber} className="border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden">
                          <div className="p-4 border-b border-border bg-muted/40">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                Day {day.dayNumber}
                              </span>
                              <span className="text-xs font-medium text-muted-foreground">
                                {day.exercises?.length || 0} exercises
                              </span>
                            </div>
                            <h4 className="text-base font-extrabold text-foreground mt-1">
                              {day.dayName || `Workout Day ${day.dayNumber}`}
                            </h4>
                            {day.focus && (
                              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                Focus: {day.focus}
                              </p>
                            )}
                          </div>

                          <div className="p-4 space-y-3 flex-1">
                            {day.exercises && day.exercises.length > 0 ? (
                              day.exercises.map((exercise, idx) => (
                                <div key={idx} className="flex gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 transition-colors">
                                  <div className="w-8 h-8 rounded bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-sm text-foreground truncate">
                                      {exercise.exerciseName}
                                    </h5>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                      <span>Sets: <strong className="text-foreground">{exercise.sets || "4"}</strong></span>
                                      <span>Reps: <strong className="text-foreground">{exercise.reps || "8-12"}</strong></span>
                                      {exercise.restSeconds && (
                                        <span>Rest: <strong className="text-foreground">{exercise.restSeconds}s</strong></span>
                                      )}
                                    </div>
                                    {exercise.notes && (
                                      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed bg-card p-1.5 rounded border border-border/40 italic">
                                        💡 {exercise.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-xs text-muted-foreground italic">
                                Rest Day / No exercises scheduled
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* NUTRITION PLAN TAB */}
            <TabsContent value="nutritionPlan" className="space-y-6 mt-4">
              {!activeNutrition ? (
                <Card className="p-12 border border-dashed border-border text-center space-y-4">
                  <Utensils className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                  <h3 className="text-lg font-bold text-foreground">No Nutrition Plan Assigned</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    This client does not have an active nutrition plan. Workouts are most effective when paired with structured diet targets.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Plan Overview Card */}
                  <Card className="p-5 border border-border bg-gradient-to-br from-green-500/5 via-card to-card">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-foreground">
                            {activeNutrition.planName}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                            Active
                          </span>
                        </div>
                        {activeNutrition.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeNutrition.description}
                          </p>
                        )}
                        {activeNutrition.dietaryRestrictions && activeNutrition.dietaryRestrictions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {activeNutrition.dietaryRestrictions.map((restrict, index) => (
                              <span
                                key={index}
                                className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-semibold border border-red-500/15"
                              >
                                {restrict}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center border-l border-border pl-0 md:pl-6 text-center shrink-0">
                        <div className="flex items-center gap-1.5 text-green-500 mb-1">
                          <Flame className="h-5 w-5 fill-current" />
                          <span className="text-2xl font-black text-foreground">
                            {activeNutrition.dailyCalories || 2000}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">Calories / Day Target</span>
                      </div>
                    </div>
                  </Card>

                  {/* Macro Progress Targets */}
                  <Card className="p-5 border border-border">
                    <h3 className="font-bold text-sm text-foreground mb-4">
                      Daily Macronutrient Targets
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-6">
                      {/* Protein */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-blue-500">Protein</span>
                          <span>{activeNutrition.proteinGrams || 150}g</span>
                        </div>
                        <Progress value={100} className="h-2 bg-muted [&>div]:bg-blue-500" />
                        <span className="text-[10px] text-muted-foreground block text-right">
                          {((activeNutrition.proteinGrams || 150) * 4)} kcal
                        </span>
                      </div>

                      {/* Carbs */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-orange-500">Carbohydrates</span>
                          <span>{activeNutrition.carbsGrams || 250}g</span>
                        </div>
                        <Progress value={100} className="h-2 bg-muted [&>div]:bg-orange-500" />
                        <span className="text-[10px] text-muted-foreground block text-right">
                          {((activeNutrition.carbsGrams || 250) * 4)} kcal
                        </span>
                      </div>

                      {/* Fats */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-yellow-500">Fats</span>
                          <span>{activeNutrition.fatGrams || 55}g</span>
                        </div>
                        <Progress value={100} className="h-2 bg-muted [&>div]:bg-yellow-500" />
                        <span className="text-[10px] text-muted-foreground block text-right">
                          {((activeNutrition.fatGrams || 55) * 9)} kcal
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Meal Plan Schedule (Day selector) */}
                  {parsedNutritionJson && parsedNutritionJson.days && parsedNutritionJson.days.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-primary" /> Daily Meal Schedule
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {parsedNutritionJson.days.length} days generated
                        </span>
                      </div>

                      {/* Day Selection Row */}
                      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
                        {parsedNutritionJson.days.map((day, idx) => (
                          <Button
                            key={idx}
                            variant={selectedNutritionDay === idx ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedNutritionDay(idx)}
                            className="rounded-full px-4 shrink-0"
                          >
                            Day {day.day}
                          </Button>
                        ))}
                      </div>

                      {/* Selected Day Meals Grid */}
                      {(() => {
                        const dayData = parsedNutritionJson.days[selectedNutritionDay];
                        if (!dayData) return null;
                        
                        const mealSlots = [
                          { label: "Breakfast", data: dayData.meals.breakfast, color: "border-orange-500/20 bg-orange-500/5 text-orange-500" },
                          { label: "Lunch", data: dayData.meals.lunch, color: "border-blue-500/20 bg-blue-500/5 text-blue-500" },
                          { label: "Dinner", data: dayData.meals.dinner, color: "border-indigo-500/20 bg-indigo-500/5 text-indigo-500" },
                          { label: "Snack", data: dayData.meals.snack, color: "border-green-500/20 bg-green-500/5 text-green-500" },
                        ];

                        return (
                          <div className="grid md:grid-cols-2 gap-6">
                            {mealSlots.map((slot, idx) => (
                              <Card key={idx} className="border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden">
                                <div className={`p-3 border-b border-border flex items-center justify-between ${slot.color}`}>
                                  <h4 className="font-bold text-sm uppercase tracking-wider">
                                    {slot.label}
                                  </h4>
                                  <span className="text-xs font-semibold">
                                    {slot.data?.total_calories || 0} kcal
                                  </span>
                                </div>

                                <div className="p-4 space-y-3 flex-grow bg-card text-foreground">
                                  {slot.data && slot.data.items && slot.data.items.length > 0 ? (
                                    slot.data.items.map((food, fIdx) => (
                                      <div key={fIdx} className="flex justify-between items-start text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                                        <div className="flex-grow pr-3">
                                          <div className="font-bold text-foreground">{food.name}</div>
                                          <div className="text-xs text-muted-foreground mt-0.5">
                                            Portion: {food.grams}g
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="font-semibold text-foreground">{food.calories} kcal</div>
                                          <div className="text-[10px] text-muted-foreground mt-0.5">
                                            P: {food.protein_g}g • C: {food.carbs_g}g • F: {food.fat_g}g
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-8 text-xs text-muted-foreground italic">
                                      No foods scheduled for this meal
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-muted-foreground italic bg-muted/20 border border-border rounded-lg">
                      No day-by-day meals data found in nutrition plan JSON.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
