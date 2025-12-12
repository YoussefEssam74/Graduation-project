"use client";

import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { usersApi, bookingsApi, coachReviewsApi } from "@/lib/api";
import { UserDto } from "@/lib/api/auth";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface CoachWithRating extends UserDto {
  averageRating: number;
  totalReviews: number;
  specializations?: string[];
}

function BookCoachContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [coaches, setCoaches] = useState<CoachWithRating[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<CoachWithRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState<string>("all");
  
  // Booking form state
  const [sessionType, setSessionType] = useState("personal-training");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  // Time slots
  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM",
    "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM"
  ];

  // Session types with durations and costs
  const sessionTypes = [
    { id: "personal-training", name: "Personal Training (60 min)", duration: 60, tokens: 10 },
    { id: "performance-analysis", name: "AI Performance Analysis (45 min)", duration: 45, tokens: 8 },
    { id: "recovery", name: "Recovery Session (30 min)", duration: 30, tokens: 5 },
    { id: "group-class", name: "Group Class (45 min)", duration: 45, tokens: 3 },
  ];

  // Fetch coaches
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setIsLoading(true);
        const response = await usersApi.getCoaches();
        
        if (response.success && response.data) {
          // Fetch ratings for each coach
          const coachesWithRatings = await Promise.all(
            response.data.map(async (coach) => {
              try {
                const ratingResponse = await coachReviewsApi.getCoachAverageRating(coach.userId);
                const reviewsResponse = await coachReviewsApi.getCoachReviews(coach.userId);
                
                return {
                  ...coach,
                  averageRating: ratingResponse.success && ratingResponse.data ? ratingResponse.data : 0,
                  totalReviews: reviewsResponse.success && reviewsResponse.data ? reviewsResponse.data.length : 0,
                  specializations: ["Strength Training", "HIIT", "Recovery"], // Default specializations
                };
              } catch {
                return {
                  ...coach,
                  averageRating: 0,
                  totalReviews: 0,
                  specializations: ["Strength Training"],
                };
              }
            })
          );
          
          setCoaches(coachesWithRatings);
          if (coachesWithRatings.length > 0) {
            setSelectedCoach(coachesWithRatings[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch coaches:", error);
        showToast("Failed to load coaches", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCoaches();
  }, [showToast]);

  // Filter coaches
  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = filterSpecialization === "all" || 
      coach.specializations?.includes(filterSpecialization);
    return matchesSearch && matchesSpec;
  });

  // Get week dates for calendar
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleBookSession = async () => {
    if (!selectedCoach || !selectedTime || !user?.userId) {
      showToast("Please select a time slot", "error");
      return;
    }

    const session = sessionTypes.find(s => s.id === sessionType);
    if (!session) return;

    // Parse time and create booking
    const [time, period] = selectedTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;

    const startTime = new Date(selectedDate);
    startTime.setHours(hour24, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + session.duration);

    try {
      setIsBooking(true);
      const response = await bookingsApi.createBooking({
        userId: user.userId,
        coachId: selectedCoach.userId,
        bookingType: session.name,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notes || undefined,
      });

      if (response.success) {
        showToast(`Session booked with ${selectedCoach.name}!`, "success");
        setSelectedTime("");
        setNotes("");
      } else {
        const errMsg =
          response.message ?? (response.errors ? response.errors.join(", ") : undefined) ?? "Failed to book session";
        showToast(errMsg, "error");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      showToast("Failed to book session", "error");
    } finally {
      setIsBooking(false);
    }
  };

  const currentSession = sessionTypes.find(s => s.id === sessionType);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Book a Coach</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-10">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <Input
              placeholder="Search coaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
            <SelectTrigger className="w-full md:w-[200px] bg-zinc-900 border-zinc-800">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              <SelectItem value="Strength Training">Strength Training</SelectItem>
              <SelectItem value="HIIT">HIIT</SelectItem>
              <SelectItem value="Recovery">Recovery</SelectItem>
              <SelectItem value="Yoga">Yoga</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Coach Selection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Coaches List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCoaches.map((coach) => (
                <Card
                  key={coach.userId}
                  className={`p-4 bg-zinc-900/60 border-zinc-800/50 cursor-pointer transition-all hover:border-orange-500/50 ${
                    selectedCoach?.userId === coach.userId ? "border-orange-500 ring-1 ring-orange-500/50" : ""
                  }`}
                  onClick={() => setSelectedCoach(coach)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold">
                        {coach.name.charAt(0)}
                      </div>
                      {coach.isActive && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-zinc-900" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {coach.name}
                        <CheckCircle className="h-4 w-4 text-orange-500" />
                      </h3>
                      <p className="text-sm text-zinc-400">{coach.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-orange-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium">{coach.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-zinc-500">({coach.totalReviews} reviews)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {coach.specializations?.slice(0, 2).map((spec) => (
                          <span key={spec} className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredCoaches.length === 0 && (
              <Card className="p-8 bg-zinc-900/60 border-zinc-800 text-center">
                <p className="text-zinc-400">No coaches found matching your criteria</p>
              </Card>
            )}

            {/* Selected Coach Details */}
            {selectedCoach && (
              <Card className="p-6 bg-zinc-900/60 border-zinc-800/50">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative mx-auto md:mx-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 p-1">
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-4xl font-bold">
                        {selectedCoach.name.charAt(0)}
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-zinc-900 rounded-full p-1.5 border border-zinc-700">
                      <CheckCircle className="h-4 w-4 text-orange-500" />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold">{selectedCoach.name}</h2>
                    <p className="text-orange-500 font-medium">Professional Fitness Coach</p>
                    <p className="text-zinc-500 text-sm flex items-center justify-center md:justify-start gap-1 mt-1">
                      <MapPin className="h-4 w-4" /> Location varies
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                      {selectedCoach.specializations?.map((spec) => (
                        <span key={spec} className="px-3 py-1 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-white">
                          {spec}
                        </span>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-zinc-800">
                      <div className="text-center md:text-left">
                        <p className="text-xl font-bold">{selectedCoach.totalReviews}</p>
                        <p className="text-xs text-zinc-500 uppercase">Sessions</p>
                      </div>
                      <div className="text-center md:text-left border-l border-zinc-800 pl-4">
                        <div className="flex items-center gap-1 justify-center md:justify-start">
                          <Star className="h-4 w-4 text-orange-500 fill-current" />
                          <span className="text-xl font-bold">{selectedCoach.averageRating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 uppercase">Rating</p>
                      </div>
                      <div className="text-center md:text-left border-l border-zinc-800 pl-4">
                        <p className="text-xl font-bold">98%</p>
                        <p className="text-xs text-zinc-500 uppercase">Success</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Booking Panel */}
          <div className="lg:col-span-5">
            <Card className="p-6 bg-zinc-900/85 border-orange-500/20 backdrop-blur-xl sticky top-24">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                <h3 className="text-xl font-bold">Book Session</h3>
                {selectedCoach?.isActive && (
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Available Now
                  </div>
                )}
              </div>

              {/* Session Type */}
              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                  Session Type
                </label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - {type.tokens} tokens
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calendar */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                    {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNextWeek}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {weekDates.map((date, index) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                        date.toDateString() === selectedDate.toDateString()
                          ? "bg-orange-500 text-zinc-900 border-orange-500"
                          : date < new Date()
                          ? "text-zinc-600 border-transparent cursor-not-allowed"
                          : "border-transparent hover:bg-zinc-800 text-white"
                      }`}
                      disabled={date < new Date()}
                    >
                      <span className="text-[10px] uppercase">{dayNames[index]}</span>
                      <span className="font-bold">{date.getDate()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                  Available Slots
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                        selectedTime === time
                          ? "border-orange-500 bg-orange-500/20 text-orange-500"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                  Notes (Optional)
                </label>
                <Input
                  placeholder="Any special requests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Summary & Action */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-zinc-400">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{currentSession?.tokens || 0} tokens</span>
                    <p className="text-xs text-zinc-500">~{currentSession?.duration || 0} minutes</p>
                  </div>
                </div>
                
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-zinc-900 font-bold py-6"
                  onClick={handleBookSession}
                  disabled={!selectedCoach || !selectedTime || isBooking}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
                
                <Link href={`/chat?coachId=${selectedCoach?.userId}`}>
                  <Button variant="ghost" className="w-full mt-3 text-zinc-400 hover:text-white">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ask a question before booking
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BookCoachPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <BookCoachContent />
    </ProtectedRoute>
  );
}
