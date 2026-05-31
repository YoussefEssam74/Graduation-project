"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { bookingsApi, usersApi, type BookingDto, type CoachClientDto } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function CoachScheduleContent() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<BookingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal and form state for creating a new session
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [clients, setClients] = useState<CoachClientDto[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchSessions = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setIsLoading(true);
      // Fetch a 3-month window centered on the current visible date to cover calendar changes smoothly
      const startRange = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endRange = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0, 23, 59, 59);

      const response = await bookingsApi.getCoachBookings(
        user.userId,
        startRange.toISOString(),
        endRange.toISOString()
      );

      if (response.success && response.data) {
        setSessions(response.data);
      } else {
        showToast(response.message || "Failed to load schedule sessions", "error");
      }
    } catch (error) {
      console.error("Error fetching coach schedule:", error);
      showToast("An error occurred while fetching the schedule", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, currentDate, showToast]);

  // Fetch sessions on date/month changes
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Load clients list when New Session modal opens
  useEffect(() => {
    if (isNewSessionModalOpen && user?.userId && clients.length === 0) {
      const fetchClients = async () => {
        try {
          setIsClientsLoading(true);
          const response = await usersApi.getCoachClients(user.userId);
          if (response.success && response.data) {
            setClients(response.data);
          } else {
            showToast("Failed to load clients list", "error");
          }
        } catch (error) {
          console.error("Error loading clients:", error);
          showToast("An error occurred while loading clients", "error");
        } finally {
          setIsClientsLoading(false);
        }
      };
      fetchClients();
    }
  }, [isNewSessionModalOpen, user?.userId, clients.length, showToast]);

  const handleConfirmSession = async (bookingId: number) => {
    try {
      const response = await bookingsApi.confirmBooking(bookingId);
      if (response.success) {
        showToast("Session confirmed successfully!", "success");
        fetchSessions();
      } else {
        showToast(response.message || "Failed to confirm session", "error");
      }
    } catch (error) {
      console.error("Error confirming session:", error);
      showToast("An error occurred while confirming the session", "error");
    }
  };

  const handleCancelSession = async (bookingId: number) => {
    const reason = prompt("Enter reason for cancellation:");
    if (reason === null) return; // User pressed Cancel
    if (!reason.trim()) {
      showToast("Cancellation reason is required", "error");
      return;
    }

    try {
      const response = await bookingsApi.cancelBooking(bookingId, reason);
      if (response.success) {
        showToast("Session cancelled successfully!", "success");
        fetchSessions();
      } else {
        showToast(response.message || "Failed to cancel session", "error");
      }
    } catch (error) {
      console.error("Error cancelling session:", error);
      showToast("An error occurred while cancelling the session", "error");
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;
    if (!selectedClientId || !sessionDate || !startTime || !endTime) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const startDateTime = new Date(`${sessionDate}T${startTime}`);
    const endDateTime = new Date(`${sessionDate}T${endTime}`);

    if (startDateTime >= endDateTime) {
      showToast("Start time must be before end time", "error");
      return;
    }

    if (startDateTime < new Date()) {
      showToast("Cannot schedule a session in the past", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await bookingsApi.createBooking({
        userId: Number(selectedClientId),
        coachId: user.userId,
        bookingType: "Session",
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: notes,
      });

      if (response.success) {
        showToast("Session scheduled successfully!", "success");
        setIsNewSessionModalOpen(false);
        // Reset form
        setSelectedClientId("");
        setSessionDate("");
        setStartTime("");
        setEndTime("");
        setNotes("");
        // Refresh schedule
        fetchSessions();
      } else {
        showToast(response.message || "Failed to schedule session", "error");
      }
    } catch (error) {
      console.error("Error creating session booking:", error);
      showToast("An error occurred while scheduling the session", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const selectedDateString = getLocalDateString(selectedDate);
  const todaySessions = sessions.filter(
    (session) => getLocalDateString(new Date(session.startTime)) === selectedDateString
  );

  const upcomingSessions = sessions.filter(
    (session) => new Date(session.startTime) > new Date()
  );

  const getStatusColor = (statusText: string) => {
    switch (statusText) {
      case "Confirmed":
        return "bg-green-500/10 text-green-500 border border-green-500/20";
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      case "Cancelled":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
      case "Completed":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "NoShow":
        return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes("Online") || type.includes("Virtual")) {
      return <Video className="h-4 w-4" />;
    } else if (type.includes("Group")) {
      return <Users className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Schedule</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your coaching sessions and appointments
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsNewSessionModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  sessions.filter(
                    (s) => getLocalDateString(new Date(s.startTime)) === getLocalDateString(new Date())
                  ).length
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Today's Sessions</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  upcomingSessions.length
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Upcoming Sessions</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  sessions.filter((s) => s.statusText === "Confirmed").length
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Confirmed Sessions</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <Card className="lg:col-span-2 p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dateString = getLocalDateString(date);
                
                const daySessions = sessions.filter(
                  (s) => getLocalDateString(new Date(s.startTime)) === dateString
                );
                
                const hasSessions = daySessions.length > 0;
                const isSelected = dateString === getLocalDateString(selectedDate);
                const isToday = dateString === getLocalDateString(new Date());

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square p-2 rounded-lg text-sm font-medium transition-all relative flex flex-col items-center justify-center
                      ${isSelected ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 scale-105" : "hover:bg-muted/80 bg-card/10"}
                      ${isToday && !isSelected ? "border-2 border-primary" : ""}
                    `}
                  >
                    <span>{day}</span>
                    {hasSessions && (
                      <div className="absolute bottom-1.5 flex gap-0.5 justify-center">
                        {daySessions.slice(0, 3).map((s, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              isSelected
                                ? "bg-primary-foreground"
                                : s.statusText === "Pending"
                                ? "bg-yellow-500"
                                : s.statusText === "Cancelled"
                                ? "bg-red-500"
                                : "bg-primary"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Selected Day's Schedule */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm flex flex-col">
          <h2 className="text-xl font-bold mb-4">
            {getLocalDateString(selectedDate) === getLocalDateString(new Date())
              ? "Today's Schedule"
              : selectedDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
          </h2>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading schedule...</p>
              </div>
            ) : todaySessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg bg-card/20">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-40 text-primary" />
                <p className="text-sm font-medium">No sessions scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">Select another day or add a new one.</p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div
                  key={session.bookingId}
                  className="p-4 border border-border bg-card/30 rounded-lg hover:shadow-md transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {getInitials(session.userName)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm leading-none">{session.userName}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {session.bookingType === "Session" ? "Personal Training" : session.bookingType}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary/70" />
                      <span>
                        {new Date(session.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(session.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        (
                        {Math.round(
                          (new Date(session.endTime).getTime() -
                            new Date(session.startTime).getTime()) /
                            60000
                        )}{" "}
                        min)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary/70" />
                      <span>{session.equipmentName || "Gym Floor"}</span>
                    </div>
                  </div>

                  {session.notes && (
                    <div className="text-xs bg-muted/50 p-2 rounded text-muted-foreground italic border-l-2 border-primary/50">
                      "{session.notes}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(session.statusText)}`}>
                      {session.statusText}
                    </span>

                    {/* Quick action buttons for selected day booking */}
                    <div className="flex gap-1.5">
                      {session.statusText === "Pending" && (
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700"
                          onClick={() => handleConfirmSession(session.bookingId)}
                        >
                          Confirm
                        </Button>
                      )}
                      {(session.statusText === "Pending" || session.statusText === "Confirmed") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleCancelSession(session.bookingId)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* All Upcoming Sessions */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">All Upcoming Sessions</h2>
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          </div>
        ) : upcomingSessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming sessions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingSessions.map((session) => (
              <div
                key={session.bookingId}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border bg-card/25 rounded-lg hover:border-primary/40 transition-all gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {getInitials(session.userName)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{session.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      {session.bookingType === "Session" ? "Personal Training" : session.bookingType}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:flex items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span>{new Date(session.startTime).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>
                      {new Date(session.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getTypeIcon(session.bookingType)}
                    <span>{session.equipmentName || "Gym Floor"}</span>
                  </div>

                  <span className={`text-xs px-3 py-1 rounded-full font-medium w-fit ${getStatusColor(session.statusText)}`}>
                    {session.statusText}
                  </span>
                </div>

                <div className="flex gap-2 justify-end">
                  {session.statusText === "Pending" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 gap-1.5"
                      onClick={() => handleConfirmSession(session.bookingId)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm
                    </Button>
                  )}
                  {(session.statusText === "Pending" || session.statusText === "Confirmed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20 gap-1.5"
                      onClick={() => handleCancelSession(session.bookingId)}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* New Session Dialog */}
      <Dialog open={isNewSessionModalOpen} onOpenChange={setIsNewSessionModalOpen}>
        <DialogContent className="max-w-md bg-card/95 border border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Schedule New Session</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateSession} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Select Client *</label>
              {isClientsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading client list...
                </div>
              ) : (
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="" disabled>-- Select a Client --</option>
                  {clients.map((client) => (
                    <option key={client.userId} value={client.userId}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Date *</label>
              <Input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                min={getLocalDateString(new Date())}
                className="bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Start Time *</label>
                <Input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">End Time *</label>
                <Input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground">Notes / Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bring water and focus on chest isolation movements today."
                rows={3}
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewSessionModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Schedule Session
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CoachSchedulePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachScheduleContent />
    </ProtectedRoute>
  );
}
