"use client";

import { useState, useEffect } from "react";
import {
  PackagePlus,
  Dumbbell,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Tag,
  Calendar,
  Percent,
  Zap,
  Utensils,
  Shield,
  UserCheck,
  Star,
  Clock,
  Bot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { subscriptionApi, type SubscriptionPlanDto } from "@/lib/api/subscription";
import { couponsApi, type CouponDto, DiscountType } from "@/lib/api/coupons";
import { statsApi, type AdminStatsDto } from "@/lib/api/stats";
import Link from "next/link";

function AdminPackagesContent() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal controls
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planModalType, setPlanModalType] = useState<"create" | "edit" | "delete">("create");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanDto | null>(null);

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponModalType, setCouponModalType] = useState<"create" | "edit" | "delete">("create");
  const [selectedCoupon, setSelectedCoupon] = useState<CouponDto | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Plan Form State
  const [planName, setPlanName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [description, setDescription] = useState("");
  const [tokensIncluded, setTokensIncluded] = useState<number>(0);
  const [invitationsAllowed, setInvitationsAllowed] = useState<number>(0);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState<number>(5);
  const [maxFreezeDays, setMaxFreezeDays] = useState<number>(7);
  const [isPopular, setIsPopular] = useState(false);
  const [isActivePlan, setIsActivePlan] = useState(true);
  // AI plan quota
  const [freeWorkoutPlans, setFreeWorkoutPlans] = useState<number>(1);
  const [freeNutritionPlans, setFreeNutritionPlans] = useState<number>(1);
  const [extraWorkoutPlanTokenCost, setExtraWorkoutPlanTokenCost] = useState<number>(10);
  const [extraNutritionPlanTokenCost, setExtraNutritionPlanTokenCost] = useState<number>(10);
  const [freeAiCoachMessagesPerDay, setFreeAiCoachMessagesPerDay] = useState<number>(10);

  // All predefined features
  const PREDEFINED_FEATURES = [
    { key: "AI Coach", icon: Bot },
    { key: "AI Workout Generator", icon: Zap },
    { key: "AI Nutrition Plan", icon: Utensils },
    { key: "Free Guest Pass", icon: Users },
  ];

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  // Coupon Form State
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.Percentage);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [expiryDate, setExpiryDate] = useState("");
  const [maxUsage, setMaxUsage] = useState<number | "">("");
  const [isActiveCoupon, setIsActiveCoupon] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansRes, couponsRes, statsRes] = await Promise.all([
        subscriptionApi.getAllPlans(),
        couponsApi.getAllCoupons(),
        statsApi.getAdminStats().catch(() => ({ success: false, data: null })),
      ]);

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      } else {
        throw new Error(plansRes.errors?.[0] || plansRes.message || "Failed to load packages");
      }

      if (couponsRes.success && couponsRes.data) {
        setCoupons(couponsRes.data);
      }

      if (statsRes && statsRes.success && statsRes.data) {
        setAdminStats(statsRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading packages and coupons");
    } finally {
      setLoading(false);
    }
  };

  // Plan Handlers
  const openPlanModal = (type: "create" | "edit" | "delete", plan?: SubscriptionPlanDto) => {
    setPlanModalType(type);
    setSelectedPlan(plan || null);

    if (plan) {
      setPlanName(plan.planName);
      setPrice(plan.price);
      setDurationDays(plan.durationDays);
      setDescription(plan.description || "");
      setTokensIncluded(plan.tokensIncluded);
      setInvitationsAllowed(plan.invitationsAllowed);
      setSelectedFeatures(plan.features ? plan.features.split(",").map(f => f.trim()).filter(Boolean) : []);
      setMaxBookingsPerDay(plan.maxBookingsPerDay || 5);
      setMaxFreezeDays(plan.maxFreezeDays || 7);
      setIsPopular(plan.isPopular);
      setIsActivePlan(plan.isActive);
      setFreeWorkoutPlans(plan.freeWorkoutPlans ?? 1);
      setFreeNutritionPlans(plan.freeNutritionPlans ?? 1);
      setExtraWorkoutPlanTokenCost(plan.extraWorkoutPlanTokenCost ?? 10);
      setExtraNutritionPlanTokenCost(plan.extraNutritionPlanTokenCost ?? 10);
      setFreeAiCoachMessagesPerDay(plan.freeAiCoachMessagesPerDay ?? 10);
    } else {
      setPlanName("");
      setPrice(0);
      setDurationDays(30);
      setDescription("");
      setTokensIncluded(0);
      setInvitationsAllowed(0);
      setSelectedFeatures([]);
      setMaxBookingsPerDay(5);
      setMaxFreezeDays(7);
      setIsPopular(false);
      setIsActivePlan(true);
      setFreeWorkoutPlans(1);
      setFreeNutritionPlans(1);
      setExtraWorkoutPlanTokenCost(10);
      setExtraNutritionPlanTokenCost(10);
      setFreeAiCoachMessagesPerDay(10);
    }
    setIsPlanModalOpen(true);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName) return;

    setIsSubmitting(true);
    try {
      const payload = {
        planName,
        price,
        durationDays,
        description,
        tokensIncluded,
        invitationsAllowed,
        features: selectedFeatures.join(", "),
        maxBookingsPerDay,
        maxFreezeDays,
        isPopular,
        freeWorkoutPlans,
        freeNutritionPlans,
        extraWorkoutPlanTokenCost,
        extraNutritionPlanTokenCost,
        freeAiCoachMessagesPerDay,
      };

      if (planModalType === "create") {
        const res = await subscriptionApi.createPlan(payload);
        if (res.success) {
          showToast("Subscription plan created", "success");
          setIsPlanModalOpen(false);
          fetchData();
        } else {
          showToast(res.message || "Failed to create plan", "error");
        }
      } else if (planModalType === "edit" && selectedPlan) {
        const res = await subscriptionApi.updatePlan(selectedPlan.planId, {
          ...payload,
          isActive: isActivePlan,
        });
        if (res.success) {
          showToast("Subscription plan updated", "success");
          setIsPlanModalOpen(false);
          fetchData();
        } else {
          showToast(res.message || "Failed to update plan", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanDelete = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      const res = await subscriptionApi.deletePlan(selectedPlan.planId);
      if (res.success) {
        showToast("Subscription plan deleted", "success");
        setIsPlanModalOpen(false);
        fetchData();
      } else {
        showToast(res.message || "Failed to delete plan", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred during deletion", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Coupon Handlers
  const openCouponModal = (type: "create" | "edit" | "delete", coupon?: CouponDto) => {
    setCouponModalType(type);
    setSelectedCoupon(coupon || null);

    if (coupon) {
      setCouponCode(coupon.code);
      setDiscountType(coupon.discountType);
      setDiscountValue(coupon.discountValue);
      setExpiryDate(new Date(coupon.expiryDate).toISOString().split("T")[0]);
      setMaxUsage(coupon.maxUsage || "");
      setIsActiveCoupon(coupon.isActive);
    } else {
      setCouponCode("");
      setDiscountType(DiscountType.Percentage);
      setDiscountValue(0);
      setExpiryDate("");
      setMaxUsage("");
      setIsActiveCoupon(true);
    }
    setIsCouponModalOpen(true);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: couponCode.toUpperCase(),
        discountType,
        discountValue,
        expiryDate: new Date(expiryDate).toISOString(),
        maxUsage: maxUsage === "" ? undefined : Number(maxUsage),
      };

      if (couponModalType === "create") {
        const res = await couponsApi.createCoupon(payload);
        if (res.success) {
          showToast("Coupon created successfully", "success");
          setIsCouponModalOpen(false);
          fetchData();
        } else {
          showToast(res.message || "Failed to create coupon", "error");
        }
      } else if (couponModalType === "edit" && selectedCoupon) {
        const res = await couponsApi.updateCoupon(selectedCoupon.couponId, {
          ...payload,
          isActive: isActiveCoupon,
        });
        if (res.success) {
          showToast("Coupon updated successfully", "success");
          setIsCouponModalOpen(false);
          fetchData();
        } else {
          showToast(res.message || "Failed to update coupon", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCouponDelete = async () => {
    if (!selectedCoupon) return;
    setIsSubmitting(true);
    try {
      const res = await couponsApi.deleteCoupon(selectedCoupon.couponId);
      if (res.success) {
        showToast("Coupon deleted successfully", "success");
        setIsCouponModalOpen(false);
        fetchData();
      } else {
        showToast(res.message || "Failed to delete coupon", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred during deletion", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStats = () => {
    return [
      {
        label: "Estimated Revenue",
        value: adminStats ? `${adminStats.monthlyRevenue.toLocaleString()} EGP` : "N/A",
        change: "Active membership billing",
      },
      {
        label: "Subscription Plans",
        value: plans.length.toString(),
        change: `${plans.filter(p => p.isActive).length} active tiers`,
      },
      {
        label: "Active Coupons",
        value: coupons.filter(c => c.isActive && new Date(c.expiryDate) > new Date()).length.toString(),
        change: `${coupons.length} total codes`,
      },
      {
        label: "System Members",
        value: adminStats ? adminStats.totalMembers.toString() : "N/A",
        change: "Total registered in database",
      },
    ];
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-2 text-lg font-medium mt-4">Loading Packages and Coupons...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border border-red-200 bg-red-50 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Hub</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PackagePlus className="h-8 w-8 text-indigo-500" />
            Packages &amp; Plans Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your gym's financial ecosystem, subscription tiers, and promotional discount codes
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" onClick={() => openPlanModal("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 border border-border bg-card/60 backdrop-blur-sm">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                {stat.label}
              </p>
              <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Subscription Plans */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Active Subscription Plans
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((pkg) => (
            <div
              key={pkg.planId}
              className={`border rounded-lg p-6 space-y-4 relative transition-all hover:border-indigo-300 bg-card/40 flex flex-col justify-between ${
                pkg.isPopular ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/20" : "border-border"
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute top-4 right-4">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider font-bold text-indigo-600">
                  {pkg.planName}
                </p>
                <div className="text-4xl font-bold text-foreground">
                  {pkg.price} EGP
                  <span className="text-base font-normal text-muted-foreground">
                    /{pkg.durationDays} days
                  </span>
                </div>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground italic">{pkg.description}</p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-border/80">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Included Tokens:</span>
                  <span className="text-indigo-600 font-bold">{pkg.tokensIncluded}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Guest Invites:</span>
                  <span className="text-indigo-600 font-bold">{pkg.invitationsAllowed}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Max Daily Bookings:</span>
                  <span className="text-indigo-600 font-bold">{pkg.maxBookingsPerDay || "Unlimited"}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Max Freeze Days:</span>
                  <span className="text-indigo-600 font-bold">{pkg.maxFreezeDays}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {pkg.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>

              {pkg.features && (
                <div className="space-y-1.5 pt-3 border-t border-border/60 text-xs">
                  <span className="font-semibold text-muted-foreground block">Included Features:</span>
                  {pkg.features.split(",").map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span>{feat.trim()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Plan Quotas */}
              <div className="space-y-1.5 pt-3 border-t border-border/60 text-xs">
                <span className="font-semibold text-muted-foreground block">AI Plan Quotas:</span>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3 text-indigo-400" /> Free Workout Plans:</span>
                  <span className="font-bold text-indigo-600">{pkg.freeWorkoutPlans ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Utensils className="h-3 w-3 text-orange-400" /> Free Nutrition Plans:</span>
                  <span className="font-bold text-indigo-600">{pkg.freeNutritionPlans ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Extra Workout Cost:</span>
                  <span className="font-bold text-indigo-600">{pkg.extraWorkoutPlanTokenCost ?? 10} tokens</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Extra Nutrition Cost:</span>
                  <span className="font-bold text-indigo-600">{pkg.extraNutritionPlanTokenCost ?? 10} tokens</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Bot className="h-3 w-3 text-emerald-400" /> AI Coach Free Messages/Day:</span>
                  <span className="font-bold text-indigo-600">{pkg.freeAiCoachMessagesPerDay ?? 10}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border mt-auto">
                <Button variant="outline" className="flex-1" onClick={() => openPlanModal("edit", pkg)}>
                  <Edit className="h-4 w-4 mr-2" /> Modify Plan
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => openPlanModal("delete", pkg)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Coupons Hub */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-indigo-500" />
              Promotional Coupons & Incentives
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Manage marketing coupons valid for member registrations</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => openCouponModal("create")}>
            <Plus className="h-4 w-4 mr-1" /> Add Coupon
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const isExpired = new Date(coupon.expiryDate) < new Date();
            const isActive = coupon.isActive && !isExpired;
            return (
              <Card
                key={coupon.couponId}
                className={`p-5 border transition-all hover:border-indigo-400 ${
                  isActive ? "bg-gradient-to-br from-indigo-50/40 to-indigo-100/10 border-indigo-200" : "bg-gray-50 border-gray-200 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded tracking-wider ${
                      isActive ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-700"
                    }`}>
                      {coupon.code}
                    </span>
                    <div className="text-lg font-bold pt-2 text-foreground">
                      {coupon.discountType === DiscountType.Percentage
                        ? `${coupon.discountValue}% Off`
                        : `${coupon.discountValue} EGP Off`}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openCouponModal("edit", coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => openCouponModal("delete", coupon)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-indigo-100/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage:</span>
                    <span className="font-semibold">
                      {coupon.currentUsage} / {coupon.maxUsage || "Unlimited"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className={`font-semibold ${isExpired ? "text-red-600" : ""}`}>
                      {new Date(coupon.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-bold ${isActive ? "text-green-600" : "text-red-500"}`}>
                      {isExpired ? "EXPIRED" : coupon.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Plan MODAL */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-xl">
          {planModalType === "delete" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Subscription Plan
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete plan <strong>{selectedPlan?.planName}</strong>? Active subscriptions won't be disrupted, but new members cannot purchase this plan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handlePlanDelete} disabled={isSubmitting}>
                  {isSubmitting ? "Deleting..." : "Delete Plan"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handlePlanSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {planModalType === "create" ? "Create Subscription Plan" : "Edit Subscription Plan"}
                </DialogTitle>
                <DialogDescription>
                  Configure core metadata, pricing, and token grants for the subscription tier.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-1">
                  <Label htmlFor="planName">Plan Name</Label>
                  <Input
                    id="planName"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. VIP Enterprise Plan"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="price">Price (EGP)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="durationDays">Duration (Days)</Label>
                    <Input
                      id="durationDays"
                      type="number"
                      min={1}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desc">Description</Label>
                  <Input
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief outline of target members"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="tokens">Tokens Included</Label>
                    <Input
                      id="tokens"
                      type="number"
                      min={0}
                      value={tokensIncluded}
                      onChange={(e) => setTokensIncluded(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="invites">Guest Invites</Label>
                    <Input
                      id="invites"
                      type="number"
                      min={0}
                      value={invitationsAllowed}
                      onChange={(e) => setInvitationsAllowed(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="maxBookings">Max Daily Bookings</Label>
                    <Input
                      id="maxBookings"
                      type="number"
                      min={1}
                      value={maxBookingsPerDay}
                      onChange={(e) => setMaxBookingsPerDay(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxFreeze">Max Freeze Days</Label>
                    <Input
                      id="maxFreeze"
                      type="number"
                      min={0}
                      value={maxFreezeDays}
                      onChange={(e) => setMaxFreezeDays(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Included Features</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg bg-muted/30">
                    {PREDEFINED_FEATURES.map(({ key, icon: Icon }) => (
                      <label
                        key={key}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedFeatures.includes(key)
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(key)}
                          onChange={() => toggleFeature(key)}
                          className="rounded border-border accent-indigo-600"
                        />
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs">{key}</span>
                      </label>
                    ))}
                  </div>
                  {selectedFeatures.length > 0 && (
                    <p className="text-xs text-muted-foreground">{selectedFeatures.length} feature(s) selected</p>
                  )}
                </div>

                {/* AI Plan Quota Section */}
                <div className="space-y-3 p-3 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Zap className="h-4 w-4" /> AI Plan Generation Quotas
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="freeWorkout" className="text-xs flex items-center gap-1">
                        <Dumbbell className="h-3.5 w-3.5 text-indigo-500" /> Free Workout Plans
                      </Label>
                      <Input
                        id="freeWorkout"
                        type="number"
                        min={0}
                        value={freeWorkoutPlans}
                        onChange={(e) => setFreeWorkoutPlans(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="freeNutrition" className="text-xs flex items-center gap-1">
                        <Utensils className="h-3.5 w-3.5 text-orange-500" /> Free Nutrition Plans
                      </Label>
                      <Input
                        id="freeNutrition"
                        type="number"
                        min={0}
                        value={freeNutritionPlans}
                        onChange={(e) => setFreeNutritionPlans(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="extraWorkoutCost" className="text-xs">Extra Workout Cost (tokens)</Label>
                      <Input
                        id="extraWorkoutCost"
                        type="number"
                        min={0}
                        value={extraWorkoutPlanTokenCost}
                        onChange={(e) => setExtraWorkoutPlanTokenCost(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="extraNutritionCost" className="text-xs">Extra Nutrition Cost (tokens)</Label>
                      <Input
                        id="extraNutritionCost"
                        type="number"
                        min={0}
                        value={extraNutritionPlanTokenCost}
                        onChange={(e) => setExtraNutritionPlanTokenCost(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Members get the free quota first; extra generations deduct the token cost above.</p>
                </div>

                {/* AI Coach Quota Section */}
                <div className="space-y-3 p-3 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Bot className="h-4 w-4" /> AI Coach Quotas
                  </p>
                  <div className="space-y-1">
                    <Label htmlFor="freeAiMessages" className="text-xs flex items-center gap-1">
                      <Bot className="h-3.5 w-3.5 text-emerald-500" /> Free Messages Per Day
                    </Label>
                    <Input
                      id="freeAiMessages"
                      type="number"
                      min={0}
                      value={freeAiCoachMessagesPerDay}
                      onChange={(e) => setFreeAiCoachMessagesPerDay(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="rounded border-border"
                    />
                    Mark as Popular Plan
                  </label>

                  {planModalType === "edit" && (
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActivePlan}
                        onChange={(e) => setIsActivePlan(e.target.checked)}
                        className="rounded border-border"
                      />
                      Is Active
                    </label>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsPlanModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  {isSubmitting ? "Saving..." : "Save Plan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Coupon MODAL */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-xl">
          {couponModalType === "delete" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Coupon
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete coupon <strong>{selectedCoupon?.code}</strong>? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsCouponModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleCouponDelete} disabled={isSubmitting}>
                  {isSubmitting ? "Deleting..." : "Delete Coupon"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleCouponSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {couponModalType === "create" ? "Create Promotional Coupon" : "Edit Coupon Details"}
                </DialogTitle>
                <DialogDescription>
                  Define discount codes with expiration dates and usage rules.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-4">
                <div className="space-y-1">
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. FITSUMMER50"
                    className="uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="discountType">Discount Type</Label>
                    <select
                      id="discountType"
                      value={discountType}
                      onChange={(e) => setDiscountType(Number(e.target.value) as DiscountType)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value={DiscountType.Percentage}>Percentage (%)</option>
                      <option value={DiscountType.FixedAmount}>Fixed Amount (EGP)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="discountVal">Discount Value</Label>
                    <Input
                      id="discountVal"
                      type="number"
                      min={0}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="expiry">Expiration Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxUsage">Max Global Usage</Label>
                    <Input
                      id="maxUsage"
                      type="number"
                      min={1}
                      value={maxUsage}
                      onChange={(e) => setMaxUsage(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Leave blank for infinite"
                    />
                  </div>
                </div>

                {couponModalType === "edit" && (
                  <div className="flex items-center gap-2 py-2">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActiveCoupon}
                        onChange={(e) => setIsActiveCoupon(e.target.checked)}
                        className="rounded border-border"
                      />
                      Is Active
                    </label>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCouponModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  {isSubmitting ? "Saving..." : "Save Coupon"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPackagesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminPackagesContent />
    </ProtectedRoute>
  );
}
