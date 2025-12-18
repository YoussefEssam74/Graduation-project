"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Star,
  Clock,
  User,
  Calendar,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, bookingsApi, coachReviewsApi } from "@/lib/api";
import { UserDto } from "@/lib/api/auth";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

// Coach with rating from API
interface CoachWithRating extends UserDto {
  averageRating: number;
  reviewCount: number;
}

function BookCoachContent() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [coaches, setCoaches] = useState<CoachWithRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Booking Modal
  const [selectedCoach, setSelectedCoach] = useState<CoachWithRating | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Fetch coaches with ratings
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
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
                  averageRating: ratingResponse.success ? (ratingResponse.data || 0) : 0,
                  reviewCount: reviewsResponse.success ? (reviewsResponse.data?.length || 0) : 0,
                };
              } catch {
                return {
                  ...coach,
                  averageRating: 0,
                  reviewCount: 0,
                };
              }
            })
          );
          setCoaches(coachesWithRatings);
        }
      } catch (error) {
        console.error("Failed to load coaches", error);
        showToast("Failed to load coaches", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoaches();
  }, [showToast]);

  // Filter coaches by search
  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const router = useRouter();

  const handleBookClick = (coach: CoachWithRating) => {
    router.push(`/book-coach/${coach.userId}`);
  };

  const confirmBooking = async () => {
    if (!user || !selectedCoach || !bookingDate || !bookingTime) {
      showToast("Please select date and time", "error");
      return;
    }

    setIsBooking(true);

    // Create start and end times
    const startTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    try {
      const res = await bookingsApi.createBooking({
        userId: user.userId,
        coachId: selectedCoach.userId,
        bookingType: "PersonalTraining",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: `Session with ${selectedCoach.name}`
      });

      if (res.success) {
        showToast(`Booked session with ${selectedCoach.name}!`, "success");
        setIsModalOpen(false);
        refreshUser(); // Refresh token balance
      } else {
        showToast(res.message || "Failed to book session", "error");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      showToast("Failed to create booking", "error");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 relative">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          opacity: 0.1
        }}
      />

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Book a Coach</h1>
          <p className="text-slate-500">Find the perfect coach for your fitness journey</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coaches by name..."
              className="pl-10 h-11 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Coaches Grid */}
        {filteredCoaches.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No coaches found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoaches.map((coach) => (
              <Card
                key={coach.userId}
                className="overflow-hidden bg-white border border-slate-100 hover:shadow-lg transition-shadow"
              >
                {/* Coach Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 relative">
                  {coach.profileImageUrl ? (
                    <img
                      src={coach.profileImageUrl}
                      alt={coach.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-white/50" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${coach.isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-500 text-white'
                      }`}>
                      {coach.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Coach Info */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{coach.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{coach.email}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-slate-900">
                        {coach.averageRating > 0 ? coach.averageRating.toFixed(1) : '--'}
                      </span>
                    </div>
                    <span className="text-slate-400 text-sm">
                      ({coach.reviewCount} {coach.reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>

                  {/* Contact Info */}
                  {coach.phone && (
                    <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {coach.phone}
                    </p>
                  )}

                  {/* Book Button */}
                  <Button
                    onClick={() => handleBookClick(coach)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                    disabled={!coach.isActive}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              Schedule a training session with {selectedCoach?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <Input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
              <Input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-600">
                <strong>Duration:</strong> 1 hour
              </p>
              <p className="text-sm text-slate-600 mt-1">
                <strong>Coach:</strong> {selectedCoach?.name}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmBooking}
              disabled={isBooking || !bookingDate || !bookingTime}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
