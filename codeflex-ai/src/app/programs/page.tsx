"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { workoutPlansApi, type MemberWorkoutPlanDto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Dumbbell,
    Calendar,
    ChevronRight,
    Plus,
    Loader2,
    CheckCircle,
    Circle,
    Utensils,
    Search,
    Bell,
    User,
    Flame,
    Sun,
    Moon,
    MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types for the detailed view
interface DailyWorkout {
    id: string;
    title: string;
    duration: string;
    status: "pending" | "completed";
    exercises: Exercise[];
}

interface Exercise {
    id: string;
    name: string;
    muscle: string;
    sets: number;
    reps: string;
    completed: boolean;
    image?: string;
}

interface DailyDiet {
    calories: { current: number; target: number };
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fats: { current: number; target: number };
    meals: Meal[];
}

interface Meal {
    id: string;
    type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
    name: string;
    calories: number;
    icon: any;
}

function ProgramDashboard() {
    const { user } = useAuth();
    const [activePlan, setActivePlan] = useState<MemberWorkoutPlanDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Mock data for the specific "Today" view
    const [todayWorkout, setTodayWorkout] = useState<DailyWorkout>({
        id: "wo-1",
        title: "Upper Body Power",
        duration: "45-60 min",
        status: "pending",
        exercises: [
            { id: "ex-1", name: "Barbell Bench Press", muscle: "Chest, Triceps • Barbell", sets: 3, reps: "8-10 Reps", completed: true, image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop" },
            { id: "ex-2", name: "Weighted Pull-Ups", muscle: "Back, Biceps • Bodyweight", sets: 3, reps: "6-8 Reps", completed: true, image: "https://images.unsplash.com/photo-1598971639058-211a73287750?w=100&h=100&fit=crop" },
            { id: "ex-3", name: "Seated DB Shoulder Press", muscle: "Shoulders • Dumbbell", sets: 3, reps: "10-12 Reps", completed: false, image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop" },
            { id: "ex-4", name: "Incline DB Curl", muscle: "Biceps • Dumbbell", sets: 3, reps: "12-15 Reps", completed: false, image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=100&h=100&fit=crop" }
        ]
    });

    const [todayDiet, setTodayDiet] = useState<DailyDiet>({
        calories: { current: 1850, target: 2400 },
        protein: { current: 160, target: 180 },
        carbs: { current: 210, target: 300 },
        fats: { current: 45, target: 70 },
        meals: [
            { id: "m-1", type: "Breakfast", name: "Oatmeal w/ Berries & Nut Butter", calories: 450, icon: Sun },
            { id: "m-2", type: "Lunch", name: "Grilled Chicken Salad", calories: 620, icon: Sun },
            { id: "m-3", type: "Dinner", name: "Salmon & Asparagus", calories: 580, icon: Moon }
        ]
    });

    // Generate calendar days (current week)
    const getWeekDays = () => {
        const today = new Date();
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - today.getDay() + i + 1); // Start Monday
            days.push(d);
        }
        return days;
    };
    const weekDays = getWeekDays();

    useEffect(() => {
        async function fetchPlans() {
            if (!user?.userId) return;
            try {
                const response = await workoutPlansApi.getMemberPlans(user.userId);
                if (response.success && response.data) {
                    // Find active plan
                    const active = response.data.find(p => p.status === 1) || response.data[0];
                    setActivePlan(active);
                }
            } catch (error) {
                console.error("Failed to fetch plans", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPlans();
    }, [user]);

    const toggleExercise = (id: string) => {
        setTodayWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex =>
                ex.id === id ? { ...ex, completed: !ex.completed } : ex
            )
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-6rem)] p-4 lg:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Top Navigation / Breadcrumbs (matching reference) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-bold text-slate-400">Programs</span>
                        <span>/</span>
                        <span className="font-bold text-slate-900">{activePlan?.planName || "Hypertrophy Phase 1"}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                className="w-full pl-9 pr-4 py-2 bg-white rounded-full text-sm border-none shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                {/* Main Header Card */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded">Week 3 of 8</span>
                            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded">Progressive Overload</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{activePlan?.planName || "Hypertrophy Phase 1"}</h1>
                        <p className="text-slate-500 font-medium">Focus: Increasing volume on compound movements.</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-end justify-between gap-4">
                        {/* Calendar Strip */}
                        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 w-full md:w-auto">
                            {weekDays.map((date, idx) => {
                                const isSelected = date.getDate() === selectedDate.getDate();
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                                            flex flex-col items-center justify-center w-14 h-20 rounded-full cursor-pointer transition-all flex-shrink-0
                                            ${isSelected
                                                ? 'bg-[#111827] text-white shadow-lg scale-110'
                                                : 'bg-white text-slate-400 hover:bg-white/80'}
                                        `}
                                    >
                                        <span className="text-[10px] font-bold uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-xl font-bold">{date.getDate()}</span>
                                        {isSelected && <span className="w-1 h-1 rounded-full bg-green-500 mt-1"></span>}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full md:w-64">
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-slate-900">Program Completion</span>
                                <span className="text-slate-900">35%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[35%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-8">

                    {/* LEFT COLUMN: WORKOUT Plan */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                    <Dumbbell className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Workout Plan</h2>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" className="text-slate-500 font-bold text-sm h-8 hover:bg-slate-100">History</Button>
                                <Button variant="ghost" className="text-blue-600 font-bold text-sm h-8 bg-blue-50 hover:bg-blue-100 rounded-lg">Edit</Button>
                            </div>
                        </div>

                        <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-[32px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">{todayWorkout.title}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Estimated Duration: {todayWorkout.duration}</p>
                                </div>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                                    Pending
                                </span>
                            </div>

                            {/* Coach Insight */}
                            <div className="bg-slate-50 p-4 rounded-2xl flex gap-4 mb-8">
                                <div className="h-10 w-10 flex-shrink-0 bg-[#111827] rounded-full flex items-center justify-center">
                                    <Brain className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">Coach Insight</h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        Focus on explosive concentric movements today. Keep rest periods strictly under 90 seconds to maintain intensity.
                                    </p>
                                </div>
                            </div>

                            {/* Exercises List */}
                            <div className="space-y-3">
                                {todayWorkout.exercises.map((exercise) => (
                                    <div key={exercise.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all group">
                                        <div className="h-14 w-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                                            <img src={exercise.image} className="w-full h-full object-cover mix-blend-multiply opacity-80" alt={exercise.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 text-sm truncate">{exercise.name}</h4>
                                            <p className="text-xs text-slate-500 truncate">{exercise.muscle}</p>
                                        </div>
                                        <div className="text-right mr-2 hidden sm:block">
                                            <div className="font-bold text-slate-900 text-sm">{exercise.sets} Sets</div>
                                            <div className="text-xs text-slate-500">{exercise.reps}</div>
                                        </div>
                                        <button
                                            onClick={() => toggleExercise(exercise.id)}
                                            className={`
                                                h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all
                                                ${exercise.completed
                                                    ? 'bg-slate-100 border-slate-200 text-slate-900'
                                                    : 'border-slate-200 text-transparent hover:border-blue-500'}
                                            `}
                                        >
                                            <CheckCircle className={`h-5 w-5 ${exercise.completed ? 'opacity-100' : 'opacity-0'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                        </Card>
                    </div>

                    {/* RIGHT COLUMN: DIET Plan */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-xl text-green-600">
                                    <Utensils className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Diet Plan</h2>
                            </div>
                            <Button variant="ghost" className="text-green-600 font-bold text-sm h-8 gap-2 hover:bg-green-50">
                                <CheckCircle className="h-4 w-4" /> Grocery List
                            </Button>
                        </div>

                        <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-[32px] h-fit">

                            {/* Calories Ring Section */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CALORIES</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900">{todayDiet.calories.current.toLocaleString()}</span>
                                        <span className="text-lg text-slate-400 font-medium">/ {todayDiet.calories.target.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="relative h-16 w-16">
                                    <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                                        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        <path className="text-green-500" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                            {/* Macros */}
                            <div className="space-y-4 mb-8">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-slate-700">Protein ({todayDiet.protein.target - todayDiet.protein.current}g left)</span>
                                        <span className="text-blue-500">{Math.round((todayDiet.protein.current / todayDiet.protein.target) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[90%] rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-slate-700">Carbs ({todayDiet.carbs.target - todayDiet.carbs.current}g left)</span>
                                        <span className="text-orange-500">{Math.round((todayDiet.carbs.current / todayDiet.carbs.target) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 w-[60%] rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-slate-700">Fats ({todayDiet.fats.target - todayDiet.fats.current}g left)</span>
                                        <span className="text-yellow-500">{Math.round((todayDiet.fats.current / todayDiet.fats.target) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 w-[30%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Meals List */}
                            <div className="space-y-3">
                                {todayDiet.meals.map((meal) => (
                                    <div key={meal.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${meal.type === 'Dinner' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'
                                            }`}>
                                            <meal.icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{meal.type}</div>
                                            <h4 className="font-bold text-slate-900 text-sm truncate">{meal.name}</h4>
                                        </div>
                                        <div className="font-bold text-slate-600 text-sm whitespace-nowrap">{meal.calories} kcal</div>
                                    </div>
                                ))}

                                <Button variant="outline" className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-400 font-bold hover:bg-slate-50 hover:border-slate-300 rounded-xl mt-2">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Snack
                                </Button>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Temporary icon component wrapper
function Brain(props: any) {
    return <div {...props}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.97-3.465" /><path d="M19.97 14.535A4 4 0 0 1 18 18" /></svg></div>
}

export default function ProgramsPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
            <ProgramDashboard />
        </ProtectedRoute>
    );
}
