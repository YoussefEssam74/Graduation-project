"use client";

import {
  Users,
  Calendar,
  CreditCard,
  Bell,
  UserPlus,
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
  DollarSign,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { useState } from "react";

function ReceptionDashboardContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for receptionist
  const mockStats = {
    checkedInToday: 87,
    activeMembers: 342,
    pendingBookings: 12,
    todayRevenue: 2450,
  };

  const recentCheckIns = [
    { id: 1, name: "Ahmed Hassan", memberID: "M-1024", time: "Just now", status: "active" },
    { id: 2, name: "Sara Mohamed", memberID: "M-0987", time: "5 min ago", status: "active" },
    { id: 3, name: "Omar Ali", memberID: "M-1156", time: "12 min ago", status: "active" },
    { id: 4, name: "Fatma Ibrahim", memberID: "M-0845", time: "18 min ago", status: "active" },
  ];

  const pendingBookings = [
    { id: 1, member: "Karim Youssef", equipment: "Treadmill 3", time: "10:00 AM - 11:00 AM", status: "pending" },
    { id: 2, member: "Nour Ahmed", coach: "Coach Sarah", time: "11:30 AM - 12:30 PM", status: "pending" },
    { id: 3, member: "Hassan Ali", equipment: "Bench Press 2", time: "2:00 PM - 3:00 PM", status: "pending" },
  ];

  const upcomingVisits = [
    { id: 1, name: "Mohamed Ibrahim", subscription: "Premium", expiresIn: "3 days", status: "warning" },
    { id: 2, name: "Layla Hassan", subscription: "Basic", expiresIn: "1 day", status: "critical" },
    { id: 3, name: "Ali Youssef", subscription: "Gold", expiresIn: "7 days", status: "good" },
  ];

  const quickActions = [
    { icon: UserPlus, label: "New Member", color: "text-blue-500", bgColor: "bg-blue-100", href: "/reception-new-member" },
    { icon: Calendar, label: "Manage Bookings", color: "text-purple-500", bgColor: "bg-purple-100", href: "/reception-bookings" },
    { icon: CreditCard, label: "Process Payment", color: "text-green-500", bgColor: "bg-green-100", href: "/reception-payments" },
    { icon: Bell, label: "Notifications", color: "text-orange-500", bgColor: "bg-orange-100", href: "/reception-notifications" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Reception Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Button className="h-11">
            <UserPlus className="h-5 w-5 mr-2" />
            New Member
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.checkedInToday}</div>
          <div className="text-sm text-muted-foreground">Checked In Today</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.activeMembers}</div>
          <div className="text-sm text-muted-foreground">Active Members</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
              {mockStats.pendingBookings}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">{mockStats.pendingBookings}</div>
          <div className="text-sm text-muted-foreground">Pending Bookings</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">${mockStats.todayRevenue}</div>
          <div className="text-sm text-muted-foreground">Today's Revenue</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <Card className="p-5 border border-border hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${action.bgColor} rounded-full`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <span className="font-semibold">{action.label}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Check-Ins */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-green-500" />
              Recent Check-Ins
            </h3>
            <span className="text-sm text-muted-foreground">{recentCheckIns.length} active now</span>
          </div>

          <div className="space-y-3">
            {recentCheckIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{checkIn.name}</h4>
                    <p className="text-sm text-muted-foreground">{checkIn.memberID}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{checkIn.time}</p>
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            View All Check-Ins
          </Button>
        </Card>

        {/* Pending Bookings */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-orange-500" />
              Pending Bookings
            </h3>
            <span className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
              {mockStats.pendingBookings} Pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{booking.member}</h4>
                  <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                    Pending
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{booking.equipment || booking.coach}</p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {booking.time}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    Reject
                  </Button>
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    Confirm
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            View All Bookings
          </Button>
        </Card>
      </div>

      {/* Subscription Expiry Alerts */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-orange-500" />
            Subscription Expiry Alerts
          </h3>
          <span className="text-sm text-muted-foreground">{upcomingVisits.length} members</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {upcomingVisits.map((visit) => (
            <div
              key={visit.id}
              className={`p-4 border-2 rounded-lg ${
                visit.status === "critical"
                  ? "border-red-200 bg-red-50"
                  : visit.status === "warning"
                  ? "border-orange-200 bg-orange-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  visit.status === "critical" ? "bg-red-500" : visit.status === "warning" ? "bg-orange-500" : "bg-green-500"
                }`}></div>
                <h4 className="font-semibold">{visit.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{visit.subscription} Plan</p>
              <p className={`text-sm font-medium ${
                visit.status === "critical" ? "text-red-600" : visit.status === "warning" ? "text-orange-600" : "text-green-600"
              }`}>
                Expires in {visit.expiresIn}
              </p>
              <Button size="sm" variant="outline" className="w-full mt-3">
                Contact Member
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function ReceptionDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Reception]}>
      <ReceptionDashboardContent />
    </ProtectedRoute>
  );
}
