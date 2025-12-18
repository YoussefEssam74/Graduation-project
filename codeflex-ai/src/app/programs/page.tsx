"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { workoutPlansApi, type MemberWorkoutPlanDto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Calendar, ChevronRight, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function ProgramsList() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<MemberWorkoutPlanDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            if (!user?.userId) return;
            try {
                const response = await workoutPlansApi.getMemberPlans(user.userId);
                if (response.success && response.data) {
                    setPlans(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch plans", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPlans();
    }, [user]);

    // Get status color based on status code
    const getStatusColor = (status: number) => {
        switch (status) {
            case 0: return "bg-yellow-100 text-yellow-700"; // Pending
            case 1: return "bg-green-100 text-green-700";   // Active
            case 2: return "bg-blue-100 text-blue-700";     // Completed
            case 3: return "bg-red-100 text-red-700";       // Cancelled
            default: return "bg-slate-100 text-slate-700";
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-slate-50 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">My Plans</h1>
                        <p className="text-slate-500 mt-1">Manage and track your workout programs</p>
                    </div>
                    <Link href="/generate-program">
                        <Button className="font-bold bg-blue-600 hover:bg-blue-700 rounded-xl gap-2">
                            <Plus className="h-5 w-5" />
                            Generate Plan
                        </Button>
                    </Link>
                </div>

                {plans.length === 0 ? (
                    <Card className="p-12 text-center border-0 shadow-sm bg-white rounded-2xl">
                        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Dumbbell className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Plans</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            You don&apos;t have any workout plans yet. Ask our AI Coach to generate a personalized plan for you.
                        </p>
                        <Link href="/generate-program">
                            <Button size="lg" className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                                Generate Plan
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <Link key={plan.memberPlanId} href={`/programs/${plan.memberPlanId}`}>
                                <Card className="group h-full p-6 border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-2xl relative overflow-hidden cursor-pointer hover:-translate-y-1">
                                    <div className="absolute top-0 right-0 p-20 bg-blue-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${plan.status === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                <Dumbbell className="h-6 w-6" />
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${getStatusColor(plan.status)}`}>
                                                {plan.statusText}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{plan.planName}</h3>
                                        <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                                            {plan.notes || "A personalized workout plan designed for your fitness goals."}
                                        </p>

                                        {/* Progress */}
                                        {plan.totalWorkouts && plan.totalWorkouts > 0 && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>{plan.completedWorkouts || 0}/{plan.totalWorkouts} workouts</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 rounded-full"
                                                        style={{ width: `${((plan.completedWorkouts || 0) / plan.totalWorkouts) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-sm font-medium text-slate-500 border-t border-slate-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>Started {new Date(plan.startDate).toLocaleDateString()}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProgramsPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member]}>
            <ProgramsList />
        </ProtectedRoute>
    );
}
