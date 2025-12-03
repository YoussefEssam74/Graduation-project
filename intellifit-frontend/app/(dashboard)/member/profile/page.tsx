"use client";

import { useState } from "react";
import { useAuthStore } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Mail, Phone, Calendar, Dumbbell, Apple, Activity } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState("overview");

  const mockWorkoutPlan = {
    name: "Muscle Building Program",
    duration: "12 weeks",
    schedule: ["Monday", "Tuesday", "Thursday", "Friday"],
    exercises: [
      {
        day: "Day 1 - Chest & Triceps",
        routines: [
          { name: "Bench Press", sets: 4, reps: 8, description: "Focus on chest and triceps" },
          { name: "Incline Dumbbell Press", sets: 3, reps: 10, description: "Upper chest focus" },
          { name: "Tricep Dips", sets: 3, reps: 12, description: "Bodyweight or weighted" },
        ],
      },
      {
        day: "Day 2 - Back & Biceps",
        routines: [
          { name: "Deadlift", sets: 4, reps: 6, description: "Heavy compound movement" },
          { name: "Pull-ups", sets: 3, reps: 10, description: "Wide grip" },
          { name: "Barbell Curls", sets: 3, reps: 12, description: "Focus on form" },
        ],
      },
      {
        day: "Day 3 - Legs",
        routines: [
          { name: "Squats", sets: 4, reps: 8, description: "Heavy compound leg work" },
          { name: "Leg Press", sets: 3, reps: 12, description: "Full range of motion" },
          { name: "Leg Curls", sets: 3, reps: 15, description: "Hamstring focus" },
        ],
      },
      {
        day: "Day 4 - Shoulders & Abs",
        routines: [
          { name: "Overhead Press", sets: 4, reps: 8, description: "Shoulder development" },
          { name: "Lateral Raises", sets: 3, reps: 12, description: "Side delts" },
          { name: "Planks", sets: 3, reps: 60, description: "60 seconds hold" },
        ],
      },
    ],
  };

  const mockDietPlan = {
    dailyCalories: 2400,
    protein: 180,
    carbs: 250,
    fats: 60,
    meals: [
      {
        name: "Breakfast",
        time: "8:00 AM",
        foods: ["Oats with protein powder", "3 Eggs", "1 Banana", "Coffee"],
        calories: 600,
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        foods: ["Grilled chicken breast (200g)", "Brown rice", "Mixed vegetables", "Olive oil"],
        calories: 700,
      },
      {
        name: "Snack",
        time: "4:00 PM",
        foods: ["Greek yogurt", "Mixed nuts", "Apple"],
        calories: 300,
      },
      {
        name: "Dinner",
        time: "7:00 PM",
        foods: ["Grilled salmon", "Quinoa", "Steamed broccoli", "Salad"],
        calories: 650,
      },
      {
        name: "Pre-Bed",
        time: "10:00 PM",
        foods: ["Casein protein shake", "Almonds"],
        calories: 150,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">
          <span className="text-gray-900 dark:text-gray-100">Your </span>
          <span className="text-primary-blue dark:text-[#18cef2]">Profile</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your profile and fitness plans
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-8 bg-gradient-to-r from-primary-blue/10 to-blue-500/10 dark:from-[#18cef2]/20 dark:to-blue-500/20 border-2 border-primary-blue dark:border-[#18cef2] transition-colors duration-300">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-primary-blue dark:bg-[#18cef2] flex items-center justify-center text-white dark:text-gray-900 text-4xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{user?.name || "User"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Mail className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
                <span>{user?.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Phone className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
                <span>{user?.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
                <span>Role: {user?.role || "Member"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Activity className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
                <span>Tokens: {user?.tokenBalance || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fitness Plans */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            <span className="text-gray-900 dark:text-gray-100">Your </span>
            <span className="text-primary-blue dark:text-[#18cef2]">Fitness Plans</span>
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4 mb-6">
            <Button
              variant={activeTab === "workout" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setActiveTab("workout")}
            >
              <Dumbbell className="mr-2 h-4 w-4" />
              Workout Plan
            </Button>
            <Button
              variant={activeTab === "diet" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setActiveTab("diet")}
            >
              <Apple className="mr-2 h-4 w-4" />
              Diet Plan
            </Button>
          </div>

          {/* Workout Tab */}
          {activeTab === "workout" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary-blue/5 dark:bg-[#18cef2]/10 rounded-lg border border-primary-blue/20 dark:border-[#18cef2]/30">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{mockWorkoutPlan.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration: {mockWorkoutPlan.duration}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Schedule</div>
                  <div className="flex gap-2">
                    {mockWorkoutPlan.schedule.map((day, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-blue dark:bg-[#18cef2] text-white dark:text-gray-900 rounded text-xs font-medium"
                      >
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {mockWorkoutPlan.exercises.map((exerciseDay, index) => (
                <Card
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
                >
                  <h4 className="text-lg font-bold text-primary-blue dark:text-[#18cef2] mb-4">
                    {exerciseDay.day}
                  </h4>
                  <div className="space-y-3">
                    {exerciseDay.routines.map((routine, routineIndex) => (
                      <div
                        key={routineIndex}
                        className="flex items-start justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">{routine.name}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{routine.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <span className="px-2 py-1 bg-primary-blue/20 dark:bg-[#18cef2]/30 text-primary-blue dark:text-[#18cef2] rounded text-xs font-mono">
                            {routine.sets} SETS
                          </span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded text-xs font-mono">
                            {routine.reps} REPS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Diet Tab */}
          {activeTab === "diet" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center bg-primary-blue/5 dark:bg-[#18cef2]/10 border border-primary-blue/20 dark:border-[#18cef2]/30">
                  <div className="text-2xl font-bold text-primary-blue dark:text-[#18cef2]">{mockDietPlan.dailyCalories}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                </Card>
                <Card className="p-4 text-center bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockDietPlan.protein}g</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                </Card>
                <Card className="p-4 text-center bg-green-500/5 dark:bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{mockDietPlan.carbs}g</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                </Card>
                <Card className="p-4 text-center bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{mockDietPlan.fats}g</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fats</div>
                </Card>
              </div>

              {mockDietPlan.meals.map((meal, index) => (
                <Card
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-primary-blue dark:text-[#18cef2]">{meal.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{meal.time}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-primary-blue/20 dark:bg-[#18cef2]/30 text-primary-blue dark:text-[#18cef2] rounded-full text-sm font-bold">
                      {meal.calories} kcal
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {meal.foods.map((food, foodIndex) => (
                      <li
                        key={foodIndex}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="w-6 h-6 flex items-center justify-center bg-primary-blue dark:bg-[#18cef2] text-white dark:text-gray-900 rounded-full text-xs font-mono">
                          {foodIndex + 1}
                        </span>
                        <span>{food}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
