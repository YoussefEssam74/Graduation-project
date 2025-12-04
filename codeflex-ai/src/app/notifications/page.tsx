"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { notificationsApi, type NotificationDto } from "@/lib/api";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  Dumbbell,
  Calendar,
  Gift,
  MessageSquare,
  AlertCircle,
  Info,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Notification type icons and colors
const notificationStyles: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  workout: { icon: <Dumbbell className="h-5 w-5" />, color: "text-blue-500", bg: "bg-blue-500/10" },
  session: { icon: <Calendar className="h-5 w-5" />, color: "text-green-500", bg: "bg-green-500/10" },
  reward: { icon: <Gift className="h-5 w-5" />, color: "text-purple-500", bg: "bg-purple-500/10" },
  message: { icon: <MessageSquare className="h-5 w-5" />, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  alert: { icon: <AlertCircle className="h-5 w-5" />, color: "text-red-500", bg: "bg-red-500/10" },
  achievement: { icon: <Trophy className="h-5 w-5" />, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  info: { icon: <Info className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10" },
  default: { icon: <Bell className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10" },
};

function NotificationsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotification, setSelectedNotification] = useState<NotificationDto | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await notificationsApi.getUserNotifications(user.userId);
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationStyle = (notification: NotificationDto) => {
    const notificationType = notification.type?.toLowerCase() || "";
    if (notificationType.includes("workout")) return notificationStyles.workout;
    if (notificationType.includes("session") || notificationType.includes("booking")) return notificationStyles.session;
    if (notificationType.includes("reward") || notificationType.includes("token")) return notificationStyles.reward;
    if (notificationType.includes("message") || notificationType.includes("coach")) return notificationStyles.message;
    if (notificationType.includes("alert") || notificationType.includes("warning")) return notificationStyles.alert;
    if (notificationType.includes("achievement") || notificationType.includes("milestone")) return notificationStyles.achievement;
    if (notificationType.includes("info")) return notificationStyles.info;
    return notificationStyles.default;
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch {
      showToast("Failed to mark as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.userId) return;
    setIsProcessing(true);

    try {
      const response = await notificationsApi.markAllAsRead(user.userId);
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        showToast("All notifications marked as read", "success");
      }
    } catch {
      showToast("Failed to mark all as read", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    setIsProcessing(true);

    try {
      const response = await notificationsApi.deleteNotification(
        selectedNotification.notificationId
      );
      if (response.success) {
        setNotifications((prev) =>
          prev.filter((n) => n.notificationId !== selectedNotification.notificationId)
        );
        showToast("Notification deleted", "success");
        setShowDeleteDialog(false);
        setSelectedNotification(null);
      }
    } catch {
      showToast("Failed to delete notification", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Bell className="h-10 w-10 text-primary" />
            <span>
              <span className="text-foreground">Your </span>
              <span className="text-primary">Notifications</span>
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your fitness journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isProcessing}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{notifications.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <div className="text-xs text-muted-foreground">Unread</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {notifications.length - unreadCount}
              </div>
              <div className="text-xs text-muted-foreground">Read</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          <Clock className="h-4 w-4 mr-1" />
          Unread ({unreadCount})
        </Button>
        <Button
          variant={filter === "read" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("read")}
        >
          <Check className="h-4 w-4 mr-1" />
          Read ({notifications.length - unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card/50">
          <BellOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
          <p className="text-muted-foreground">
            {filter === "unread"
              ? "You're all caught up!"
              : filter === "read"
              ? "No read notifications yet"
              : "No notifications yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => {
            const style = getNotificationStyle(notification);

            return (
              <Card
                key={notification.notificationId}
                className={`p-4 border transition-all hover:bg-primary/5 ${
                  notification.isRead
                    ? "border-border bg-card/30"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl ${style.bg} ${style.color}`}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-semibold ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.notificationId)}
                          className="h-8 px-3"
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          Mark Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDeleteDialog(true);
                        }}
                        className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
