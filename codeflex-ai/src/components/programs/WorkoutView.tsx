"use client";

import { type MemberWorkoutPlanDto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
    Dumbbell,
    Calendar,
    User,
    Activity,
} from "lucide-react";

export function WorkoutView({ activePlan }: { activePlan: MemberWorkoutPlanDto | null }) {
    if (!activePlan) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-slate-100 rounded-2xl mb-4">
                    <Dumbbell className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Plan</h3>
                <p className="text-slate-500 text-sm">You don&apos;t have an active workout plan yet.</p>
            </div>
        );
    }

    const progress =
        activePlan.totalWorkouts && activePlan.totalWorkouts > 0
            ? Math.round(((activePlan.completedWorkouts ?? 0) / activePlan.totalWorkouts) * 100)
            : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                    <Dumbbell className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Workout Plan</h2>
            </div>

            <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-[32px]">
                <h3 className="text-2xl font-black text-slate-900 mb-1">{activePlan.planName}</h3>
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full mb-6">
                    {activePlan.statusText}
                </span>

                <div className="space-y-3">
                    {activePlan.coachName && (
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <User className="h-4 w-4 text-slate-400" />
                            <span>Coach: <span className="font-semibold">{activePlan.coachName}</span></span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>
                            Started:{" "}
                            <span className="font-semibold">
                                {new Date(activePlan.startDate).toLocaleDateString()}
                            </span>
                            {activePlan.endDate && (
                                <>
                                    {" "}→{" "}
                                    <span className="font-semibold">
                                        {new Date(activePlan.endDate).toLocaleDateString()}
                                    </span>
                                </>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Activity className="h-4 w-4 text-slate-400" />
                        <span>
                            Progress:{" "}
                            <span className="font-semibold">
                                {activePlan.completedWorkouts ?? 0} / {activePlan.totalWorkouts ?? "?"} workouts
                            </span>
                        </span>
                    </div>
                </div>

                {activePlan.totalWorkouts && activePlan.totalWorkouts > 0 && (
                    <div className="mt-6">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                            <span>Completion</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {activePlan.notes && (
                    <div className="mt-6 bg-slate-50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-slate-700 mb-1">Coach Notes</p>
                        <p className="text-sm text-slate-500 leading-relaxed">{activePlan.notes}</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
