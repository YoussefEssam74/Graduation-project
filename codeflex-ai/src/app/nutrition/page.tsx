"use client";

import { useState } from "react";
import { UserRole } from "@/types/gym";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Utensils,
    Flame,
    Droplet,
    PieChart,
    Plus,
    ChevronRight,
    Apple,
    Coffee,
    Moon,
    Sun
} from "lucide-react";

function NutritionContent() {
    const [calories] = useState(1850);
    const [maxCalories] = useState(2400);

    const macros = {
        protein: { current: 160, max: 180, label: "Protein", color: "bg-blue-500" },
        carbs: { current: 210, max: 300, label: "Carbs", color: "bg-orange-500" },
        fats: { current: 45, max: 70, label: "Fats", color: "bg-yellow-500" }
    };

    const meals = [
        {
            id: 1,
            type: "Breakfast",
            name: "Oatmeal w/ Berries & Nut Butter",
            calories: 450,
            icon: Sun,
            iconColor: "text-orange-500",
            bgColor: "bg-orange-100"
        },
        {
            id: 2,
            type: "Lunch",
            name: "Grilled Chicken Salad",
            calories: 620,
            icon: CloudSun,
            iconColor: "text-blue-500",
            bgColor: "bg-blue-100"
        },
        {
            id: 3,
            type: "Dinner",
            name: "Salmon & Asparagus",
            calories: 580,
            icon: Moon,
            iconColor: "text-indigo-500",
            bgColor: "bg-indigo-100"
        }
    ];

    function CloudSun(props: any) {
        return <Sun {...props} className={props.className?.replace('text-orange-500', 'text-blue-500') || ''} />
    }

    return (
        <div className="min-h-screen relative p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Nutrition Plan</h1>
                        <p className="text-slate-500 mt-1">Track your macros and stick to your goals.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2">
                            <Utensils className="h-4 w-4" />
                            View Diet Plan
                        </Button>
                        <Button className="bg-green-500 hover:bg-green-600 gap-2">
                            Grocery List
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Stats Card */}
                    <Card className="p-6 lg:col-span-1 border-none shadow-sm bg-white rounded-3xl">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Daily Summary</h3>

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <div className="text-sm text-slate-500 font-medium">Calories</div>
                                <div className="text-4xl font-black text-slate-900 mt-1">
                                    {calories.toLocaleString()} <span className="text-lg text-slate-400 font-normal">/ {maxCalories.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Circular Progress Placeholder - simpler implementation */}
                            <div className="relative h-16 w-16 flex items-center justify-center rounded-full border-4 border-slate-100 border-t-green-500">
                                <Flame className="h-6 w-6 text-green-500" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {Object.entries(macros).map(([key, data]) => (
                                <div key={key}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-bold text-slate-700">{data.label} <span className="text-slate-400 font-normal">({data.current}g left)</span></span>
                                        <span className="font-bold text-blue-600">{Math.round((data.current / data.max) * 100)}%</span>
                                    </div>
                                    <Progress value={(data.current / data.max) * 100} className={`h-2 ${data.color}`} />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Meals List */}
                    <div className="lg:col-span-2 space-y-4">
                        {meals.map((meal) => (
                            <Card key={meal.id} className="p-4 flex items-center justify-between border-slate-100 hover:shadow-md transition-shadow group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-2xl ${meal.bgColor} flex items-center justify-center`}>
                                        <meal.icon className={`h-6 w-6 ${meal.iconColor}`} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">{meal.type}</div>
                                        <div className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{meal.name}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{meal.calories} kcal</div>
                                </div>
                            </Card>
                        ))}

                        <Button variant="outline" className="w-full h-14 border-dashed border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 gap-2 rounded-2xl">
                            <Plus className="h-5 w-5" />
                            Add Snack
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function NutritionPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach, UserRole.Admin]}>
            <NutritionContent />
        </ProtectedRoute>
    );
}
