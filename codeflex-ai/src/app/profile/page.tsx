"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import {
  workoutPlansApi,
  nutritionPlansApi,
  usersApi,
  type MemberWorkoutPlanDto,
  type NutritionPlanDto,
  type UpdateProfileDto,
} from "@/lib/api";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Edit2,
  Dumbbell,
  Apple,
  Clock,
  Target,
  ChevronRight,
  Save,
  X,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import Link from "next/link";

function ProfileContent() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [workoutPlans, setWorkoutPlans] = useState<MemberWorkoutPlanDto[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanDto[]>([]);
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<MemberWorkoutPlanDto | null>(null);
  const [selectedNutritionPlan, setSelectedNutritionPlan] = useState<NutritionPlanDto | null>(null);
  
  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateProfileDto>({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: 0,
    address: "",
    profileImageUrl: "",
  });

  // API base for image upload
  const API_BASE = (
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5025/api"
  ).replace(/\/$/, "");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch workout and nutrition plans separately to handle individual failures
        try {
          const workoutRes = await workoutPlansApi.getMemberPlans(user.userId);
          if (workoutRes.success && workoutRes.data) {
            setWorkoutPlans(workoutRes.data);
            const activePlan = workoutRes.data.find((p) => p.isActive) || workoutRes.data[0];
            setSelectedWorkoutPlan(activePlan || null);
          }
        } catch (workoutError) {
          console.error("Failed to fetch workout plans:", workoutError);
          // Continue with empty workout plans
        }

        try {
          const nutritionRes = await nutritionPlansApi.getMemberPlans(user.userId);
          if (nutritionRes.success && nutritionRes.data) {
            setNutritionPlans(nutritionRes.data);
            const activePlan = nutritionRes.data.find((p) => p.isActive) || nutritionRes.data[0];
            setSelectedNutritionPlan(activePlan || null);
          }
        } catch (nutritionError) {
          console.error("Failed to fetch nutrition plans:", nutritionError);
          // Continue with empty nutrition plans
        }

        // Initialize edit form with user data
        setEditForm({
          name: user.name || "",
          phone: user.phone || "",
          dateOfBirth: user.dateOfBirth || "",
          gender: user.gender || 0,
          address: user.address || "",
          profileImageUrl: user.profileImageUrl || "",
        });
        setPreviewImage(user.profileImageUrl || null);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        showToast("Failed to load fitness plans", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image file (JPEG, PNG, GIF, or WebP)", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert to base64 first
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      // Set preview immediately
      setPreviewImage(base64);
      
      // Try to upload to backend first
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/users/upload-image`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.data?.imageUrl || data.imageUrl;
          if (imageUrl) {
            setEditForm(prev => ({ ...prev, profileImageUrl: imageUrl }));
            showToast("Image uploaded successfully!", "success");
            return;
          }
        }
      } catch {
        // Backend upload failed, use base64 approach
      }

      // Fallback: Use base64 (store directly in profile)
      setEditForm(prev => ({ ...prev, profileImageUrl: base64 }));
      showToast("Image selected successfully!", "success");
      
    } catch (error) {
      console.error("Failed to process image:", error);
      showToast("Failed to process image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.userId) return;
    setIsSaving(true);

    try {
      const response = await usersApi.updateProfile(user.userId, editForm);
      if (response.success) {
        showToast("Profile updated successfully!", "success");
        setShowEditModal(false);
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        showToast(response.message || "Failed to update profile", "error");
      }
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getGenderLabel = (gender: number) => {
    switch (gender) {
      case 1:
        return "Male";
      case 2:
        return "Female";
      default:
        return "Not specified";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  const hasPlans = workoutPlans.length > 0 || nutritionPlans.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <Card className="p-6 border border-border bg-card/50 overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary/10 border-4 border-primary/20">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              )}
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{user?.name || "User"}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <Button onClick={() => setShowEditModal(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {user?.phone || "Not set"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {formatDate(user?.dateOfBirth || "")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {getGenderLabel(user?.gender || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground truncate">
                  {user?.address || "Not set"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Fitness Plans */}
      {hasPlans ? (
        <div className="space-y-6">
          {/* Plan selector tabs */}
          <Tabs defaultValue="workout" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="workout" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Workout Plans ({workoutPlans.length})
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                <Apple className="h-4 w-4" />
                Nutrition Plans ({nutritionPlans.length})
              </TabsTrigger>
            </TabsList>

            {/* Workout Plans Tab */}
            <TabsContent value="workout" className="space-y-4">
              {workoutPlans.length === 0 ? (
                <Card className="p-8 text-center border border-border bg-card/50">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Workout Plans</h3>
                  <p className="text-muted-foreground mb-4">
                    You don&apos;t have any workout plans assigned yet.
                  </p>
                  <Link href="/bookings">
                    <Button>Book a Coach Session</Button>
                  </Link>
                </Card>
              ) : (
                <>
                  {/* Plan selector */}
                  <div className="flex gap-2 flex-wrap">
                    {workoutPlans.map((plan) => (
                      <Button
                        key={plan.memberPlanId}
                        variant={selectedWorkoutPlan?.memberPlanId === plan.memberPlanId ? "default" : "outline"}
                        onClick={() => setSelectedWorkoutPlan(plan)}
                        className="gap-2"
                      >
                        {plan.templateName}
                        {plan.isActive && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">
                            ACTIVE
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>

                  {/* Selected plan details */}
                  {selectedWorkoutPlan && (
                    <Card className="p-6 border border-border bg-card/50">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-primary">
                            {selectedWorkoutPlan.templateName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedWorkoutPlan.description}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Progress: {selectedWorkoutPlan.completionPercentage || 0}%
                          </div>
                          <div className="mt-1 w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${selectedWorkoutPlan.completionPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Workout days */}
                      {selectedWorkoutPlan.workoutDays && selectedWorkoutPlan.workoutDays.length > 0 ? (
                        <Accordion type="multiple" className="space-y-3">
                          {selectedWorkoutPlan.workoutDays.map((day, idx) => (
                            <AccordionItem
                              key={idx}
                              value={`day-${idx}`}
                              className="border border-border rounded-lg overflow-hidden"
                            >
                              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/5">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-semibold">{day.dayName}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {day.exercises?.length || 0} exercises
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-3 mt-2">
                                  {day.exercises?.map((exercise, exIdx) => (
                                    <div
                                      key={exIdx}
                                      className="flex items-center justify-between p-3 bg-primary/5 rounded-lg"
                                    >
                                      <div>
                                        <div className="font-medium">{exercise.exerciseName}</div>
                                        {exercise.notes && (
                                          <div className="text-sm text-muted-foreground mt-1">
                                            {exercise.notes}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-3 text-sm">
                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                                          {exercise.sets} sets
                                        </span>
                                        <span className="px-2 py-1 bg-secondary/10 text-secondary rounded">
                                          {exercise.reps} reps
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No workout days defined for this plan
                        </p>
                      )}
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Nutrition Plans Tab */}
            <TabsContent value="nutrition" className="space-y-4">
              {nutritionPlans.length === 0 ? (
                <Card className="p-8 text-center border border-border bg-card/50">
                  <Apple className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Nutrition Plans</h3>
                  <p className="text-muted-foreground mb-4">
                    You don&apos;t have any nutrition plans yet.
                  </p>
                  <Link href="/ai-coach">
                    <Button>Generate with AI</Button>
                  </Link>
                </Card>
              ) : (
                <>
                  {/* Plan selector */}
                  <div className="flex gap-2 flex-wrap">
                    {nutritionPlans.map((plan) => (
                      <Button
                        key={plan.planId}
                        variant={selectedNutritionPlan?.planId === plan.planId ? "default" : "outline"}
                        onClick={() => setSelectedNutritionPlan(plan)}
                        className="gap-2"
                      >
                        {plan.planName}
                        {plan.isActive && (
                          <span className="px-1.5 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">
                            ACTIVE
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>

                  {/* Selected plan details */}
                  {selectedNutritionPlan && (
                    <Card className="p-6 border border-border bg-card/50">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-primary">
                            {selectedNutritionPlan.planName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedNutritionPlan.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {selectedNutritionPlan.dailyCalories}
                          </div>
                          <div className="text-sm text-muted-foreground">kcal/day</div>
                        </div>
                      </div>

                      {/* Macros */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-500">
                            {selectedNutritionPlan.proteinGrams || 0}g
                          </div>
                          <div className="text-sm text-muted-foreground">Protein</div>
                        </div>
                        <div className="p-4 bg-orange-500/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-orange-500">
                            {selectedNutritionPlan.carbsGrams || 0}g
                          </div>
                          <div className="text-sm text-muted-foreground">Carbs</div>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {selectedNutritionPlan.fatGrams || 0}g
                          </div>
                          <div className="text-sm text-muted-foreground">Fat</div>
                        </div>
                      </div>

                      {/* Meals */}
                      {selectedNutritionPlan.meals && selectedNutritionPlan.meals.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Meals</h4>
                          {selectedNutritionPlan.meals.map((meal, idx) => (
                            <div
                              key={idx}
                              className="p-4 border border-border rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-primary" />
                                  {meal.mealName}
                                </h5>
                                {meal.mealTime && (
                                  <span className="text-sm text-muted-foreground">
                                    {meal.mealTime}
                                  </span>
                                )}
                              </div>
                              {meal.foods && meal.foods.length > 0 && (
                                <ul className="space-y-2">
                                  {meal.foods.map((food, foodIdx) => (
                                    <li
                                      key={foodIdx}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="flex items-center gap-2">
                                        <ChevronRight className="h-3 w-3 text-primary" />
                                        {food.name}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {food.quantity} {food.unit}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No meals defined for this plan
                        </p>
                      )}
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card className="p-12 text-center border border-border bg-card/50">
          <div className="max-w-md mx-auto">
            <Dumbbell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No Fitness Plans Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your fitness journey by booking a session with a coach or using our AI assistant.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/bookings">
                <Button>Book a Coach</Button>
              </Link>
              <Link href="/ai-coach">
                <Button variant="outline">Try AI Coach</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={editForm.dateOfBirth?.split("T")[0] || ""}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select
                value={String(editForm.gender)}
                onValueChange={(value) => setEditForm({ ...editForm, gender: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Not specified</SelectItem>
                  <SelectItem value="1">Male</SelectItem>
                  <SelectItem value="2">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Your address"
              />
            </div>

            {/* Profile Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Picture</label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 border-2 border-border flex-shrink-0">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Upload button */}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <div className={`flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-sm text-muted-foreground">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {previewImage ? 'Change Photo' : 'Upload Photo'}
                          </span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ProfileContent />
    </ProtectedRoute>
  );
}
