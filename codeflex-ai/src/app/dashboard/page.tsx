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
  User,
  MessageCircle,
  Star,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { statsApi, bookingsApi, MemberStatsDto, BookingDto } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ChatDialog } from "@/components/Chat/ChatDialog";

function DashboardContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<MemberStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedCoach, setAssignedCoach] = useState<{
    id: number;
    name: string;
    specialization: string;
    rating: number;
    upcomingSession: string | null;
  } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  // Recent bookings state
  const [recentBookings, setRecentBookings] = useState<BookingDto[]>([]);

  // Fetch user's recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      if (!user?.userId) return;
      
      try {
        const response = await bookingsApi.getUserBookings(user.userId);
        if (response.success && response.data) {
          // Get latest 4 bookings
          setRecentBookings(response.data.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch recent bookings:", error);
      }
    };

    fetchRecentBookings();
  }, [user?.userId]);

  // Fetch user's coach from recent bookings
  useEffect(() => {
    const fetchCoachInfo = async () => {
      if (!user?.userId) return;
      
      try {
        const response = await bookingsApi.getUserBookings(user.userId);
        if (response.success && response.data) {
          // Find most recent coach booking
          const coachBookings = response.data.filter((b: BookingDto) => b.coachId && b.coachName);
          if (coachBookings.length > 0) {
            // Sort by startTime descending to get most recent
            const sortedBookings = [...coachBookings].sort((a, b) => 
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            );
            const latestCoach = sortedBookings[0];
            
            // Find next upcoming session (future bookings only)
            const now = new Date();
            const upcomingSession = coachBookings.find(
              (b: BookingDto) => 
                (b.status === 0 || b.status === 1) && // pending or confirmed
                new Date(b.startTime) > now
            );
            
            setAssignedCoach({
              id: latestCoach.coachId!,
              name: latestCoach.coachName!,
              specialization: "Personal Training",
              rating: 4.8,
              upcomingSession: upcomingSession 
                ? new Date(upcomingSession.startTime).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })
                : null,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch coach info:", error);
      }
    };

    fetchCoachInfo();
  }, [user?.userId]);

  // Handle cancel booking
  const handleCancelBooking = async (bookingId: number, bookingName: string) => {
    if (!confirm(`Are you sure you want to cancel booking for ${bookingName}?`)) {
      return;
    }

    try {
      const response = await bookingsApi.cancelBooking(bookingId, "Cancelled by user");
      
      if (response.success) {
        showToast("Booking cancelled successfully", "success");
        // Refresh bookings
        if (user?.userId) {
          const bookingsResponse = await bookingsApi.getUserBookings(user.userId);
          if (bookingsResponse.success && bookingsResponse.data) {
            setRecentBookings(bookingsResponse.data.slice(0, 4));
          }
        }
      } else {
        showToast(response.message || "Failed to cancel booking", "error");
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      showToast("Failed to cancel booking", "error");
    }
  };

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

  // Helper function to get status badge
  // Backend enum: Pending=0, Confirmed=1, Cancelled=2, Completed=3, NoShow=4
  const getStatusBadge = (status: number, checkInTime?: string, checkOutTime?: string) => {
    // If checked in but not checked out, show "In Progress"
    if (status === 1 && checkInTime && !checkOutTime) {
      return { text: "In Progress", color: "text-blue-600", bg: "bg-blue-100" };
    }
    switch (status) {
      case 0: return { text: "Pending", color: "text-orange-600", bg: "bg-orange-100" };
      case 1: return { text: "Confirmed", color: "text-green-600", bg: "bg-green-100" };
      case 2: return { text: "Cancelled", color: "text-red-600", bg: "bg-red-100" };
      case 3: return { text: "Completed", color: "text-purple-600", bg: "bg-purple-100" };
      case 4: return { text: "No Show", color: "text-gray-600", bg: "bg-gray-100" };
      default: return { text: "Unknown", color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

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
        {/* My Coach Card */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">
            <span className="text-foreground">My </span>
            <span className="text-primary">Coach</span>
          </h3>
          {assignedCoach ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="p-4 bg-primary/10 rounded-full">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{assignedCoach.name}</h4>
                  <p className="text-sm text-muted-foreground">{assignedCoach.specialization}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{assignedCoach.rating}/5.0</span>
                  </div>
                </div>
              </div>
              
              {assignedCoach.upcomingSession && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Next Session</p>
                    <p className="text-xs text-green-600">{assignedCoach.upcomingSession}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Link href="/bookings" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                </Link>
                <Button 
                  className="flex-1" 
                  onClick={() => setIsChatOpen(true)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No coach assigned yet</p>
              <p className="text-sm text-muted-foreground mb-4">Book a session with a coach to get started</p>
              <Link href="/bookings">
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Find a Coach
                </Button>
              </Link>
            </div>
          )}
        </Card>

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
      </div>

      {/* Recent Activity / Bookings */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            <span className="text-foreground">Recent </span>
            <span className="text-primary">Bookings</span>
          </h3>
          <Link href="/bookings">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => {
              const statusBadge = getStatusBadge(booking.status, booking.checkInTime, booking.checkOutTime);
              const isInProgress = booking.status === 1 && booking.checkInTime && !booking.checkOutTime;
              const canCancel = (booking.status === 0 || booking.status === 1) && !isInProgress; // Pending or Confirmed (but not in progress)
              return (
                <div
                  key={booking.bookingId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 relative group"
                >
                  <div className="p-2 bg-card rounded-full border border-border">
                    {booking.coachId ? (
                      <User className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Dumbbell className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {booking.coachName || booking.equipmentName || booking.bookingType}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${statusBadge.bg} ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                      <span className="text-xs text-muted-foreground">{getTimeAgo(booking.createdAt)}</span>
                    </div>
                  </div>
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancelBooking(
                        booking.bookingId,
                        booking.coachName || booking.equipmentName || booking.bookingType
                      )}
                      title="Cancel booking"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent bookings</p>
              <Link href="/bookings">
                <Button variant="link" className="mt-2">Make your first booking</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

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

      {/* Chat Dialog */}
      {isChatOpen && assignedCoach && (
        <ChatDialog
          recipientId={assignedCoach.id}
          recipientName={assignedCoach.name}
          recipientRole="coach"
          onClose={() => setIsChatOpen(false)}
        />
      )}
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
