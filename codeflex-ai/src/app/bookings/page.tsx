"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { equipmentApi, bookingsApi, usersApi, type EquipmentDto, type BookingDto } from "@/lib/api";
import {
  Calendar,
  Clock,
  Dumbbell,
  User,
  CheckCircle,
  XCircle,
  Ticket,
  Search,
  AlertTriangle,
  Loader2,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CoachReviewForm } from "@/components/CoachReviewForm";
import Link from "next/link";

interface LocalBooking {
  id: number;
  type: "equipment" | "coach";
  name: string;
  date: string;
  time: string;
  status: string;
  tokensCost: number;
  coachId?: number;
}

interface Coach {
  id: number;
  name: string;
  specialization: string;
  rating: number;
  sessionsCompleted: number;
  tokensCost: number;
  availability: string;
}

// Map equipment status from number to string
const mapEquipmentStatus = (status: number): string => {
  switch (status) {
    case 0: return "available";
    case 1: return "in_use";
    case 2: return "maintenance";
    default: return "available";
  }
};

// Map booking status from number to string
const mapBookingStatus = (status: number): string => {
  switch (status) {
    case 0: return "pending";
    case 1: return "confirmed";
    case 2: return "completed";
    case 3: return "cancelled";
    default: return "pending";
  }
};

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { showToast } = useToast();
  const { user, deductTokens, adjustTokens, refreshUser } = useAuth();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<LocalBooking | null>(null);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewCoachId, setReviewCoachId] = useState<number | null>(null);
  const [reviewCoachName, setReviewCoachName] = useState<string>("");

  // Loading states
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(true);

  // Equipment from API
  const [equipmentList, setEquipmentList] = useState<{
    id: number;
    name: string;
    category: string;
    status: string;
    location: string;
    tokensCost: number;
    nextAvailable: string | null;
  }[]>([]);

  // Coaches - will be populated from API when available
  const [coaches, setCoaches] = useState<Coach[]>([]);

  // Bookings from API
  const [upcomingBookingsState, setUpcomingBookingsState] = useState<LocalBooking[]>([]);
  const [pastBookingsState, setPastBookingsState] = useState<LocalBooking[]>([]);

  // Fetch equipment from API
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await equipmentApi.getAllEquipment();
        if (response.success && response.data) {
          const mapped = response.data.map((eq: EquipmentDto) => ({
            id: eq.equipmentId,
            name: eq.name,
            category: eq.category?.toLowerCase() || "strength",
            status: mapEquipmentStatus(eq.status),
            location: eq.location || "Zone A",
            tokensCost: eq.tokensCost || 5,
            nextAvailable: eq.status === 0 ? null : "Soon",
          }));
          setEquipmentList(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch equipment:", error);
        showToast("Failed to load equipment.", "error");
        setEquipmentList([]);
      } finally {
        setIsLoadingEquipment(false);
      }
    };
    fetchEquipment();
  }, []);

  // Fetch user bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.userId) {
        setIsLoadingBookings(false);
        return;
      }
      try {
        const response = await bookingsApi.getUserBookings(user.userId);
        if (response.success && response.data) {
          const upcoming: LocalBooking[] = [];
          const past: LocalBooking[] = [];

          response.data.forEach((booking: BookingDto) => {
            const status = mapBookingStatus(booking.status);
            const localBooking: LocalBooking = {
              id: booking.bookingId,
              type: booking.coachId ? "coach" : "equipment",
              name: booking.coachName || booking.equipmentName || "Unknown",
              date: new Date(booking.startTime).toLocaleDateString(),
              time: `${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              status,
              tokensCost: booking.tokensCost,
              coachId: booking.coachId,
            };

            if (status === "cancelled" || status === "completed") {
              past.push(localBooking);
            } else {
              upcoming.push(localBooking);
            }
          });

          setUpcomingBookingsState(upcoming);
          setPastBookingsState(past);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [user?.userId]);

  // Fetch coaches from API
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setIsLoadingCoaches(true);
        const response = await usersApi.getCoaches();

        if (response.success && response.data) {
          // Map UserDto to Coach interface
          const coachList: Coach[] = response.data.map(coach => ({
            id: coach.userId,
            name: coach.name,
            specialization: "Personal Training",
            rating: 0, // Will be fetched from reviews API
            sessionsCompleted: 0, // Will be fetched from stats API
            tokensCost: 30, // Default rate
            availability: coach.isActive ? "Available" : "Unavailable",
          }));
          setCoaches(coachList);
        }
      } catch (error) {
        console.error('Failed to fetch coaches:', error);
        showToast("Failed to load coaches.", "error");
      } finally {
        setIsLoadingCoaches(false);
      }
    };

    fetchCoaches();
  }, [showToast]);

  const filteredEquipment = equipmentList.filter((equipment) => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || equipment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBookEquipment = async (id: number) => {
    const equip = equipmentList.find((e) => e.id === id);
    if (!equip) return;

    if (!user) {
      showToast("Please log in to book equipment.", "warning");
      return;
    }

    const cost = equip.tokensCost ?? 0;
    if ((user.tokenBalance ?? 0) < cost) {
      showToast("Insufficient tokens to book this equipment.", "error");
      return;
    }

    // Create booking times - start now, rounded to next 15 minute slot
    const now = new Date();
    const startTime = new Date(now);
    const minutes = startTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    startTime.setMinutes(roundedMinutes % 60);
    if (roundedMinutes >= 60) {
      startTime.setHours(startTime.getHours() + 1);
    }
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    try {
      // Call the backend API to create booking
      const response = await bookingsApi.createBooking({
        userId: user.userId,
        equipmentId: id,
        bookingType: "Equipment",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: `Booked ${equip.name}`,
      });

      if (response.success && response.data) {
        deductTokens(cost);
        // Refresh authoritative balance from server (in case backend persisted a transaction)
        if (refreshUser) await refreshUser();
        setEquipmentList((prev) => prev.map((e) => (e.id === id ? { ...e, status: "in_use", nextAvailable: "In Use" } : e)));

        const newBooking: LocalBooking = {
          id: response.data.bookingId,
          type: "equipment",
          name: equip.name,
          date: new Date(response.data.startTime).toLocaleDateString(),
          time: `${new Date(response.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(response.data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          status: "confirmed",
          tokensCost: cost,
        };

        setUpcomingBookingsState((prev) => [newBooking, ...prev]);
        showToast(`Booked ${equip.name} — ${cost} tokens deducted`, "success");
      } else {
        // Extract error message from response
        const errorMsg = response.message || (response.errors && response.errors[0]) || "Failed to book equipment. Please try again.";
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Booking error:", error);
      showToast("Failed to book equipment. Please try again.", "error");
    }
  };

  const handleBookSession = async (coachId: number) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return;

    if (!user) {
      showToast("Please log in to book a coach session.", "warning");
      return;
    }

    const cost = coach.tokensCost ?? 0;
    if ((user.tokenBalance ?? 0) < cost) {
      showToast("Insufficient tokens for this coach session.", "error");
      return;
    }

    // Create booking times - find next available slot
    // Use current time + 2 hours, rounded to next 15 minute mark, plus some offset to avoid conflicts
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() + 2);
    // Round to next 15 minute slot and add a small random offset to reduce conflicts
    const minutes = startTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15 + (Math.floor(Math.random() * 4) * 15);
    startTime.setMinutes(roundedMinutes % 60);
    if (roundedMinutes >= 60) {
      startTime.setHours(startTime.getHours() + 1);
    }
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour session

    try {
      // Call the backend API to create booking
      const response = await bookingsApi.createBooking({
        userId: user.userId,
        coachId: coachId,
        bookingType: "Session",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: `Session with ${coach.name}`,
      });

      if (response.success && response.data) {
        deductTokens(cost);
        // Refresh authoritative balance from server (in case backend persisted a transaction)
        if (refreshUser) await refreshUser();

        const newBooking: LocalBooking = {
          id: response.data.bookingId,
          type: "coach",
          name: coach.name,
          date: new Date(response.data.startTime).toLocaleDateString(),
          time: `${new Date(response.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(response.data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          status: "confirmed",
          tokensCost: cost,
          coachId: coachId,
        };

        setUpcomingBookingsState((prev) => [newBooking, ...prev]);
        setCoaches((prev) => prev.map((c) => (c.id === coachId ? { ...c, availability: "Booked" } : c)));
        showToast(`Booked session with ${coach.name} — ${cost} tokens deducted`, "success");
      } else {
        // Extract error message from response
        const errorMsg = response.message || (response.errors && response.errors[0]) || "Failed to book session. Please try again.";
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Booking error:", error);
      showToast("Failed to book session. Please try again.", "error");
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    const booking = upcomingBookingsState.find((b) => b.id === bookingId);
    if (!booking) return;

    // Open confirmation dialog instead of using confirm()
    setBookingToCancel(booking);
    setCancelDialogOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      // Try to cancel via API first
      const response = await bookingsApi.cancelBooking(bookingToCancel.id, "Cancelled by user");

      if (response.success) {
        // API cancellation succeeded
        setUpcomingBookingsState((prev) => prev.filter((b) => b.id !== bookingToCancel.id));
        setPastBookingsState((prev) => [{ ...bookingToCancel, status: "cancelled", tokensCost: 0 }, ...prev]);

        if (bookingToCancel.status === "confirmed" && bookingToCancel.tokensCost > 0) {
          adjustTokens(bookingToCancel.tokensCost);
          // Refresh authoritative balance from server (in case backend processed a refund)
          if (refreshUser) await refreshUser();
          showToast(`Booking cancelled. ${bookingToCancel.tokensCost} tokens refunded to your account!`, "success");
        } else {
          showToast("Booking cancelled.", "info");
        }
      } else {
        throw new Error(response.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("API cancel failed, using local state:", error);
      // Fallback to local state management
      setUpcomingBookingsState((prev) => prev.filter((b) => b.id !== bookingToCancel.id));
      setPastBookingsState((prev) => [{ ...bookingToCancel, status: "cancelled", tokensCost: 0 }, ...prev]);

      if (bookingToCancel.status === "confirmed" && bookingToCancel.tokensCost > 0) {
        adjustTokens(bookingToCancel.tokensCost);
        showToast(`Booking cancelled. ${bookingToCancel.tokensCost} tokens refunded to your account!`, "success");
      } else {
        showToast("Booking cancelled.", "info");
      }
    }

    setCancelDialogOpen(false);
    setBookingToCancel(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      available: {
        text: "Available",
        color: "bg-green-100 text-green-700 border-green-300",
      },
      in_use: {
        text: "In Use",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      },
      maintenance: {
        text: "Maintenance",
        color: "bg-red-100 text-red-700 border-red-300",
      },
      confirmed: {
        text: "Confirmed",
        color: "bg-blue-100 text-blue-700 border-blue-300",
      },
      pending: {
        text: "Pending",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      },
      completed: {
        text: "Completed",
        color: "bg-green-100 text-green-700 border-green-300",
      },
      cancelled: {
        text: "Cancelled",
        color: "bg-red-100 text-red-700 border-red-300",
      },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* Fixed Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-md transform scale-105"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop')"
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/85 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Ready to crush it? <span className="text-primary">⚡</span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg font-normal">
              You have <span className="font-bold text-slate-900">{upcomingBookingsState.length} upcoming sessions</span> scheduled.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                <Ticket className="h-4 w-4" />
                {user?.tokenBalance ?? 0} Tokens Available
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link href="/book-coach">
              <Button className="flex-1 md:flex-none h-12 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                <User className="h-5 w-5" />
                <span>Book Coach</span>
              </Button>
            </Link>
            <Link href="/book-equipment">
              <Button variant="outline" className="flex-1 md:flex-none h-12 px-6 bg-white border border-slate-200 text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                <Dumbbell className="h-5 w-5" />
                <span>Book Equipment</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* My Bookings Section */}
        <Card className="p-6 border border-slate-200 bg-white shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">
            My Bookings
          </h2>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full max-w-md bg-slate-100">
              <TabsTrigger value="upcoming" className="flex-1">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Past
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-6">
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading bookings...</span>
                </div>
              ) : upcomingBookingsState.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No upcoming bookings</p>
                  <p className="text-sm">Book equipment or a coach session below!</p>
                </div>
              ) : (
                upcomingBookingsState.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        {booking.type === "equipment" ? (
                          <Dumbbell className="h-6 w-6 text-primary" />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold">{booking.name}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3 w-3 text-primary" />
                            {booking.tokensCost} tokens
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking.status)}
                      <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-6">
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading history...</span>
                </div>
              ) : pastBookingsState.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No past bookings yet</p>
                </div>
              ) : (
                pastBookingsState.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-card rounded-lg border border-border flex items-center justify-between opacity-75"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-full">
                        {booking.type === "equipment" ? (
                          <Dumbbell className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold">{booking.name}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.time}
                          </span>
                          {booking.tokensCost > 0 && (
                            <span className="flex items-center gap-1">
                              <Ticket className="h-3 w-3" />
                              {booking.tokensCost} tokens
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking.status)}
                      {booking.type === "coach" && booking.status === "completed" && booking.coachId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewCoachId(booking.coachId!);
                            setReviewCoachName(booking.name);
                            setReviewModalOpen(true);
                          }}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Explore Services */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/book-coach" className="group">
            <Card className="h-full p-6 border border-slate-200 bg-white hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <User className="h-6 w-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Book a Coach</h3>
                <p className="text-slate-500 mb-4">Get personalized training from our expert coaches. 1-on-1 sessions designed for your goals.</p>
                <span className="inline-flex items-center text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                  View Coaches <Ticket className="ml-2 h-4 w-4" />
                </span>
              </div>
            </Card>
          </Link>

          <Link href="/book-equipment" className="group">
            <Card className="h-full p-6 border border-slate-200 bg-white hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                  <Dumbbell className="h-6 w-6 text-blue-500 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Book Equipment</h3>
                <p className="text-slate-500 mb-4">Reserve premium gym equipment in advance. Skip the wait and maximize your workout time.</p>
                <span className="inline-flex items-center text-sm font-bold text-blue-500 group-hover:translate-x-1 transition-transform">
                  View Equipment <Ticket className="ml-2 h-4 w-4" />
                </span>
              </div>
            </Card>
          </Link>
        </div>

        {/* Cancel Booking Confirmation Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Cancel Booking
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your booking for{" "}
                <span className="font-semibold text-foreground">{bookingToCancel?.name}</span>?
              </DialogDescription>
            </DialogHeader>

            {bookingToCancel && (
              <div className="py-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{bookingToCancel.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{bookingToCancel.time}</span>
                  </div>
                  {bookingToCancel.tokensCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Refund:</span>
                      <span className="font-medium text-green-600 flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {bookingToCancel.tokensCost} tokens
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={confirmCancelBooking}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Coach Review Modal */}
        {reviewCoachId && (
          <CoachReviewForm
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setReviewCoachId(null);
              setReviewCoachName("");
            }}
            coachId={reviewCoachId}
            coachName={reviewCoachName}
            onReviewSubmitted={() => {
              showToast("Thank you for your review!", "success");
            }}
          />
        )}
      </div>
    </div>
  );
}
