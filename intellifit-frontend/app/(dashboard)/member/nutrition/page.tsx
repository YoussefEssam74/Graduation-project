'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { nutritionPlanApi } from '@/lib/api/services';
import { useRouter } from 'next/navigation';
import { Apple, TrendingUp, Flame, Target, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { NutritionPlan, PlanSource, ApprovalStatus } from '@/types';

export default function NutritionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [todayIntake, setTodayIntake] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await nutritionPlanApi.getMyPlans(user.userId);
        if (res?.success && res.data && res.data.length > 0) {
          // take the first active plan if present
          setNutritionPlan(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to load nutrition plan', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a3e221]"></div>
      </div>
    );
  }

  const caloriesPercent = nutritionPlan
    ? (todayIntake.calories / nutritionPlan.dailyCalories) * 100
    : 0;
  const proteinPercent = nutritionPlan
    ? (todayIntake.protein / nutritionPlan.proteinGrams) * 100
    : 0;
  const carbsPercent = nutritionPlan
    ? (todayIntake.carbs / nutritionPlan.carbsGrams) * 100
    : 0;
  const fatsPercent = nutritionPlan
    ? (todayIntake.fats / nutritionPlan.fatsGrams) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nutrition Plan</h1>
          <p className="text-gray-600 mt-1">Track your meals and reach your goals</p>
        </div>
        {!nutritionPlan && (
          <Button onClick={() => router.push('/member/ai-coach')}>
            <Plus className="h-4 w-4 mr-2" />
            Generate AI Plan
          </Button>
        )}
      </div>

      {nutritionPlan ? (
        <>
          {/* Daily Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{nutritionPlan.planName}</CardTitle>
                <Badge
                  variant={
                    nutritionPlan.planSource === PlanSource.AI ? 'default' : 'success'
                  }
                >
                  {nutritionPlan.planSource}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Calories
                    </span>
                    <span className="text-sm font-semibold text-orange-500">
                      {Math.round(caloriesPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {todayIntake.calories} / {nutritionPlan.dailyCalories} kcal
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-[#0b4fd4]" />
                      Protein
                    </span>
                    <span className="text-sm font-semibold text-[#0b4fd4]">
                      {Math.round(proteinPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-[#0b4fd4] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(proteinPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {todayIntake.protein} / {nutritionPlan.proteinGrams}g
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Target className="h-4 w-4 text-[#a3e221]" />
                      Carbs
                    </span>
                    <span className="text-sm font-semibold text-[#a3e221]">
                      {Math.round(carbsPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-[#a3e221] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(carbsPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {todayIntake.carbs} / {nutritionPlan.carbsGrams}g
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Apple className="h-4 w-4 text-yellow-500" />
                      Fats
                    </span>
                    <span className="text-sm font-semibold text-yellow-500">
                      {Math.round(fatsPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(fatsPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {todayIntake.fats} / {nutritionPlan.fatsGrams}g
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meal Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Meals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nutritionPlan.meals?.map((meal) => (
                  <div
                    key={meal.mealID}
                    className="flex items-start justify-between p-4 rounded-lg border hover:border-[#a3e221] transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{meal.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{meal.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {meal.calories} cal
                        </span>
                        <span>P: {meal.protein}g</span>
                        <span>C: {meal.carbs}g</span>
                        <span>F: {meal.fats}g</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Log Meal
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hydration & Tips */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hydration Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-6xl mb-4">💧</div>
                  <p className="text-3xl font-bold text-[#0b4fd4] mb-2">6 / 8</p>
                  <p className="text-sm text-gray-600">Glasses of water today</p>
                  <Button className="mt-4" size="sm">
                    Log Water
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nutrition Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-800">
                      💡 Consider timing your carbs around your workout for better performance
                    </p>
                  </div>
                  <div className="p-3 bg-lime-50 rounded-lg">
                    <p className="text-sm text-gray-800">
                      🥗 Add more vegetables to increase fiber and micronutrients
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-800">
                      🍖 Spread protein intake throughout the day for optimal muscle synthesis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Apple className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Nutrition Plan Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get a personalized nutrition plan from our AI coach
            </p>
            <Button onClick={() => router.push('/member/ai-coach')}>
              Generate AI Nutrition Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
