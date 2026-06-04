"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Dumbbell,
  UserCog,
  PackageOpen,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  Loader2,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { statsApi, type AdminStatsDto } from "@/lib/api/stats";
import { auditLogsApi, type AuditLogDto } from "@/lib/api/auditLogs";
import { usersApi, type CoachDto } from "@/lib/api/users";

function AdminDashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [activities, setActivities] = useState<AuditLogDto[]>([]);
  const [topCoaches, setTopCoaches] = useState<CoachDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats, activities, and coaches in parallel
      const [statsRes, logsRes, coachesRes] = await Promise.all([
        statsApi.getAdminStats(),
        auditLogsApi.getAllAuditLogs({ pageSize: 5 }),
        usersApi.getCoachesWithProfiles(true),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        throw new Error(statsRes.errors?.[0] || statsRes.message || "Failed to load admin stats");
      }

      if (logsRes.success && logsRes.data) {
        setActivities(logsRes.data);
      }

      if (coachesRes.success && coachesRes.data) {
        // Sort coaches by rating descending and limit to top 3
        const sorted = [...coachesRes.data]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        setTopCoaches(sorted);
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to fetch dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: UserCog, label: "Manage Staff", color: "text-purple-500", bgColor: "bg-purple-100", href: "/admin-coaches" },
    { icon: UserPlus, label: "Create Staff", color: "text-emerald-500", bgColor: "bg-emerald-100", href: "/admin-users" },
    { icon: Dumbbell, label: "Equipment Management", color: "text-green-500", bgColor: "bg-green-100", href: "/admin-equipment" },
    { icon: BarChart3, label: "Analytics & Reports", color: "text-orange-500", bgColor: "bg-orange-100", href: "/admin-analytics" },
    { icon: PackageOpen, label: "Packages & Coupons", color: "text-red-500", bgColor: "bg-red-100", href: "/admin-packages" },
    { icon: FileText, label: "Activity Log", color: "text-blue-500", bgColor: "bg-blue-100", href: "/admin-activity-log" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium mt-4">Loading Admin Dashboard...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-8 border border-red-200 bg-red-50 text-center max-w-md mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-red-700 mb-4">{error || "Could not retrieve statistics."}</p>
          <Button
            onClick={fetchDashboardData}
            className="bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const systemAlerts = [
    stats.pendingIssues > 0 
      ? { id: 1, type: "maintenance", message: `${stats.pendingIssues} pieces of equipment require attention`, severity: "warning" as const, time: "Active" }
      : null,
    { id: 2, type: "uptime", message: `System performance is normal with ${stats.systemUptime}% uptime`, severity: "info" as const, time: "Current" }
  ].filter(Boolean);

  const getActivityColorAndIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("add") || act.includes("register")) {
      return { color: "text-green-500", bg: "bg-green-100", icon: Users };
    }
    if (act.includes("delete") || act.includes("remove") || act.includes("deactivate")) {
      return { color: "text-red-500", bg: "bg-red-100", icon: AlertTriangle };
    }
    if (act.includes("update") || act.includes("edit") || act.includes("change")) {
      return { color: "text-blue-500", bg: "bg-blue-100", icon: UserCog };
    }
    return { color: "text-purple-500", bg: "bg-purple-100", icon: Activity };
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span> • System Administrator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg border border-green-400">
            <div className="text-white">
              <div className="text-xs font-medium opacity-90">System Uptime</div>
              <div className="text-2xl font-bold">{stats.systemUptime}%</div>
            </div>
          </div>
          {stats.pendingIssues > 0 && (
            <div className="px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg border border-red-400">
              <div className="text-white">
                <div className="text-xs font-medium opacity-90">Pending Issues</div>
                <div className="text-2xl font-bold">{stats.pendingIssues}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-gradient-to-br from-blue-50 to-blue-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Users className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.totalMembers}</div>
          <div className="text-sm text-blue-700 font-medium">Total Members</div>
          <div className="text-xs text-blue-600 mt-1">Active users database</div>
        </Card>

        <Card className="p-6 border border-border bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-full">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.monthlyRevenue.toLocaleString()} EGP</div>
          <div className="text-sm text-green-700 font-medium">Monthly Revenue</div>
          <div className="text-xs text-green-600 mt-1">Direct gym payments</div>
        </Card>

        <Card className="p-6 border border-border bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-full">
              <UserCog className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.activeCoaches}</div>
          <div className="text-sm text-purple-700 font-medium">Active Coaches</div>
          <div className="text-xs text-purple-600 mt-1">Certified profiles</div>
        </Card>

        <Card className="p-6 border border-border bg-gradient-to-br from-orange-50 to-orange-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-full">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <CheckCircle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold mb-1">{stats.equipmentCount}</div>
          <div className="text-sm text-orange-700 font-medium">Equipment Items</div>
          <div className="text-xs text-orange-600 mt-1">Tracked in inventory</div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-5 border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
              <div className="text-sm text-muted-foreground">Check-ins Today</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.tokensSold.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Tokens Distributed</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.pendingIssues}</div>
              <div className="text-sm text-muted-foreground">Pending Issues</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 border border-border shadow-sm">
        <h3 className="text-xl font-bold mb-5">Quick Actions</h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <div className="flex flex-col items-center gap-3 p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer bg-card/60 backdrop-blur-sm">
                  <div className={`p-4 ${action.bgColor} rounded-full`}>
                    <Icon className={`h-7 w-7 ${action.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-center">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              System Alerts
            </h3>
            {stats.pendingIssues > 0 && (
              <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                {stats.pendingIssues} Active
              </span>
            )}
          </div>

          <div className="space-y-4">
            {systemAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === "critical"
                    ? "bg-red-50 border-red-500 dark:bg-red-950"
                    : alert.severity === "warning"
                    ? "bg-orange-50 border-orange-500 dark:bg-orange-950"
                    : "bg-blue-50 border-blue-500 dark:bg-blue-950"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          alert.severity === "critical"
                            ? "bg-red-200 text-red-800"
                            : alert.severity === "warning"
                            ? "bg-orange-200 text-orange-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm text-foreground/80 mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Coaches */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UserCog className="h-6 w-6 text-purple-500" />
              Top Performing Coaches
            </h3>
            <Link href="/admin-coaches">
              <Button size="sm" variant="outline">View All</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {topCoaches.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No coaches found. Create them in Create Staff.</p>
            ) : (
              topCoaches.map((coach, index) => (
                <div
                  key={coach.userId}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full font-bold text-primary">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{coach.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{coach.totalClients || 0} clients</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        ⭐ {(coach.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{coach.hourlyRate || 0} EGP</div>
                    <div className="text-xs text-muted-foreground">hourly fee</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Recent System Activities
          </h3>
          <Link href="/admin-activity-log">
            <Button size="sm" variant="outline">View Full Log</Button>
          </Link>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No recent logs found.</p>
          ) : (
            activities.map((activity) => {
              const { color, bg, icon: Icon } = getActivityColorAndIcon(activity.action);
              return (
                <div
                  key={activity.logId}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/40"
                >
                  <div className={`p-2 ${bg} rounded-lg`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {activity.userName || `User #${activity.userId}`} performed: <span className="text-primary">{activity.action}</span> on {activity.tableName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleString()} • IP: {activity.ipAddress || "System"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Revenue Trend Chart */}
      {stats.revenueTrend && stats.revenueTrend.length > 0 && (
        <Card className="p-6 border border-border">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-500" />
            Revenue Overview (Last 3 Months)
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {stats.revenueTrend.map((data) => (
              <div key={data.month} className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-muted-foreground mb-2">{data.month}</div>
                <div className="text-3xl font-bold text-green-600 mb-1">{(data.revenue / 1000).toFixed(1)}k EGP</div>
                <div className="text-xs text-muted-foreground">{data.members} members</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
