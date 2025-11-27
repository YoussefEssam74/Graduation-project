"use client";

import {
  Users,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";

function CoachDashboardContent() {
  const { user } = useAuth();

  // Mock data for coach
  const mockStats = {
    activeClients: 24,
    pendingApprovals: 5,
    upcomingSessions: 8,
    monthlyEarnings: 4500,
    rating: 4.8,
    totalReviews: 127,
  };

  const pendingProgramApprovals = [
    {
      id: 1,
      memberName: "Ahmed Hassan",
      programType: "Workout Plan",
      generatedBy: "AI",
      tokensSpent: 100,
      date: "2 hours ago",
    },
    {
      id: 2,
      memberName: "Sara Mohamed",
      programType: "Nutrition Plan",
      generatedBy: "AI",
      tokensSpent: 80,
      date: "5 hours ago",
    },
    {
      id: 3,
      memberName: "Omar Ali",
      programType: "Full Program",
      generatedBy: "AI",
      tokensSpent: 150,
      date: "1 day ago",
    },
  ];

  const upcomingSessions = [
    { id: 1, member: "Fatma Ibrahim", time: "10:00 AM", type: "Personal Training", duration: "60 min" },
    { id: 2, member: "Karim Youssef", time: "11:30 AM", type: "Form Check", duration: "30 min" },
    { id: 3, member: "Nour Ahmed", time: "2:00 PM", type: "Nutrition Consultation", duration: "45 min" },
  ];

  const recentActivities = [
    { id: 1, type: "approval", text: "Approved workout plan for Ahmed Hassan", time: "1 hour ago", icon: CheckCircle, color: "text-green-500" },
    { id: 2, type: "session", text: "Completed session with Sara Mohamed", time: "3 hours ago", icon: Clock, color: "text-blue-500" },
    { id: 3, type: "review", text: "Received 5-star review from Omar Ali", time: "5 hours ago", icon: Star, color: "text-yellow-500" },
    { id: 4, type: "pending", text: "New approval request from Fatma Ibrahim", time: "6 hours ago", icon: AlertCircle, color: "text-orange-500" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Coach Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
          <Star className="h-5 w-5 text-white fill-white" />
          <div className="text-white">
            <div className="text-2xl font-bold">{mockStats.rating}</div>
            <div className="text-xs opacity-90">{mockStats.totalReviews} reviews</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.activeClients}</div>
          <div className="text-sm text-muted-foreground">Active Clients</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <ClipboardCheck className="h-6 w-6 text-orange-500" />
            </div>
            <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
              {mockStats.pendingApprovals}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.pendingApprovals}</div>
          <div className="text-sm text-muted-foreground">Pending Approvals</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-full">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.upcomingSessions}</div>
          <div className="text-sm text-muted-foreground">Today's Sessions</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold mb-1">${mockStats.monthlyEarnings}</div>
          <div className="text-sm text-muted-foreground">This Month</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-orange-500" />
              Pending Program Approvals
            </h3>
            <span className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
              {mockStats.pendingApprovals} New
            </span>
          </div>

          <div className="space-y-4">
            {pendingProgramApprovals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-start justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{approval.memberName}</h4>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {approval.programType}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Generated by: <span className="text-purple-600 font-medium">{approval.generatedBy}</span></p>
                    <p>Tokens: <span className="font-medium">{approval.tokensSpent}</span> • {approval.date}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Reject
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            View All Approvals
          </Button>
        </Card>

        {/* Today's Schedule */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-500" />
              Today's Schedule
            </h3>
            <span className="text-sm text-muted-foreground">{upcomingSessions.length} sessions</span>
          </div>

          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{session.member}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{session.time}</span>
                    <span>•</span>
                    <span>{session.type}</span>
                    <span>•</span>
                    <span>{session.duration}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Start Session
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            <Calendar className="h-4 w-4 mr-2" />
            View Full Calendar
          </Button>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 border border-border">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-500" />
          Recent Activity
        </h3>

        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 ${activity.color.replace('text-', 'bg-').replace('500', '100')} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/coach-clients">
          <Card className="p-6 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
            <Users className="h-8 w-8 text-blue-500 mb-3" />
            <h4 className="font-semibold mb-2">Manage Clients</h4>
            <p className="text-sm text-muted-foreground">View and manage all your clients</p>
          </Card>
        </Link>

        <Link href="/coach-programs">
          <Card className="p-6 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
            <ClipboardCheck className="h-8 w-8 text-orange-500 mb-3" />
            <h4 className="font-semibold mb-2">Review Programs</h4>
            <p className="text-sm text-muted-foreground">Approve or modify AI-generated plans</p>
          </Card>
        </Link>

        <Link href="/coach-analytics">
          <Card className="p-6 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
            <TrendingUp className="h-8 w-8 text-green-500 mb-3" />
            <h4 className="font-semibold mb-2">View Analytics</h4>
            <p className="text-sm text-muted-foreground">Track performance and earnings</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default function CoachDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachDashboardContent />
    </ProtectedRoute>
  );
}
