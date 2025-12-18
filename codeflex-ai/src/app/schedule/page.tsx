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
  Plus,
  Loader2,
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
}

function ScheduleContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<MemberWorkoutPlanDto[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

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
        showToast("Failed to load schedule", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, showToast]);

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
        title: booking.coachName || booking.equipmentName || "Booking",
        time: bookingDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: bookingDate,
        description: booking.notes,
        status: booking.statusText,
      });
    });

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
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.startTime) >= new Date() && b.status !== 3
  );

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">My Schedule</h1>
            <p className="text-slate-500">Manage your bookings and workouts</p>
          </div>
          <div className="flex gap-3">
            <Link href="/book-coach">
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2">
                <Plus className="h-4 w-4" />
                Book Coach
              </Button>
            </Link>
            <Link href="/book-equipment">
              <Button variant="outline" className="rounded-xl font-bold gap-2">
                <Plus className="h-4 w-4" />
                Book Equipment
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{upcomingBookings.length}</p>
                <p className="text-sm text-slate-500">Upcoming Bookings</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{workoutPlans.length}</p>
                <p className="text-sm text-slate-500">Active Plans</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{bookings.length}</p>
                <p className="text-sm text-slate-500">Total Bookings</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Week Navigation */}
        <Card className="bg-white border-0 shadow-sm mb-8">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">{formatWeekRange()}</h2>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek("prev")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="h-8 px-3 text-sm font-semibold"
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek("next")}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {weekDays.map((date, idx) => {
              const dayEvents = getEventsForDate(date);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = date.getDate();

              return (
                <div
                  key={idx}
                  className={`min-h-[200px] p-3 ${isToday(date) ? "bg-blue-50" : ""}`}
                >
                  <div className="text-center mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase">{dayName}</p>
                    <p className={`text-lg font-bold ${isToday(date) ? "text-blue-600" : "text-slate-700"}`}>
                      {dayNum}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded-lg text-xs ${event.type === "booking"
                            ? "bg-blue-100 border-l-2 border-blue-500 text-blue-800"
                            : "bg-green-100 border-l-2 border-green-500 text-green-800"
                          }`}
                      >
                        <p className="font-semibold truncate">{event.title}</p>
                        <p className="text-[10px] opacity-80">{event.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming Bookings List */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Upcoming Bookings</h2>
          {upcomingBookings.length === 0 ? (
            <Card className="p-8 text-center bg-white border-0 shadow-sm">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No upcoming bookings</p>
              <Link href="/book-coach">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Book a Session
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <Card key={booking.bookingId} className="p-4 bg-white border-0 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        {booking.coachId ? (
                          <Calendar className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Dumbbell className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {booking.coachName || booking.equipmentName || "Booking"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(booking.startTime).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(booking.startTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 1
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}>
                      {booking.statusText}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
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
