"use client";

import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Edit,
  Share2,
  Award,
  Users,
  Clock,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  Loader2,
  Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { 
  usersApi, 
  coachReviewsApi, 
  bookingsApi, 
  type UpdateProfileDto, 
  type CoachReviewDto,
  type CoachProfileDto,
  type UpdateCoachProfileDto
} from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface EditFormState extends UpdateProfileDto {
  specialization?: string;
  certifications?: string;
  experienceYears?: number;
  bio?: string;
  hourlyRate?: number;
  availabilitySchedule?: string;
  isAvailable?: boolean;
}

function CoachProfileContent() {
  const { user, updateUserFields } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<CoachReviewDto[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [coachProfile, setCoachProfile] = useState<CoachProfileDto | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile form state
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: 0,
    address: "",
    profileImageUrl: "",
    specialization: "",
    certifications: "",
    experienceYears: 0,
    bio: "",
    hourlyRate: 0,
    availabilitySchedule: "",
    isAvailable: true,
  });

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch reviews
        const reviewsRes = await coachReviewsApi.getCoachReviews(user.userId);
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data);
        }

        // Fetch average rating
        const ratingRes = await coachReviewsApi.getCoachAverageRating(user.userId);
        if (ratingRes.success && ratingRes.data) {
          setAverageRating(ratingRes.data);
        }

        // Fetch bookings to count sessions
        const bookingsRes = await bookingsApi.getCoachBookings(user.userId);
        if (bookingsRes.success && bookingsRes.data) {
          setTotalSessions(bookingsRes.data.filter(b => b.status === 2).length);
        }

        // Fetch coach professional profile
        const coachProfileRes = await usersApi.getCoachProfile(user.userId);
        let currentProfile: CoachProfileDto | null = null;
        if (coachProfileRes.success && coachProfileRes.data) {
          setCoachProfile(coachProfileRes.data);
          currentProfile = coachProfileRes.data;
        }

        // Initialize edit form
        setEditForm({
          name: user.name || "",
          phone: user.phone || "",
          dateOfBirth: user.dateOfBirth?.split("T")[0] || "",
          gender: user.gender || 0,
          address: user.address || "",
          profileImageUrl: user.profileImageUrl || "",
          specialization: currentProfile?.specialization || "",
          certifications: currentProfile?.certifications?.join(", ") || "",
          experienceYears: currentProfile?.experienceYears || 0,
          bio: currentProfile?.bio || "",
          hourlyRate: currentProfile?.hourlyRate || 0,
          availabilitySchedule: currentProfile?.availabilitySchedule || "",
          isAvailable: currentProfile?.isAvailable !== false,
        });
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.userId) return;

    try {
      setIsSaving(true);
      
      // 1. Update basic user profile
      const userProfileData: UpdateProfileDto = {
        name: editForm.name,
        phone: editForm.phone,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        address: editForm.address,
        profileImageUrl: editForm.profileImageUrl,
      };
      
      const userRes = await usersApi.updateProfile(user.userId, userProfileData);
      if (userRes.success && userRes.data) {
        updateUserFields({
          name: userRes.data.name,
          phone: userRes.data.phone,
          address: userRes.data.address,
          dateOfBirth: userRes.data.dateOfBirth,
          gender: userRes.data.gender,
        });
      }
      
      // 2. Update coach professional profile
      const certsArray = editForm.certifications
        ? editForm.certifications.split(",").map(c => c.trim()).filter(Boolean)
        : [];
      
      const coachProfileData: UpdateCoachProfileDto = {
        specialization: editForm.specialization,
        certifications: certsArray,
        experienceYears: editForm.experienceYears ? Number(editForm.experienceYears) : undefined,
        bio: editForm.bio,
        hourlyRate: editForm.hourlyRate ? Number(editForm.hourlyRate) : undefined,
        availabilitySchedule: editForm.availabilitySchedule,
        isAvailable: editForm.isAvailable,
      };
      
      const coachRes = await usersApi.updateCoachProfile(user.userId, coachProfileData);
      
      if (userRes.success && coachRes.success) {
        showToast("Profile and professional details updated successfully!", "success");
        setCoachProfile(coachRes.data || null);
        setShowEditModal(false);
      } else {
        const errorMsg = !userRes.success 
          ? (userRes.message || "Failed to update basic profile")
          : (coachRes.message || "Failed to update professional profile");
        showToast(errorMsg, "error");
      }
    } catch (error) {
      console.error("Save failed:", error);
      showToast("Failed to save profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? "text-orange-500 fill-current" : "text-slate-300"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 lg:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-blue-500/20">
                <Award className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold">Pulse<span className="text-primary">Gym</span></h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-slate-600 hover:bg-slate-100">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-10 py-8 space-y-8">
        {/* Hero Profile Section */}
        <section className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-sm p-1">
          {/* Background Gradient */}
          <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          </div>
          
          <div className="relative pt-24 px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-end md:items-center">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-br from-orange-500 to-amber-300 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                  <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-800 text-5xl font-bold border-4 border-white">
                    {user?.name?.charAt(0) || "C"}
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
              </div>

              {/* Info */}
              <div className="flex-1 mb-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-1 text-slate-900">{user?.name}</h1>
                    <p className="text-slate-600 text-lg flex items-center gap-2 font-medium">
                      <CheckCircle className="h-4 w-4 text-orange-500" />
                      {coachProfile?.specialization ? coachProfile.specialization.split(",")[0] : "Professional Fitness Coach"}
                    </p>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user?.address || "Location not set"}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="border-slate-200 hover:bg-slate-50 text-slate-700 bg-white"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
              <div className="text-center md:text-left">
                <p className="text-2xl font-bold text-slate-900">{totalSessions}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Sessions Led</p>
              </div>
              <div className="text-center md:text-left md:border-l md:border-slate-100 md:pl-8">
                <div className="flex items-center gap-1 justify-center md:justify-start">
                  <Star className="h-5 w-5 text-orange-500 fill-current" />
                  <span className="text-2xl font-bold text-slate-900">{averageRating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Rating</p>
              </div>
              <div className="text-center md:text-left md:border-l md:border-slate-100 md:pl-8">
                <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Reviews</p>
              </div>
              <div className="text-center md:text-left md:border-l md:border-slate-100 md:pl-8">
                <p className="text-2xl font-bold text-slate-900">98%</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Success Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio Section */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                <MessageCircle className="h-5 w-5 text-orange-500" />
                About Me
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {coachProfile?.bio || `I'm ${user?.name || 'a coach'}, a dedicated fitness professional committed to helping you achieve your health and fitness goals. With a personalized approach, I focus on building sustainable habits and unlocking your full potential.`}
              </p>
            </Card>

            {/* Specializations */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                <Award className="h-5 w-5 text-orange-500" />
                Specializations
              </h3>
              <div className="flex flex-wrap gap-2">
                {coachProfile?.specialization ? (
                  coachProfile.specialization.split(",").map(s => s.trim()).filter(Boolean).map((spec) => (
                    <span
                      key={spec}
                      className="px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-sm text-slate-700 hover:border-primary/50 transition-colors font-medium"
                    >
                      {spec}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 italic">No specializations specified</span>
                )}
              </div>
            </Card>

            {/* Certifications */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                <Award className="h-5 w-5 text-orange-500" />
                Certifications
              </h3>
              <div className="flex flex-wrap gap-2">
                {coachProfile?.certifications && coachProfile.certifications.length > 0 ? (
                  coachProfile.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium"
                    >
                      {cert}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 italic">No certifications added yet</span>
                )}
              </div>
            </Card>

            {/* Reviews Section */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                  <Star className="h-5 w-5 text-orange-500" />
                  Client Reviews ({reviews.length})
                </h3>
              </div>
              
              {reviews.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.reviewId}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold">
                            {review.isAnonymous ? "?" : review.userName?.charAt(0) || "U"}
                          </div>
                          <span className="font-semibold text-slate-800">
                            {review.isAnonymous ? "Anonymous" : review.userName}
                          </span>
                        </div>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      <p className="text-sm text-slate-600 italic">
                        &quot;{review.reviewText || "Great session!"}&quot;
                      </p>
                      <p className="text-xs text-slate-400 mt-2 font-medium">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Availability Card */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                <Clock className="h-5 w-5 text-orange-500" />
                Availability Schedule
              </h3>
              {coachProfile?.availabilitySchedule ? (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-slate-700 text-sm whitespace-pre-line font-medium">
                    {coachProfile.availabilitySchedule}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Monday - Friday</span>
                    <span className="text-slate-700 font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Saturday</span>
                    <span className="text-slate-700 font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Sunday</span>
                    <span className="text-slate-400 font-medium">Closed</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Professional Details */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Professional Info
              </h3>
              <div className="space-y-3">
                <div className="text-sm flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Hourly Rate</span>
                  <span className="text-slate-950 font-bold bg-orange-55 text-orange-700 px-2 py-1 rounded-md text-xs">{coachProfile?.hourlyRate ? `${coachProfile.hourlyRate} tokens/hr` : "Not set"}</span>
                </div>
                <div className="text-sm flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Experience</span>
                  <span className="text-slate-950 font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs">{coachProfile?.experienceYears ? `${coachProfile.experienceYears} Years` : "Not set"}</span>
                </div>
                <div className="text-sm flex justify-between items-center">
                  <span className="text-slate-500">Status</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${coachProfile?.isAvailable ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {coachProfile?.isAvailable ? "Accepting Clients" : "Unavailable"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card className="p-6 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                <Users className="h-5 w-5 text-orange-500" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-slate-500">Email</p>
                  <p className="text-slate-800 font-semibold">{user?.email}</p>
                </div>
                <div className="text-sm">
                  <p className="text-slate-500">Phone</p>
                  <p className="text-slate-800 font-semibold">{user?.phone || "Not provided"}</p>
                </div>
              </div>
            </Card>

            {/* Performance Summary */}
            <Card className="p-6 bg-gradient-to-br from-orange-50/70 to-orange-100/30 border border-orange-200/60 shadow-sm rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                This Month
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">Sessions Completed</span>
                    <span className="text-slate-900 font-bold">24</span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">Client Satisfaction</span>
                    <span className="text-slate-900 font-bold">98%</span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: "98%" }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-2xl overflow-y-auto max-h-[90vh] rounded-3xl p-6 shadow-xl">
          <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">Edit Profile & Professional Info</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {/* Left Column: Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-primary border-l-2 border-primary pl-2 text-sm uppercase tracking-wider">Basic Information</h4>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Name</label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Phone</label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Address</label>
                <Input
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Date of Birth</label>
                <Input
                  type="date"
                  value={editForm.dateOfBirth || ""}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Right Column: Professional Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-orange-500 border-l-2 border-orange-500 pl-2 text-sm uppercase tracking-wider">Professional Details</h4>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Specialization (comma-separated)</label>
                <Input
                  value={editForm.specialization || ""}
                  onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                  placeholder="Strength Training, HIIT, Cardio"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Certifications (comma-separated)</label>
                <Input
                  value={editForm.certifications || ""}
                  onChange={(e) => setEditForm({ ...editForm, certifications: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                  placeholder="ISSA Personal Trainer, CPR/AED"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Hourly Rate (Tokens)</label>
                  <Input
                    type="number"
                    value={editForm.hourlyRate === 0 ? "" : editForm.hourlyRate}
                    onChange={(e) => setEditForm({ ...editForm, hourlyRate: Number(e.target.value) })}
                    className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                    placeholder="e.g. 50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Experience (Years)</label>
                  <Input
                    type="number"
                    value={editForm.experienceYears === 0 ? "" : editForm.experienceYears}
                    onChange={(e) => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })}
                    className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Availability Schedule</label>
                <Input
                  value={editForm.availabilitySchedule || ""}
                  onChange={(e) => setEditForm({ ...editForm, availabilitySchedule: e.target.value })}
                  className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                  placeholder="Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
                />
              </div>
            </div>
          </div>
          
          {/* Full Width Bio */}
          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Professional Bio</label>
            <textarea
              value={editForm.bio || ""}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-slate-900"
              placeholder="Write a brief bio about your coaching style, philosophy, and experience..."
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isAvailable"
              checked={editForm.isAvailable}
              onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
            />
            <label htmlFor="isAvailable" className="text-sm font-semibold text-slate-700 select-none cursor-pointer">
              Available to accept new clients
            </label>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CoachProfilePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachProfileContent />
    </ProtectedRoute>
  );
}
