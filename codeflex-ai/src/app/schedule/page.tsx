"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import {
  bookingsApi,
  workoutPlansApi,
  type BookingDto,
  type MemberWorkoutPlanDto,
} from "@/lib/api";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Users,
  Video,
  MapPin,
  CalendarDays,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import Link from "next/link";

interface ScheduleEvent {
  id: string;
  type: "booking" | "workout";
  title: string;
  time: string;
  date: Date;
  description?: string;
  status?: string;
  location?: string;
}

function ScheduleContent() {
  const { user } = useAuth();
  useToast(); // Initialize toast hook
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<MemberWorkoutPlanDto[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;

      try {
        const [bookingsRes, workoutRes] = await Promise.all([
          bookingsApi.getUserBookings(user.userId),
          workoutPlansApi.getMemberPlans(user.userId),
        ]);

        if (bookingsRes.success && bookingsRes.data) {
          setBookings(bookingsRes.data);
        }
        if (workoutRes.success && workoutRes.data) {
          setWorkoutPlans(workoutRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch schedule data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId]);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Convert bookings to schedule events
  const getScheduleEvents = (): ScheduleEvent[] => {
    const events: ScheduleEvent[] = [];

    // Add bookings
    bookings.forEach((booking) => {
      const bookingDate = new Date(booking.startTime);
      events.push({
        id: `booking-${booking.bookingId}`,
        type: "booking",
        title: booking.coachName || "Coach Session",
        time: bookingDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: bookingDate,
        description: booking.notes,
        status: booking.status,
        location: booking.sessionType === 1 ? "In Person" : "Online",
      });
    });

    // Add workout days from active plan
    const activePlan = workoutPlans.find((p) => p.isActive);
    if (activePlan?.workoutDays) {
      const dayMap: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };

      activePlan.workoutDays.forEach((day) => {
        const dayName = day.dayName.toLowerCase();
        const dayNum = dayMap[dayName] ?? -1;

        if (dayNum >= 0) {
          weekDays.forEach((weekDay) => {
            if (weekDay.getDay() === dayNum) {
              events.push({
                id: `workout-${day.dayName}-${weekDay.getTime()}`,
                type: "workout",
                title: day.dayName,
                time: "Workout Day",
                date: weekDay,
                description: `${day.exercises?.length || 0} exercises`,
              });
            }
          });
        }
      });
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const events = getScheduleEvents();

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
    setSelectedDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.startTime) >= new Date() && b.status === "Confirmed"
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <CalendarDays className="h-10 w-10 text-primary" />
            <span>
              <span className="text-foreground">Your </span>
              <span className="text-primary">Schedule</span>
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your workouts and coaching sessions
          </p>
        </div>
        <Link href="/bookings">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Book Session
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              <div className="text-xs text-muted-foreground">Upcoming Sessions</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Dumbbell className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {workoutPlans.find((p) => p.isActive)?.workoutDays?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Workout Days/Week</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{bookings.length}</div>
              <div className="text-xs text-muted-foreground">Total Bookings</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {events.filter((e) => isToday(e.date)).length}
              </div>
              <div className="text-xs text-muted-foreground">Today's Events</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h2 className="text-xl font-bold">{formatWeekRange()}</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week View
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === "week" ? (
        <Card className="p-4 border border-border bg-card/50 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {weekDays.map((date, idx) => {
              const dayEvents = getEventsForDate(date);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = date.getDate();
              const isSelected =
                selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth();

              return (
                <div
                  key={idx}
                  className={`min-h-[200px] p-2 rounded-lg border transition-all cursor-pointer ${
                    isToday(date)
                      ? "border-primary bg-primary/5"
                      : isSelected
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  {/* Day Header */}
                  <div className="text-center mb-2 pb-2 border-b border-border">
                    <div className="text-xs text-muted-foreground uppercase">
                      {dayName}
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        isToday(date) ? "text-primary" : ""
                      }`}
                    >
                      {dayNum}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No events
                      </div>
                    ) : (
                      dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-2 rounded text-xs ${
                            event.type === "booking"
                              ? "bg-blue-500/10 border border-blue-500/20"
                              : "bg-green-500/10 border border-green-500/20"
                          }`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-muted-foreground">{event.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* List View */
        <Card className="border border-border bg-card/50 divide-y divide-border">
          {weekDays.map((date, idx) => {
            const dayEvents = getEventsForDate(date);
            if (dayEvents.length === 0) return null;

            return (
              <div key={idx} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                      isToday(date) ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="text-xs">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="font-bold">{date.getDate()}</div>
                  </div>
                  <h3 className="font-semibold">
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                    {isToday(date) && (
                      <span className="ml-2 text-xs text-primary">(Today)</span>
                    )}
                  </h3>
                </div>

                <div className="space-y-2 ml-13">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        event.type === "booking"
                          ? "bg-blue-500/10 border border-blue-500/20"
                          : "bg-green-500/10 border border-green-500/20"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          event.type === "booking"
                            ? "bg-blue-500/20"
                            : "bg-green-500/20"
                        }`}
                      >
                        {event.type === "booking" ? (
                          <Users className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Dumbbell className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              {event.location === "Online" ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {event.status && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            event.status === "Confirmed"
                              ? "bg-green-500/20 text-green-500"
                              : event.status === "Pending"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {event.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Events This Week</h3>
              <p className="text-muted-foreground mb-4">
                Book a coaching session or start a workout plan
              </p>
              <Link href="/bookings">
                <Button>Book a Session</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Selected Date Detail (Mobile) */}
      {selectedDate && viewMode === "week" && (
        <Card className="p-4 border border-border bg-card/50 md:hidden">
          <h3 className="font-semibold mb-3">
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="text-muted-foreground text-sm">No events on this day</p>
            ) : (
              getEventsForDate(selectedDate).map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg ${
                    event.type === "booking"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-green-500/10 border border-green-500/20"
                  }`}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-muted-foreground">{event.time}</div>
                  {event.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ScheduleContent />
    </ProtectedRoute>
  );
}
