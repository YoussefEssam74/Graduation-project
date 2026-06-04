"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Apple,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  nutritionPlansApi,
  type NutritionPlanDto,
  type PlanMealItem,
  type CoachEditNutritionPlanRequest
} from "@/lib/api/nutritionPlans";

interface NutritionPlanEditModalProps {
  plan: NutritionPlanDto;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface LocalDayMeals {
  dayNumber: number;
  meals: {
    mealId?: number;
    name: string;
    mealType: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    description?: string;
  }[];
}

export default function NutritionPlanEditModal({
  plan,
  isOpen,
  onClose,
  onSaveSuccess
}: NutritionPlanEditModalProps) {
  const [planName, setPlanName] = useState(plan.planName);
  const [description, setDescription] = useState(plan.description || "");
  const [dailyCalories, setDailyCalories] = useState(plan.dailyCalories || 2000);
  const [proteinGrams, setProteinGrams] = useState(plan.proteinGrams || 150);
  const [carbsGrams, setCarbsGrams] = useState(plan.carbsGrams || 200);
  const [fatGrams, setFatGrams] = useState(plan.fatGrams || 65);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(plan.dietaryRestrictions || []);
  const [newRestriction, setNewRestriction] = useState("");
  const [coachNotes, setCoachNotes] = useState(plan.approvalNotes || "");
  const [days, setDays] = useState<LocalDayMeals[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to parse existing AI Plan JSON or fallback to database meals
    let parsedDays: LocalDayMeals[] = [];

    if (plan.aiPlanJson) {
      try {
        const aiPlan = JSON.parse(plan.aiPlanJson);
        if (aiPlan.days) {
          parsedDays = aiPlan.days.map((d: any) => {
            const mealsList: any[] = [];
            
            // Extract meals from the nested JSON object
            const mealsObj = d.meals || {};
            Object.keys(mealsObj).forEach(type => {
              const items = mealsObj[type]?.items || [];
              items.forEach((item: any) => {
                mealsList.push({
                  name: item.name || item.foodName || "Food Item",
                  mealType: type,
                  calories: Math.round(item.calories || 0),
                  proteinGrams: Math.round(item.protein_g || item.protein || 0),
                  carbsGrams: Math.round(item.carbs_g || item.carbs || 0),
                  fatGrams: Math.round(item.fat_g || item.fats || item.fat || 0),
                  description: item.description || `${item.grams || 100}g portion`
                });
              });
            });

            return {
              dayNumber: d.day || d.dayNumber || 1,
              meals: mealsList
            };
          });
        }
      } catch (err) {
        console.error("Failed to parse aiPlanJson, falling back to database meals", err);
      }
    }

    // Fallback: Group meals by days (use dayNumber from database if available)
    if (parsedDays.length === 0 && plan.meals && plan.meals.length > 0) {
      const daysMap: Record<number, any[]> = {};
      plan.meals.forEach(m => {
        const dayNum = m.dayNumber || 1;
        if (!daysMap[dayNum]) {
          daysMap[dayNum] = [];
        }
        daysMap[dayNum].push({
          mealId: m.mealId,
          name: m.name,
          mealType: m.mealType || "Breakfast",
          calories: m.calories,
          proteinGrams: m.proteinGrams,
          carbsGrams: m.carbsGrams,
          fatGrams: m.fatGrams,
          description: m.name
        });
      });

      parsedDays = Object.keys(daysMap).map(dayStr => {
        const dNum = parseInt(dayStr, 10);
        return {
          dayNumber: dNum,
          meals: daysMap[dNum]
        };
      }).sort((a, b) => a.dayNumber - b.dayNumber);
    }


    setDays(parsedDays);
  }, [plan]);

  if (!isOpen) return null;

  const handleMealFieldChange = (
    dayNumber: number,
    mealIndex: number,
    field: string,
    value: any
  ) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const newMeals = [...d.meals];
        newMeals[mealIndex] = {
          ...newMeals[mealIndex],
          [field]: value
        };
        return { ...d, meals: newMeals };
      })
    );
  };

  const handleAddMealItem = (dayNumber: number, mealType: string) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const newItem = {
          name: "New Food Item",
          mealType: mealType,
          calories: 100,
          proteinGrams: 10,
          carbsGrams: 10,
          fatGrams: 2,
          description: "100g portion"
        };
        return { ...d, meals: [...d.meals, newItem] };
      })
    );
  };

  const handleDeleteMealItem = (dayNumber: number, index: number) => {
    setDays(prevDays =>
      prevDays.map(d => {
        if (d.dayNumber !== dayNumber) return d;
        const newMeals = d.meals.filter((_, idx) => idx !== index);
        return { ...d, meals: newMeals };
      })
    );
  };

  const handleAddRestriction = () => {
    if (newRestriction.trim() && !dietaryRestrictions.includes(newRestriction.trim())) {
      setDietaryRestrictions([...dietaryRestrictions, newRestriction.trim()]);
      setNewRestriction("");
    }
  };

  const handleRemoveRestriction = (res: string) => {
    setDietaryRestrictions(dietaryRestrictions.filter(r => r !== res));
  };

  const calculateDayTotals = (dayMeals: LocalDayMeals["meals"]) => {
    return dayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.proteinGrams,
        carbs: acc.carbs + m.carbsGrams,
        fat: acc.fat + m.fatGrams
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const requestData: CoachEditNutritionPlanRequest = {
        planName,
        description,
        dailyCalories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        dietaryRestrictions,
        coachNotes,
        days: days.map(d => ({
          dayNumber: d.dayNumber,
          meals: d.meals.map(m => ({
            mealId: m.mealId,
            name: m.name,
            mealType: m.mealType,
            calories: m.calories,
            proteinGrams: m.proteinGrams,
            carbsGrams: m.carbsGrams,
            fatGrams: m.fatGrams,
            description: m.description
          }))
        }))
      };

      const response = await nutritionPlansApi.coachEditPlan(plan.planId, requestData);
      if (response.success) {
        onSaveSuccess();
        onClose();
      } else {
        setError(response.message || "Failed to save nutrition plan edits.");
      }
    } catch {
      setError("An error occurred while editing the nutrition plan.");
    } finally {
      setLoading(false);
    }
  };

  // Predefined Allergen Warning checker (looks for lactose, dairy, gluten, nuts in meal items)
  const checkAllergens = (name: string) => {
    const lowerName = name.toLowerCase();
    const flags = [];
    if (lowerName.includes("milk") || lowerName.includes("cheese") || lowerName.includes("yogurt") || lowerName.includes("dairy")) {
      flags.push("🥛 Dairy/Lactose");
    }
    if (lowerName.includes("wheat") || lowerName.includes("bread") || lowerName.includes("pasta") || lowerName.includes("flour") || lowerName.includes("gluten")) {
      flags.push("🌾 Gluten");
    }
    if (lowerName.includes("peanut") || lowerName.includes("almond") || lowerName.includes("hazelnut") || lowerName.includes("nut")) {
      flags.push("🥜 Nuts");
    }
    if (lowerName.includes("egg")) {
      flags.push("🥚 Egg");
    }
    return flags;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Edit Nutrition Plan</h2>
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
              <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="E.g., Low Carb Diet" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overview Description</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Plan outline/tips" />
            </div>
          </div>

          {/* Macros Targets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border/60">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Calories Target (kcal)</label>
              <Input
                type="number"
                value={dailyCalories}
                onChange={e => setDailyCalories(parseInt(e.target.value) || 0)}
                className="font-bold tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-green-500">Protein Target (g)</label>
              <Input
                type="number"
                value={proteinGrams}
                onChange={e => setProteinGrams(parseInt(e.target.value) || 0)}
                className="font-bold text-green-500 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-500">Carbs Target (g)</label>
              <Input
                type="number"
                value={carbsGrams}
                onChange={e => setCarbsGrams(parseInt(e.target.value) || 0)}
                className="font-bold text-blue-500 tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-500">Fats Target (g)</label>
              <Input
                type="number"
                value={fatGrams}
                onChange={e => setFatGrams(parseInt(e.target.value) || 0)}
                className="font-bold text-amber-500 tabular-nums"
              />
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dietary Restrictions & Allergens</label>
            <div className="flex gap-2">
              <Input
                value={newRestriction}
                onChange={e => setNewRestriction(e.target.value)}
                placeholder="E.g., Nut-Free, Lactose-Intolerant"
                className="max-w-xs"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRestriction();
                  }
                }}
              />
              <Button variant="secondary" onClick={handleAddRestriction}>Add Tag</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {dietaryRestrictions.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">No restrictions added yet.</span>
              ) : (
                dietaryRestrictions.map((res, ri) => (
                  <span
                    key={ri}
                    className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1"
                  >
                    {res}
                    <button onClick={() => handleRemoveRestriction(res)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Coach Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coach Comments / Notes (saved in database)</label>
            <textarea
              className="w-full text-sm bg-muted rounded-lg p-3 border border-border outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={2}
              placeholder="Provide comments regarding your modifications (e.g. replaced allergen options, customized daily protein target)..."
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
            />
          </div>

          {/* Days & Meals */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-1">Days & Meal Splits</h3>
            {days.map((day) => {
              const dayTotals = calculateDayTotals(day.meals);
              return (
                <Card key={day.dayNumber} className="p-4 border border-border/80 bg-muted/20 space-y-4">
                  {/* Day Title & Realtime Totals */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 flex-wrap gap-3">
                    <h4 className="font-bold text-base text-primary">Day {day.dayNumber} Meals</h4>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                      <span className={dayTotals.calories > dailyCalories ? "text-red-500 font-bold" : ""}>
                        Cal: {dayTotals.calories}/{dailyCalories} kcal
                      </span>
                      <span className={dayTotals.protein < proteinGrams ? "text-amber-500" : "text-green-500"}>
                        P: {dayTotals.protein}/{proteinGrams}g
                      </span>
                      <span>C: {dayTotals.carbs}/{carbsGrams}g</span>
                      <span>F: {dayTotals.fat}/{fatGrams}g</span>
                    </div>
                  </div>

                  {/* Meal Slots (Breakfast, Lunch, Dinner, Snack) */}
                  {["Breakfast", "Lunch", "Dinner", "Snack"].map((mType) => {
                    const mealsInSlot = day.meals.filter(
                      m => m.mealType.toLowerCase() === mType.toLowerCase() || m.name.toLowerCase() === mType.toLowerCase()
                    );
                    return (
                      <div key={mType} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground tracking-wide uppercase">{mType}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full border border-border text-muted-foreground hover:text-primary"
                            onClick={() => handleAddMealItem(day.dayNumber, mType)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Meal Items inside slot */}
                        <div className="grid gap-2 pl-2 border-l border-border/40">
                          {mealsInSlot.length === 0 ? (
                            <span className="text-[11px] text-muted-foreground italic pl-2">No food items added for {mType}.</span>
                          ) : (
                            mealsInSlot.map((mealItem, idx) => {
                              // Find actual index in day.meals
                              const actualIndex = day.meals.findIndex(
                                m => m === mealItem
                              );
                              const allergenFlags = checkAllergens(mealItem.name);

                              return (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 bg-background p-3 rounded-lg border border-border/60 hover:border-border transition-colors flex-wrap md:flex-nowrap"
                                >
                                  {/* Inputs Grid */}
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2.5">
                                    {/* Food Name */}
                                    <div className="col-span-2 space-y-1">
                                      <label className="text-[9px] font-bold text-muted-foreground">Food Name</label>
                                      <div className="flex flex-col gap-1">
                                        <Input
                                          value={mealItem.name}
                                          onChange={e => handleMealFieldChange(day.dayNumber, actualIndex, "name", e.target.value)}
                                          className="h-8 text-xs font-semibold"
                                        />
                                        {allergenFlags.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {allergenFlags.map((flag, fi) => (
                                              <span
                                                key={fi}
                                                className="text-[9px] font-bold bg-amber-500/10 text-amber-600 rounded px-1.5 py-0.2"
                                              >
                                                {flag}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Portion description */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-muted-foreground">Portion/Grams</label>
                                      <Input
                                        value={mealItem.description || ""}
                                        onChange={e => handleMealFieldChange(day.dayNumber, actualIndex, "description", e.target.value)}
                                        className="h-8 text-xs"
                                        placeholder="E.g., 100g, 1 cup"
                                      />
                                    </div>

                                    {/* Calories */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-muted-foreground">Calories (kcal)</label>
                                      <Input
                                        type="number"
                                        value={mealItem.calories || ""}
                                        onChange={e => handleMealFieldChange(day.dayNumber, actualIndex, "calories", parseInt(e.target.value) || 0)}
                                        className="h-8 text-xs tabular-nums"
                                      />
                                    </div>

                                    {/* Protein (g) */}
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-green-500">Protein (g)</label>
                                      <Input
                                        type="number"
                                        value={mealItem.proteinGrams || ""}
                                        onChange={e => handleMealFieldChange(day.dayNumber, actualIndex, "proteinGrams", parseInt(e.target.value) || 0)}
                                        className="h-8 text-xs text-green-500 tabular-nums"
                                      />
                                    </div>

                                    {/* Carbs & Fats */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-blue-500">Carbs</label>
                                        <Input
                                          type="number"
                                          value={mealItem.carbsGrams || ""}
                                          onChange={e => handleMealFieldChange(day.dayNumber, actualIndex, "carbsGrams", parseInt(e.target.value) || 0)}
                                          className="h-8 text-xs text-blue-500 tabular-nums p-1 text-center"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-amber-500">Fat</label>
                                        <Input
                                          type="number"
                                          value={mealItem.fatGrams || ""}
                                          onChange={e => handleMealFieldChange(day.dayNumber, actualIndex, "fatGrams", parseInt(e.target.value) || 0)}
                                          className="h-8 text-xs text-amber-500 tabular-nums p-1 text-center"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Delete Item */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg border border-border mt-5"
                                    onClick={() => handleDeleteMealItem(day.dayNumber, actualIndex)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
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
