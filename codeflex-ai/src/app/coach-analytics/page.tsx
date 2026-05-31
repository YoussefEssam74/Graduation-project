"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Star,
  Activity,
  Award,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { statsApi, bookingsApi, type CoachStatsDto, type BookingDto } from "@/lib/api";

function CoachAnalyticsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [stats, setStats] = useState<CoachStatsDto | null>(null);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;

      try {
        setIsLoading(true);
        // Fetch stats & booking history (for range of 1 year back to today)
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);

        const [statsRes, bookingsRes] = await Promise.all([
          statsApi.getCoachStats(user.userId),
          bookingsApi.getCoachBookings(user.userId, yearAgo.toISOString(), new Date().toISOString()),
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (bookingsRes.success && bookingsRes.data) {
          setBookings(bookingsRes.data);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        showToast("An error occurred while loading analytics", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, showToast]);

  // Filter bookings based on selected time range
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();

    if (timeRange === "week") {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeRange === "month") {
      cutoff.setMonth(now.getMonth() - 1);
    } else if (timeRange === "year") {
      cutoff.setFullYear(now.getFullYear() - 1);
    }

    return bookings.filter((b) => new Date(b.startTime) >= cutoff);
  }, [bookings, timeRange]);

  // Group bookings by month for earnings chart
  const earningsBreakdown = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const completed = bookings.filter((b) => b.statusText === "Completed");

    // Grab the last 6 calendar months
    const breakdown: { month: string; earnings: number; sessions: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();

      const monthBookings = completed.filter((b) => {
        const bDate = new Date(b.startTime);
        return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === year;
      });

      const earnings = monthBookings.reduce((sum, b) => sum + (b.tokensCost || 0), 0);
      breakdown.push({
        month: monthName,
        earnings,
        sessions: monthBookings.length,
      });
    }

    return breakdown;
  }, [bookings]);

  // Top clients aggregator based on completed sessions & tokens revenue
  const topClients = useMemo(() => {
    const completed = bookings.filter((b) => b.statusText === "Completed");
    const clientMap: { [userId: number]: { name: string; sessions: number; revenue: number } } = {};

    completed.forEach((b) => {
      if (!clientMap[b.userId]) {
        clientMap[b.userId] = { name: b.userName || "Unknown Client", sessions: 0, revenue: 0 };
      }
      clientMap[b.userId].sessions += 1;
      clientMap[b.userId].revenue += b.tokensCost || 0;
    });

    return Object.values(clientMap)
      .sort((a, b) => b.sessions - a.sessions || b.revenue - a.revenue)
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        sessions: c.sessions,
        revenue: c.revenue,
        rating: 5.0,
      }));
  }, [bookings]);

  // Session Types distribution calculated from booking notes keywords
  const sessionTypes = useMemo(() => {
    const completed = bookings.filter((b) => b.statusText === "Completed");
    if (completed.length === 0) {
      return [
        { type: "Personal Training", count: 0, percentage: 0, color: "bg-blue-500" },
        { type: "Nutrition Consultation", count: 0, percentage: 0, color: "bg-green-500" },
        { type: "Form Check", count: 0, percentage: 0, color: "bg-yellow-500" },
        { type: "Online Coaching", count: 0, percentage: 0, color: "bg-purple-500" },
      ];
    }

    let personalTraining = 0;
    let nutrition = 0;
    let formCheck = 0;
    let online = 0;

    completed.forEach((b) => {
      const notes = (b.notes || "").toLowerCase();
      if (notes.includes("nutrition") || notes.includes("diet") || notes.includes("meal")) {
        nutrition++;
      } else if (notes.includes("form") || notes.includes("check") || notes.includes("posture")) {
        formCheck++;
      } else if (notes.includes("online") || notes.includes("virtual") || notes.includes("video")) {
        online++;
      } else {
        personalTraining++;
      }
    });

    const total = completed.length;
    return [
      {
        type: "Personal Training",
        count: personalTraining,
        percentage: Math.round((personalTraining / total) * 1000) / 10,
        color: "bg-blue-500",
      },
      {
        type: "Nutrition Consultation",
        count: nutrition,
        percentage: Math.round((nutrition / total) * 1000) / 10,
        color: "bg-green-500",
      },
      {
        type: "Form Check",
        count: formCheck,
        percentage: Math.round((formCheck / total) * 1000) / 10,
        color: "bg-yellow-500",
      },
      {
        type: "Online Coaching",
        count: online,
        percentage: Math.round((online / total) * 1000) / 10,
        color: "bg-purple-500",
      },
    ];
  }, [bookings]);

  // Client Retention calculation (percentage of clients who have booked >1 completed session)
  const clientRetention = useMemo(() => {
    const completed = bookings.filter((b) => b.statusText === "Completed");
    const clients = completed.map((b) => b.userId);
    const uniqueClients = Array.from(new Set(clients));

    if (uniqueClients.length === 0) return 0;

    const repeatClients = uniqueClients.filter(
      (cId) => completed.filter((b) => b.userId === cId).length > 1
    ).length;

    return Math.round((repeatClients / uniqueClients.length) * 100);
  }, [bookings]);

  // Range specific calculated values
  const rangeEarnings = useMemo(() => {
    return filteredBookings
      .filter((b) => b.statusText === "Completed")
      .reduce((sum, b) => sum + (b.tokensCost || 0), 0);
  }, [filteredBookings]);

  const rangeSessionsCompleted = useMemo(() => {
    return filteredBookings.filter((b) => b.statusText === "Completed").length;
  }, [filteredBookings]);

  const maxEarning = Math.max(...earningsBreakdown.map((d) => d.earnings)) || 1;

  const achievements = useMemo(() => {
    const list = [
      {
        title: "Top Coach",
        description: stats && stats.averageRating >= 4.5 ? "Maintain high ratings!" : "Average rating objective",
        icon: Award,
        color: stats && stats.averageRating >= 4.5 ? "text-yellow-500" : "text-gray-500",
      },
      {
        title: "High Retention",
        description: `${clientRetention}% repeat booking rate`,
        icon: Target,
        color: clientRetention >= 50 ? "text-green-500" : "text-gray-500",
      },
      {
        title: "Client Magnet",
        description: `${stats?.totalClients || 0} active clients`,
        icon: Users,
        color: (stats?.totalClients || 0) >= 5 ? "text-blue-500" : "text-gray-500",
      },
      {
        title: "Consistent Trainer",
        description: `${stats?.completedBookings || 0} lifetime sessions`,
        icon: Activity,
        color: (stats?.completedBookings || 0) >= 10 ? "text-purple-500" : "text-gray-500",
      },
    ];
    return list;
  }, [stats, clientRetention]);

  // CSV Report Generator
  const handleExportCSV = () => {
    if (bookings.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    let csv = "Date,Client Name,Session Type,Location,Status,Tokens Cost,Notes\n";
    bookings.forEach((b) => {
      const date = new Date(b.startTime).toLocaleDateString();
      const name = b.userName.replace(/,/g, " ");
      const type = b.bookingType.replace(/,/g, " ");
      const location = (b.equipmentName || "Gym Floor").replace(/,/g, " ");
      const status = b.statusText;
      const tokens = b.tokensCost;
      const notes = (b.notes || "").replace(/,/g, " ").replace(/\n/g, " ");
      csv += `"${date}","${name}","${type}","${location}","${status}",${tokens},"${notes}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `coach_analytics_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Analytics report exported successfully as CSV!", "success");
  };

  // Plain-Text Report Generator
  const handleExportText = () => {
    if (!stats) return;

    let content = "========================================\n";
    content += "       INTELLIFIT COACH ANALYTICS       \n";
    content += "========================================\n";
    content += `Coach: ${stats.coachName}\n`;
    content += `Date Generated: ${new Date().toLocaleString()}\n`;
    content += `Time Filter: ${timeRange.toUpperCase()}\n\n`;
    content += `Total Clients: ${stats.totalClients}\n`;
    content += `Total Tokens Earned (Lifetime): ${stats.tokensEarned} Tokens\n`;
    content += `Sessions Completed (Lifetime): ${stats.completedBookings}\n`;
    content += `Average Member Rating: ${stats.averageRating} / 5.0\n`;
    content += `Repeat Client Retention: ${clientRetention}%\n\n`;
    content += "========================================\n";
    content += "          TOP CLIENT LEADERBOARD        \n";
    content += "========================================\n";
    topClients.forEach((c, idx) => {
      content += `#${idx + 1} - ${c.name} | Sessions: ${c.sessions} | Revenue: ${c.revenue} Tokens\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `coach_report_${timeRange}_${new Date().toISOString().split("T")[0]}.txt`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Analytics report downloaded successfully!", "success");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h3 className="font-semibold text-lg">Gathering coach analytics...</h3>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Analytics & Performance</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your coaching performance, schedule metrics, and client engagement
          </p>
        </div>
        <div className="flex gap-2 bg-muted/30 p-1.5 rounded-lg border border-border/50 backdrop-blur-sm self-start">
          <Button
            size="sm"
            variant={timeRange === "week" ? "default" : "ghost"}
            onClick={() => setTimeRange("week")}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={timeRange === "month" ? "default" : "ghost"}
            onClick={() => setTimeRange("month")}
          >
            This Month
          </Button>
          <Button
            size="sm"
            variant={timeRange === "year" ? "default" : "ghost"}
            onClick={() => setTimeRange("year")}
          >
            This Year
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-xs font-semibold text-green-500 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                Active
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold">{rangeEarnings} Tokens</div>
              <div className="text-xs text-muted-foreground">Earnings in Period</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
              <div className="text-xs text-muted-foreground">Total Clients</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{rangeSessionsCompleted}</div>
              <div className="text-xs text-muted-foreground">Completed Sessions</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "0.0"}</div>
              <div className="text-xs text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {(stats?.activeWorkoutPlans || 0) + (stats?.activeNutritionPlans || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Active Plans</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Target className="h-5 w-5 text-cyan-500" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{clientRetention}%</div>
              <div className="text-xs text-muted-foreground">Client Retention</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings Overview Chart */}
        <Card className="lg:col-span-2 p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Earnings Overview</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Tokens Earned</span>
                </div>
              </div>
            </div>

            {/* Bar Chart mapping real monthly earnings */}
            <div className="space-y-4 pt-2">
              {earningsBreakdown.map((data, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground w-12 font-medium">{data.month}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-8 bg-muted/40 rounded-lg overflow-hidden border border-border/30">
                        {data.earnings > 0 ? (
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-lg transition-all flex items-center justify-end pr-2.5 shadow-inner shadow-black/10"
                            style={{ width: `${(data.earnings / maxEarning) * 100}%` }}
                          >
                            <span className="text-xs font-bold text-white drop-shadow-md">
                              {data.earnings} T
                            </span>
                          </div>
                        ) : (
                          <div className="h-full w-0" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {data.sessions} session{data.sessions !== 1 && "s"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Session Types breakdown */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">Session Types</h3>
          {bookings.filter((b) => b.statusText === "Completed").length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border/60 rounded-lg">
              <AlertCircle className="h-8 w-8 text-primary mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No session data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionTypes.map((session, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{session.type}</span>
                    <span className="text-muted-foreground">{session.count} session{session.count !== 1 && "s"}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/20">
                    <div
                      className={`h-full ${session.color} rounded-full transition-all`}
                      style={{ width: `${session.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-right font-medium">
                    {session.percentage}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Clients Leaderboard */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Top Clients Leaderboard
          </h3>
          {topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border/60 rounded-lg bg-card/10">
              <AlertCircle className="h-8 w-8 text-primary mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No bookings history recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border bg-card/35 rounded-lg hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm shadow">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-bold">{client.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {client.sessions} session{client.sessions !== 1 && "s"} completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-500">{client.revenue} Tokens</div>
                    <div className="flex items-center justify-end gap-1 text-xs mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{client.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Achievements Card */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={index}
                  className="p-4 border border-border bg-card/15 rounded-lg hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <Icon className={`h-8 w-8 ${achievement.color} mb-3`} />
                    <h4 className="font-bold text-sm mb-1">{achievement.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                </div>
              );
            })}
          </div>

          {/* Extra Statistics */}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Booking Hours</span>
              </div>
              <span className="font-bold">
                {bookings.filter((b) => b.statusText === "Completed").length} hrs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Average Rating</span>
              </div>
              <span className="font-bold text-yellow-500">
                {stats?.averageRating ? Number(stats.averageRating).toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Client Reviews</span>
              </div>
              <span className="font-bold">{stats?.totalReviews || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Report Card */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">Export Performance Reports</h3>
            <p className="text-sm text-muted-foreground">
              Download your schedule, earnings, and leaderboard data for offline sheets
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={handleExportText}>
              <Download className="h-4 w-4" />
              Download TXT
            </Button>
            <Button className="gap-2" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV Sheet
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CoachAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachAnalyticsContent />
    </ProtectedRoute>
  );
}
