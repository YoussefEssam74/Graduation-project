"use client";

import { useState, useEffect } from "react";
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
  RefreshCw,
  Ticket,
  Copy,
  X,
  CheckCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { bookingsApi, type BookingDto } from "@/lib/api";
import { subscriptionApi, type UserSubscriptionDetailsDto } from "@/lib/api/subscription";
import { invitationsApi, type InvitationDto } from "@/lib/api/invitations";
import { useToast } from "@/components/ui/toast";

// Map booking status from number to string
const mapBookingStatus = (status: number): string => {
  switch (status) {
    case 0: return "Pending";
    case 1: return "Confirmed";
    case 2: return "Completed";
    case 3: return "Cancelled";
    default: return "Pending";
  }
};

function ReceptionDashboardContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Invitation states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationDto[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  
  // Real data states
  const [todaysBookings, setTodaysBookings] = useState<BookingDto[]>([]);
  const [frozenSubscriptions, setFrozenSubscriptions] = useState<UserSubscriptionDetailsDto[]>([]);
  const [stats, setStats] = useState({
    checkedInToday: 0,
    activeMembers: 0,
    pendingBookings: 0,
    todayRevenue: 0,
  });

  // Fetch today's bookings and stats
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // First try to get today's bookings
      const todayResponse = await bookingsApi.getTodaysBookings();
      
      if (todayResponse.success && todayResponse.data && todayResponse.data.length > 0) {
        setTodaysBookings(todayResponse.data);
        
        // Calculate stats from today's bookings
        const pending = todayResponse.data.filter(b => b.status === 0).length;
        const confirmed = todayResponse.data.filter(b => b.status === 1).length;
        const completed = todayResponse.data.filter(b => b.status === 2).length;
        
        setStats({
          checkedInToday: confirmed + completed,
          activeMembers: confirmed,
          pendingBookings: pending,
          todayRevenue: todayResponse.data.reduce((sum, b) => sum + (b.tokensCost || 0), 0),
        });
      } else {
        // Fallback: Get all bookings if no today's bookings
        const allResponse = await bookingsApi.getAllBookings();
        if (allResponse.success && allResponse.data) {
          // Show pending bookings from all bookings
          const allPending = allResponse.data.filter(b => b.status === 0);
          setTodaysBookings(allPending.slice(0, 10)); // Show up to 10 pending
          
          setStats({
            checkedInToday: allResponse.data.filter(b => b.status === 1 || b.status === 2).length,
            activeMembers: allResponse.data.filter(b => b.status === 1).length,
            pendingBookings: allPending.length,
            todayRevenue: allResponse.data.reduce((sum, b) => sum + (b.tokensCost || 0), 0),
          });
        }
      }
      // Fetch frozen subscriptions for receptionist view
      const frozenRes = await subscriptionApi.getFrozenSubscriptions();
      if (frozenRes.success && frozenRes.data) {
        setFrozenSubscriptions(frozenRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get pending bookings for display
  const pendingBookings = todaysBookings
    .filter(b => b.status === 0)
    .slice(0, 5);

  // Get recent check-ins (confirmed bookings)
  const recentCheckIns = todaysBookings
    .filter(b => b.status === 1 || b.status === 2)
    .slice(0, 4)
    .map(b => ({
      id: b.bookingId,
      name: b.userName,
      memberID: `M-${String(b.userId).padStart(4, '0')}`,
      time: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "active"
    }));

  const handleConfirmBooking = async (bookingId: number) => {
    setIsProcessing(true);
    try {
      const response = await bookingsApi.confirmBooking(bookingId);
      if (response.success) {
        showToast("Booking confirmed successfully", "success");
        fetchDashboardData(); // Refresh data
      } else {
        showToast(response.message || "Failed to confirm booking", "error");
      }
    } catch {
      showToast("Failed to confirm booking", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectBooking = async (bookingId: number) => {
    setIsProcessing(true);
    try {
      const response = await bookingsApi.cancelBooking(bookingId, "Rejected by receptionist");
      if (response.success) {
        showToast("Booking rejected", "success");
        fetchDashboardData(); // Refresh data
      } else {
        showToast(response.message || "Failed to reject booking", "error");
      }
    } catch {
      showToast("Failed to reject booking", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    try {
      const res = await invitationsApi.getMyInvitations();
      if (res.success && res.data) setInvitations(res.data);
    } catch {
      // silent
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!inviteExpiry) {
      showToast("Please select an expiry date", "error");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await invitationsApi.create({ expiresAt: new Date(inviteExpiry).toISOString() });
      if (res.success && res.data) {
        setCreatedCode(res.data.code);
        fetchInvitations();
      } else {
        showToast(res.message || "Failed to create invitation", "error");
      }
    } catch {
      showToast("Failed to create invitation", "error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Code copied to clipboard", "success");
  };

  const quickActions = [
    { icon: UserPlus, label: "New Member", color: "text-blue-500", bgColor: "bg-blue-100", href: "/reception-new-member" },
    { icon: Calendar, label: "Manage Bookings", color: "text-purple-500", bgColor: "bg-purple-100", href: "/reception-bookings" },
    { icon: CreditCard, label: "Process Payment", color: "text-green-500", bgColor: "bg-green-100", href: "/reception-payments" },
    { icon: Bell, label: "Notifications", color: "text-orange-500", bgColor: "bg-orange-100", href: "/reception-notifications" },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

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
          <Button className="h-11 gap-2" onClick={fetchDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/reception-new-member">
            <Button className="h-11">
              <UserPlus className="h-5 w-5 mr-2" />
              New Member
            </Button>
          </Link>
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
          <div className="text-2xl font-bold mb-1">{stats.checkedInToday}</div>
          <div className="text-sm text-muted-foreground">Checked In Today</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.activeMembers}</div>
          <div className="text-sm text-muted-foreground">Active Members</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
              {stats.pendingBookings}
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.pendingBookings}</div>
          <div className="text-sm text-muted-foreground">Pending Bookings</div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.todayRevenue} Tokens</div>
          <div className="text-sm text-muted-foreground">Today&apos;s Revenue</div>
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
            {recentCheckIns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No check-ins yet today
              </div>
            )}
          </div>

          <Link href="/reception-bookings">
            <Button variant="outline" className="w-full mt-4">
              View All Check-Ins
            </Button>
          </Link>
        </Card>

        {/* Pending Bookings */}
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-orange-500" />
              Pending Bookings
            </h3>
            <span className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
              {stats.pendingBookings} Pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{booking.userName}</h4>
                  <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                    {mapBookingStatus(booking.status)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{booking.coachName || booking.equipmentName || booking.bookingType}</p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleRejectBooking(booking.bookingId)}
                    disabled={isProcessing}
                  >
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleConfirmBooking(booking.bookingId)}
                    disabled={isProcessing}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            ))}
            {pendingBookings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No pending bookings
              </div>
            )}
          </div>

          <Link href="/reception-bookings">
            <Button variant="outline" className="w-full mt-4">
              View All Bookings
            </Button>
          </Link>
        </Card>
      </div>

      {/* Subscription Expiry Alerts - Coming Soon */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-orange-500" />
            Subscription Expiry Alerts
          </h3>
          <span className="text-sm text-muted-foreground">Coming soon</span>
        </div>

        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Subscription alerts will be available soon</p>
          <p className="text-sm mt-2">This feature will notify you of expiring memberships</p>
        </div>
      </Card>

      {/* Frozen Subscriptions */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Frozen Subscriptions
          </h3>
          <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-600 rounded-full">
            {frozenSubscriptions.length} Frozen
          </span>
        </div>

        {frozenSubscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subscriptions are currently frozen</p>
          </div>
        ) : (
          <div className="space-y-3">
            {frozenSubscriptions.map((sub) => (
              <div
                key={sub.subscriptionId}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Member #{sub.userId}</h4>
                    <p className="text-sm text-muted-foreground">{sub.planName}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full block">
                    Frozen
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {sub.freezeStartDate ? new Date(sub.freezeStartDate).toLocaleDateString() : "—"}
                    {" → "}
                    {sub.freezeEndDate ? new Date(sub.freezeEndDate).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Invitations Section */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            Invitation Codes
          </h3>
          <Button
            className="gap-2"
            onClick={() => { setShowInviteModal(true); setCreatedCode(null); setInviteExpiry(""); }}
          >
            <Ticket className="h-4 w-4" />
            Create Invitation
          </Button>
        </div>

        {invitationsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invitations created yet
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.invitationId} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-widest">{inv.code}</span>
                      <button
                        title="Copy code"
                        onClick={() => handleCopyCode(inv.code)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      {inv.usedByName && ` · Used by ${inv.usedByName}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    inv.isUsed
                      ? "bg-slate-100 text-slate-500"
                      : new Date(inv.expiresAt) < new Date()
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {inv.isUsed ? "Used" : new Date(inv.expiresAt) < new Date() ? "Expired" : "Active"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Create Invitation
              </h3>
              <button
                title="Close"
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createdCode ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Invitation created successfully!</p>
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="flex-1 font-mono text-lg font-bold tracking-widest text-center">{createdCode}</span>
                  <button
                    title="Copy code"
                    onClick={() => handleCopyCode(createdCode)}
                    className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Share this code with the new member to use during registration.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setCreatedCode(null); setInviteExpiry(""); }}
                  >
                    Create Another
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowInviteModal(false)}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-foreground">Expiry Date</label>
                  <Input
                    type="date"
                    value={inviteExpiry}
                    onChange={(e) => setInviteExpiry(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">The invitation code will expire on this date.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleCreateInvitation}
                    disabled={inviteLoading || !inviteExpiry}
                  >
                    {inviteLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Ticket className="h-4 w-4" />
                    )}
                    Generate Code
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ReceptionDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionDashboardContent />
    </ProtectedRoute>
  );
}
