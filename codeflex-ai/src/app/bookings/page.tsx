"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { equipmentApi, bookingsApi, usersApi, type EquipmentDto, type BookingDto } from "@/lib/api";
import {
  Calendar as CalendarIcon,
  Clock,
  Dumbbell,
  User,
  Ticket,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { UserRole } from "@/types/gym";
import ProtectedRoute from "@/components/ProtectedRoute";
import { BackgroundImage } from "@/components/BackgroundImage";

interface LocalBooking {
  id: number;
  type: "equipment" | "coach";
  name: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  tokensCost: number;
  category: "Workouts" | "Bookings" | "Classes" | "Rest Days";
}

export default function BookingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    // Adjust for Monday start if needed, but let's stick to Sunday start for standard view
    const days = [];

    // Previous month padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, fullDate: null });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        fullDate: new Date(year, month, i)
      });
    }

    return days;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await bookingsApi.getUserBookings(user.userId);
        if (response.success && response.data) {
          const mappedBookings: LocalBooking[] = response.data.map((b: BookingDto) => ({
            id: b.bookingId,
            type: b.coachId ? "coach" : "equipment",
            name: b.coachName || b.equipmentName || "Booking",
            date: new Date(b.startTime),
            startTime: new Date(b.startTime),
            endTime: new Date(b.endTime),
            status: b.bookingType, // or map status
            tokensCost: b.tokensCost,
            category: b.coachId ? "Bookings" : "Workouts" // Simplified mapping
          }));
          setBookings(mappedBookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const getDayBookings = (date: Date) => {
    return bookings.filter(b => isSameDay(b.date, date));
  };

  const calendarDays = getDaysInMonth(currentDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
      <BackgroundImage />
      <div className="min-h-[calc(100vh-6rem)] bg-transparent p-6 lg:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <span>Dashboard</span>
                <span>/</span>
                <span className="font-bold text-slate-900">Schedule</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900">Schedule & Bookings</h1>
              <p className="text-slate-500 mt-1">Manage your fitness timeline, gym sessions, and recovery days.</p>
            </div>

            <div className="flex gap-3">
              <Link href="/book-coach">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <User className="h-4 w-4" />
                  Book Coach
                </Button>
              </Link>
              <Link href="/book-equipment">
                <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
                  <Dumbbell className="h-4 w-4" />
                  Book Equipment
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">

            {/* Left Column: Categories and Upcoming */}
            <div className="lg:col-span-3 space-y-6">







              {/* Categories */}
              <Card className="p-6 border-none shadow-sm bg-white rounded-3xl">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Categories</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium text-slate-600">Workouts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-sm font-medium text-slate-600">Bookings (Equip/Coach)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span className="text-sm font-medium text-slate-600">Classes & Events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                    <span className="text-sm font-medium text-slate-600">Rest Days</span>
                  </div>
                </div>
              </Card>

              {/* This Month Stats */}
              <Card className="p-6 border-none shadow-sm bg-white rounded-3xl">
                <h3 className="font-bold text-lg text-slate-900 mb-4">This Month</h3>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">12</div>
                    <div className="text-xs text-slate-500 font-medium">Workouts Completed</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">{bookings.length}</div>
                    <div className="text-xs text-slate-500 font-medium">Upcoming Bookings</div>
                  </div>
                </div>
              </Card>

              {/* Next Up Card */}
              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-4 -mt-4"></div>
                <h3 className="text-lg font-bold mb-1">Next Up</h3>
                <p className="text-blue-100 text-sm mb-4">Tomorrow, 10:00 AM</p>

                <h4 className="text-xl font-black mb-1">InBody Scan</h4>
                <p className="text-blue-100 text-sm mb-4 opacity-80">Consultation Room B</p>

                <div className="w-full bg-blue-800/50 h-1.5 rounded-full overflow-hidden flex items-center">
                  <div className="h-full w-2/3 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-right text-[10px] font-bold mt-1 text-green-300 uppercase tracking-wider">Goals</div>
              </div>

            </div>

            {/* Right Column: Main Calendar */}
            <div className="lg:col-span-9">
              <Card className="h-full border-none shadow-sm bg-white rounded-3xl overflow-hidden flex flex-col">
                {/* Calendar Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-900">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft className="h-4 w-4" /></button>
                      <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded shadow-sm transition-all">Today</button>
                      <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button className="px-4 py-2 text-sm font-bold bg-white shadow-sm rounded-lg text-slate-900">Month</button>
                    <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">Week</button>
                    <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">Day</button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 p-6">
                  <div className="grid grid-cols-7 mb-4">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                      <div key={day} className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 grid-rows-5 gap-4 min-h-[600px]">
                    {calendarDays.map((day, idx) => (
                      <div key={`${day.day || 'empty'}-${idx}`} className={`
                                    min-h-[100px] border-t border-slate-100 p-2 relative group transition-all hover:bg-slate-50 rounded-xl
                                    ${!day.day ? 'bg-slate-50/50' : ''}
                                 `}>
                        {day.day && (
                          <>
                            <span className={`text-sm font-bold ${isSameDay(day.fullDate!, new Date()) ? 'text-blue-600' : 'text-slate-500'}`}>
                              {day.day}
                            </span>

                            <div className="mt-2 space-y-1">
                              {getDayBookings(day.fullDate!).map((booking) => (
                                <div key={booking.id} className={`
                                                        text-[10px] p-1.5 rounded-lg border-l-2 truncate cursor-pointer font-bold
                                                        ${booking.type === 'coach'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-green-50 border-green-500 text-green-700'}
                                                    `}>
                                  {booking.name}
                                </div>
                              ))}

                              {/* Demo Items for visual parity if no bookings exist for this day but we want to show example UI */}
                              {!getDayBookings(day.fullDate!).length && isSameDay(day.fullDate!, new Date(2023, 9, 1)) && (
                                <div className="text-[10px] p-1.5 rounded-lg border-l-2 truncate font-bold bg-green-50 border-green-500 text-green-700">Upper Body Hypertrophy</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
