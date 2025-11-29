"use client";

import { useEffect, useState } from "react";
import {
  Dumbbell,
  Calendar,
  Activity,
  Brain,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { statsApi, MemberStatsDto } from "@/lib/api";

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MemberStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.userId) return;
      
      try {
        const response = await statsApi.getMemberStats(user.userId);
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch member stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.userId]);

  // Use stats from API or fallback to defaults
  const displayStats = {
    tokenBalance: user?.tokenBalance ?? 0,
    activeWorkoutPlan: (stats?.activeWorkoutPlans ?? 0) > 0,
    activeDietPlan: (stats?.activeNutritionPlans ?? 0) > 0,
    upcomingBookings: stats?.totalBookings ?? 0,
    completedWorkouts: stats?.totalWorkoutsCompleted ?? 0,
    currentWeight: stats?.currentWeight ?? 0,
    bodyFatPercentage: stats?.currentBodyFat ?? 0,
    nextBooking: "Tomorrow at 10:00 AM",
  };

  const quickActions = [
    {
      icon: Brain,
      title: "AI Coach Chat",
      description: "Get instant fitness advice",
      href: "/ai-coach",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: Dumbbell,
      title: "View Programs",
      description: "Your workout & diet plans",
      href: "/profile",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: Calendar,
      title: "Book Equipment",
      description: "Reserve gym equipment",
      href: "/bookings",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: Activity,
      title: "InBody Scan",
      description: "Track body composition",
      href: "/inbody",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  const recentActivity = [
    {
      type: "workout",
      title: "Completed Leg Day",
      time: "2 hours ago",
      icon: Dumbbell,
      color: "text-blue-500",
    },
    {
      type: "ai",
      title: "Asked AI about recovery",
      time: "5 hours ago",
      icon: Brain,
      color: "text-purple-500",
    },
    {
      type: "booking",
      title: "Booked Bench Press",
      time: "1 day ago",
      icon: Calendar,
      color: "text-green-500",
    },
    {
      type: "inbody",
      title: "InBody Measurement",
      time: "3 days ago",
      icon: Activity,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Welcome back, </span>
            <span className="text-primary">{user?.name?.split(' ')[0] || "Member"}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your fitness overview
          </p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary to-secondary rounded-lg border border-primary/20">
          <Zap className="h-6 w-6 text-white" />
          <div className="text-white">
            <div className="text-xs font-medium opacity-80">Token Balance</div>
            <div className="text-2xl font-bold">{user?.tokenBalance ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold mb-1">
            {isLoading ? "..." : displayStats.completedWorkouts}
          </div>
          <div className="text-sm text-muted-foreground">Workouts Completed</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-green-500">-2.3%</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {isLoading ? "..." : displayStats.bodyFatPercentage > 0 ? `${displayStats.bodyFatPercentage}%` : "N/A"}
          </div>
          <div className="text-sm text-muted-foreground">Body Fat</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-primary">Active</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {isLoading ? "..." : displayStats.upcomingBookings}
          </div>
          <div className="text-sm text-muted-foreground">Total Bookings</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold mb-1">
            {isLoading ? "..." : displayStats.currentWeight > 0 ? `${displayStats.currentWeight} kg` : "N/A"}
          </div>
          <div className="text-sm text-muted-foreground">Current Weight</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          <span className="text-foreground">Quick </span>
          <span className="text-primary">Actions</span>
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer group">
                <div className={`p-3 ${action.bgColor} rounded-full w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Plans & Recent Activity Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Plans */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">
            <span className="text-foreground">Active </span>
            <span className="text-primary">Plans</span>
          </h3>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading plans...</div>
            ) : displayStats.activeWorkoutPlan || displayStats.activeDietPlan ? (
              <>
                {displayStats.activeWorkoutPlan && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Active Workout Program</span>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {stats?.activeWorkoutPlans} active plan{stats?.activeWorkoutPlans !== 1 ? 's' : ''}
                    </p>
                    <div className="w-full bg-border rounded-full h-2">
                      <div className="bg-primary rounded-full h-2 w-1/4"></div>
                    </div>
                  </div>
                )}

                {displayStats.activeDietPlan && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Active Nutrition Plan</span>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {stats?.activeNutritionPlans} active plan{stats?.activeNutritionPlans !== 1 ? 's' : ''}
                    </p>
                    <div className="w-full bg-border rounded-full h-2">
                      <div className="bg-primary rounded-full h-2 w-1/3"></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active plans</p>
                <p className="text-sm mt-2">Generate a new plan to get started</p>
              </div>
            )}

            <Link href="/profile">
              <Button className="w-full" variant="outline">
                View All Plans
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">
            <span className="text-foreground">Recent </span>
            <span className="text-primary">Activity</span>
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="p-2 bg-card rounded-full border border-border">
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CTA Banner */}
      <Card className="p-8 border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              <span className="text-foreground">Need a New </span>
              <span className="text-primary">AI Program?</span>
            </h3>
            <p className="text-muted-foreground mb-4">
              Generate a personalized workout and nutrition plan through AI voice conversation
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>Costs 50 tokens • Takes ~3 minutes</span>
            </div>
          </div>
          <Link href="/generate-program">
            <Button size="lg" className="px-8">
              <Brain className="h-5 w-5 mr-2" />
              Generate Now
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
