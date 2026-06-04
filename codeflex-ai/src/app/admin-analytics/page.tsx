"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Target,
  Award,
  Activity,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { statsApi, type AdminStatsDto } from "@/lib/api/stats";
import { usersApi, type CoachDto } from "@/lib/api/users";

function AdminAnalyticsContent() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [coaches, setCoaches] = useState<CoachDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, coachesRes] = await Promise.all([
        statsApi.getAdminStats(),
        usersApi.getCoachesWithProfiles(true),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        throw new Error(statsRes.errors?.[0] || statsRes.message || "Failed to load admin analytics");
      }

      if (coachesRes.success && coachesRes.data) {
        const sorted = [...coachesRes.data]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        setCoaches(sorted);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading analytics reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-lg font-medium mt-4">Loading Reports and Analytics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-8 border border-red-200 bg-red-50 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Reports</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={fetchAnalyticsData} className="bg-red-600 hover:bg-red-700">
          Try Again
        </Button>
      </Card>
    );
  }

  const metricCards = [
    {
      label: "Total Revenue",
      value: `${stats.monthlyRevenue.toLocaleString()} EGP`,
      change: "+12.5%",
      trend: "up",
      color: "text-green-500",
      bgColor: "bg-green-100",
      icon: DollarSign,
    },
    {
      label: "Active Members",
      value: stats.totalMembers.toString(),
      change: "+8.2%",
      trend: "up",
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      icon: Users,
    },
    {
      label: "Equipment Inventory",
      value: stats.equipmentCount.toString(),
      change: "Items tracked",
      trend: "up",
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      icon: Calendar,
    },
    {
      label: "Active Coaches",
      value: stats.activeCoaches.toString(),
      change: "Profiles verified",
      trend: "up",
      color: "text-orange-500",
      bgColor: "bg-orange-100",
      icon: Target,
    },
  ];

  const maxRevenue = stats.revenueTrend && stats.revenueTrend.length > 0 
    ? Math.max(...stats.revenueTrend.map(m => m.revenue)) 
    : 1;

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <BarChart3 className="h-10 w-10 text-orange-500" />
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground mt-2">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleExport}>
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {metricCards.map((stat, index) => (
          <Card key={index} className="p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                <TrendingUp className="h-4 w-4" />
                {stat.change}
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-500" />
              Revenue Trend
            </h3>
            <span className="text-sm text-muted-foreground">Monthly billing</span>
          </div>
          <div className="space-y-4">
            {stats.revenueTrend && stats.revenueTrend.length > 0 ? (
              stats.revenueTrend.map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{item.month}</span>
                    <span className="text-sm font-bold text-green-600">{item.revenue.toLocaleString()} EGP</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">No trend data available.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-500" />
              Membership Distribution
            </h3>
            <span className="text-sm text-muted-foreground">{stats.totalMembers} Total</span>
          </div>
          <div className="space-y-6">
            {stats.membershipDistribution && stats.membershipDistribution.length > 0 ? (
              stats.membershipDistribution.map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{item.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count} members ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color || "bg-blue-500"} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">No distribution data available.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              Top Performing Coaches
            </h3>
          </div>
          <div className="space-y-4">
            {coaches.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No coaches found.</p>
            ) : (
              coaches.map((coach, index) => (
                <div
                  key={coach.userId}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{coach.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{coach.specialization || "Gym Coach"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {coach.totalClients || 0} Clients
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-lg">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-700">{(coach.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-purple-500" />
              Peak Usage Hours
            </h3>
            <span className="text-sm text-muted-foreground">Check-in patterns</span>
          </div>
          <div className="space-y-3">
            {stats.peakHours && stats.peakHours.length > 0 ? (
              stats.peakHours.map((hour) => (
                <div key={hour.time}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{hour.time}</span>
                    <span className="text-sm font-bold text-purple-600">{hour.usage.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${hour.color || "bg-purple-500"} rounded-full transition-all duration-500`}
                      style={{ width: `${hour.usage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">No peak hour data available.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminAnalyticsContent />
    </ProtectedRoute>
  );
}
