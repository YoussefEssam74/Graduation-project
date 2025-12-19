"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    workoutPlansApi,
    nutritionPlansApi,
    bookingsApi,
    type MemberWorkoutPlanDto,
    type NutritionPlanDto,
    type BookingDto
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dumbbell,
    Utensils,
    Calendar,
    Clock,
    ChevronRight,
    User,
    Loader2,
    Plus,
    Target,
    Flame,
    TrendingUp,
    XCircle,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export default function ProgramsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();

    // Data states
    const [workoutPlans, setWorkoutPlans] = useState<MemberWorkoutPlanDto[]>([]);
    const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanDto[]>([]);
    const [bookings, setBookings] = useState<BookingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    // Fetch all data
    useEffect(() => {
        if (!user?.userId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [workoutRes, nutritionRes, bookingsRes] = await Promise.all([
                    workoutPlansApi.getMemberPlans(user.userId),
                    nutritionPlansApi.getMemberPlans(user.userId),
                    bookingsApi.getUserBookings(user.userId)
                ]);

                if (workoutRes.success && workoutRes.data) {
                    setWorkoutPlans(workoutRes.data);
                }
                if (nutritionRes.success && nutritionRes.data) {
                    setNutritionPlans(nutritionRes.data);
                }
                if (bookingsRes.success && bookingsRes.data) {
                    setBookings(bookingsRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Get active plans
    const activeWorkoutPlan = useMemo(() =>
        workoutPlans.find(p => p.status === 1) || workoutPlans[0],
        [workoutPlans]);

    const activeNutritionPlan = useMemo(() =>
        nutritionPlans.find(p => p.isActive) || nutritionPlans[0],
        [nutritionPlans]);

    // Get upcoming bookings (next 7 days)
    const upcomingBookings = useMemo(() => {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return bookings
            .filter(b => {
                const bookingDate = new Date(b.startTime);
                return bookingDate >= now && bookingDate <= weekFromNow && b.status !== 2; // Not cancelled
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 5);
    }, [bookings]);

    // Today's bookings
    const todaysBookings = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return bookings.filter(b => {
            const bookingDate = new Date(b.startTime).toISOString().split('T')[0];
            return bookingDate === today && b.status !== 2;
        });
    }, [bookings]);

    // Cancel booking handler
    const handleCancelBooking = async (bookingId: number) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        setCancellingId(bookingId);
        try {
            const response = await bookingsApi.cancelBooking(bookingId, "User cancelled");
            if (response.success) {
                setBookings(prev => prev.filter(b => b.bookingId !== bookingId));
                showToast("Booking cancelled successfully", "success");
            } else {
                showToast(response.message || "Failed to cancel", "error");
            }
        } catch (error) {
            showToast("An error occurred", "error");
        } finally {
            setCancellingId(null);
        }
    };

    // Calculate workout progress
    const workoutProgress = activeWorkoutPlan
        ? Math.round(((activeWorkoutPlan.completedWorkouts || 0) / (activeWorkoutPlan.totalWorkouts || 1)) * 100)
        : 0;

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
            <div className="min-h-screen p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Welcome Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Welcome back,</p>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                                {user?.name?.split(' ')[0] || 'Athlete'} 👋
                            </h1>
                            <p className="text-slate-500 mt-1">
                                {todaysBookings.length > 0
                                    ? `You have ${todaysBookings.length} session${todaysBookings.length > 1 ? 's' : ''} today`
                                    : "No sessions scheduled for today"
                                }
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/book-equipment">
                                <Button variant="outline" className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50">
                                    <Dumbbell className="h-4 w-4" />
                                    Book Equipment
                                </Button>
                            </Link>
                            <Link href="/book-coach">
                                <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700">
                                    <User className="h-4 w-4" />
                                    Book Coach
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{upcomingBookings.length}</p>
                                    <p className="text-xs text-blue-100">Upcoming Sessions</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-none shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{workoutProgress}%</p>
                                    <p className="text-xs text-green-100">Plan Progress</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-none shadow-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Flame className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{activeNutritionPlan?.dailyCalories || 0}</p>
                                    <p className="text-xs text-orange-100">Daily Calories</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{activeWorkoutPlan?.completedWorkouts || 0}</p>
                                    <p className="text-xs text-purple-100">Workouts Done</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">

                        {/* LEFT COLUMN - Plans */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Active Workout Plan */}
                            <Card className="p-0 border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                                <div className="p-6 pb-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                                <Dumbbell className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900">Workout Plan</h2>
                                                <p className="text-sm text-slate-500">Your active training program</p>
                                            </div>
                                        </div>
                                        {activeWorkoutPlan && (
                                            <Link href={`/programs/${activeWorkoutPlan.memberPlanId}`}>
                                                <Button variant="ghost" className="text-blue-600 font-bold text-sm gap-1 hover:bg-blue-50">
                                                    View Details <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {activeWorkoutPlan ? (
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 mb-1">{activeWorkoutPlan.planName}</h3>
                                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs">
                                                        {activeWorkoutPlan.statusText}
                                                    </span>
                                                    {activeWorkoutPlan.coachName && (
                                                        <span className="text-slate-500">
                                                            by Coach {activeWorkoutPlan.coachName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-2xl font-black text-slate-900">{activeWorkoutPlan.completedWorkouts || 0}</p>
                                                    <p className="text-xs text-slate-500">Completed</p>
                                                </div>
                                                <div className="w-px h-10 bg-slate-200"></div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-black text-slate-900">{activeWorkoutPlan.totalWorkouts || 0}</p>
                                                    <p className="text-xs text-slate-500">Total</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex justify-between text-sm font-bold mb-2">
                                                <span className="text-slate-600">Progress</span>
                                                <span className="text-blue-600">{workoutProgress}%</span>
                                            </div>
                                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${workoutProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Dumbbell className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1">No Active Workout Plan</h3>
                                        <p className="text-sm text-slate-500 mb-4">Get started by booking a coach to create your personalized plan</p>
                                        <Link href="/book-coach">
                                            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                                                <Plus className="h-4 w-4 mr-2" /> Get a Plan
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </Card>

                            {/* Active Nutrition Plan */}
                            <Card className="p-0 border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                                <div className="p-6 pb-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                                                <Utensils className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900">Nutrition Plan</h2>
                                                <p className="text-sm text-slate-500">Your daily macro targets</p>
                                            </div>
                                        </div>
                                        {activeNutritionPlan && (
                                            <Button variant="ghost" className="text-green-600 font-bold text-sm gap-1 hover:bg-green-50">
                                                View Details <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {activeNutritionPlan ? (
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-orange-50 rounded-2xl p-4 text-center">
                                                <p className="text-3xl font-black text-orange-600">{activeNutritionPlan.dailyCalories}</p>
                                                <p className="text-xs font-bold text-orange-600/70 uppercase tracking-wider">Calories</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-2xl p-4 text-center">
                                                <p className="text-3xl font-black text-blue-600">{activeNutritionPlan.proteinGrams}g</p>
                                                <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider">Protein</p>
                                            </div>
                                            <div className="bg-yellow-50 rounded-2xl p-4 text-center">
                                                <p className="text-3xl font-black text-yellow-600">{activeNutritionPlan.carbsGrams}g</p>
                                                <p className="text-xs font-bold text-yellow-600/70 uppercase tracking-wider">Carbs</p>
                                            </div>
                                            <div className="bg-purple-50 rounded-2xl p-4 text-center">
                                                <p className="text-3xl font-black text-purple-600">{activeNutritionPlan.fatGrams}g</p>
                                                <p className="text-xs font-bold text-purple-600/70 uppercase tracking-wider">Fats</p>
                                            </div>
                                        </div>

                                        {/* Plan description if available */}
                                        {activeNutritionPlan.description && (
                                            <div className="bg-slate-50 rounded-xl p-4">
                                                <p className="text-sm text-slate-600">{activeNutritionPlan.description}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Utensils className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1">No Nutrition Plan Yet</h3>
                                        <p className="text-sm text-slate-500 mb-4">Work with a coach to get a customized diet plan</p>
                                        <Link href="/generate-program">
                                            <Button variant="outline" className="rounded-xl">
                                                <Sparkles className="h-4 w-4 mr-2" /> Generate with AI
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* RIGHT COLUMN - Upcoming Bookings */}
                        <div className="space-y-6">
                            <Card className="p-0 border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                                <div className="p-6 pb-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-slate-900">Upcoming Sessions</h2>
                                        <Link href="/bookings">
                                            <Button variant="ghost" size="sm" className="text-blue-600 font-bold text-sm gap-1 hover:bg-blue-50 h-8">
                                                See All <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {upcomingBookings.length > 0 ? (
                                        <div className="space-y-3">
                                            {upcomingBookings.map((booking) => {
                                                const bookingDate = new Date(booking.startTime);
                                                const isToday = bookingDate.toDateString() === new Date().toDateString();
                                                const isTomorrow = bookingDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                                                return (
                                                    <div
                                                        key={booking.bookingId}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-l-4 transition-all",
                                                            booking.coachId
                                                                ? "bg-blue-50/50 border-blue-500"
                                                                : "bg-green-50/50 border-green-500"
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                                                        isToday ? "bg-green-500 text-white" :
                                                                            isTomorrow ? "bg-orange-100 text-orange-700" :
                                                                                "bg-slate-100 text-slate-600"
                                                                    )}>
                                                                        {isToday ? "Today" : isTomorrow ? "Tomorrow" : bookingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-bold text-slate-900 truncate">
                                                                    {booking.coachName || booking.equipmentName}
                                                                </h4>
                                                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    {bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCancelBooking(booking.bookingId)}
                                                                disabled={cancellingId === booking.bookingId}
                                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Cancel booking"
                                                            >
                                                                {cancellingId === booking.bookingId ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Calendar className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 mb-1">No Upcoming Sessions</h3>
                                            <p className="text-sm text-slate-500 mb-4">Book equipment or a coach to get started</p>
                                            <div className="flex flex-col gap-2">
                                                <Link href="/book-coach" className="w-full">
                                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl">
                                                        <User className="h-4 w-4 mr-2" /> Book a Coach
                                                    </Button>
                                                </Link>
                                                <Link href="/book-equipment" className="w-full">
                                                    <Button variant="outline" className="w-full rounded-xl">
                                                        <Dumbbell className="h-4 w-4 mr-2" /> Book Equipment
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Quick Links */}
                            <Card className="p-4 border-none shadow-sm bg-slate-900 text-white rounded-3xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Need a new plan?</h3>
                                        <p className="text-sm text-slate-400">Generate with AI Coach</p>
                                    </div>
                                </div>
                                <Link href="/ai-coach">
                                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold">
                                        Talk to AI Coach <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
