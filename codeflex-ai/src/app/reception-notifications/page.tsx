"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserPlus,
  X,
  Eye,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { notificationsApi, type NotificationDto } from "@/lib/api/notifications";
import Link from "next/link";

function ReceptionNotificationsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const response = await notificationsApi.getUserNotifications(user.userId);
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      showToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.userId]);

  const markAsRead = async (id: number) => {
    try {
      const response = await notificationsApi.markAsRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
        );
        showToast("Notification marked as read", "success");
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const response = await notificationsApi.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n.notificationId !== id));
        showToast("Notification deleted", "success");
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.userId) return;
    try {
      const response = await notificationsApi.markAllAsRead(user.userId);
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        showToast("All notifications marked as read", "success");
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getPriorityText = (priority?: number) => {
    switch (priority) {
      case 2:
        return "high";
      case 1:
        return "normal";
      default:
        return "low";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "membership_expiring":
      case "membership_expired":
      case "subscriptionexpiring":
        return { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "payment_received":
      case "payment":
        return { icon: CreditCard, color: "text-green-500", bg: "bg-green-500/10" };
      case "new_booking":
      case "booking":
      case "booking_cancelled":
        return { icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "new_member":
      case "member":
        return { icon: UserPlus, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "checkin":
      case "checkout":
        return { icon: CheckCircle, color: "text-cyan-500", bg: "bg-cyan-500/10" };
      default:
        return { icon: Bell, color: "text-primary", bg: "bg-primary/10" };
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.isRead;
    if (filter === "high") return getPriorityText(notif.priority) === "high";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const highPriorityCount = notifications.filter((n) => getPriorityText(n.priority) === "high").length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Notifications</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with important alerts and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{notifications.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Notifications</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Bell className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-500">{unreadCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Unread</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Eye className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-500">{highPriorityCount}</div>
              <div className="text-sm text-muted-foreground mt-1">High Priority</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === "high" ? "default" : "outline"}
          onClick={() => setFilter("high")}
        >
          High Priority ({highPriorityCount})
        </Button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading notifications...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const visual = getNotificationIcon(notification.type);
            const Icon = visual.icon;
            const priority = getPriorityText(notification.priority);
            
            return (
              <Card
                key={notification.notificationId}
                className={`p-6 border transition-all hover:shadow-md ${
                  notification.isRead
                    ? "border-border bg-card/30"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-full ${visual.bg} flex-shrink-0`}>
                    <Icon className={`h-6 w-6 ${visual.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{notification.title}</h3>
                        <p className="text-muted-foreground">{notification.message}</p>
                      </div>
                      {priority === "high" && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 whitespace-nowrap">
                          High Priority
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(notification.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification.notificationId)}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteNotification(notification.notificationId)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <Card className="p-12 border border-border bg-card/50 backdrop-blur-sm">
          <div className="text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === "unread"
                ? "You've read all your notifications"
                : filter === "high"
                ? "No high priority notifications"
                : "You don't have any notifications yet"}
            </p>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <Link href="/reception-members" className="w-full">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">View Members</span>
            </Button>
          </Link>
          <Link href="/reception-bookings" className="w-full">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Manage Bookings</span>
            </Button>
          </Link>
          <Link href="/reception-payments" className="w-full">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Process Payment</span>
            </Button>
          </Link>
          <Link href="/reception-dashboard" className="w-full">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Dashboard</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ReceptionNotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionNotificationsContent />
    </ProtectedRoute>
  );
}
