"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  Zap,
  Star,
  Crown,
  Dumbbell,
  Tag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionApi, SubscriptionPlanDto } from "@/lib/api/subscription";
import { paymentApi } from "@/lib/api/payment";
import { useToast } from "@/components/ui/toast";
import { couponsApi, type CouponDto } from "@/lib/api/coupons";
import Link from "next/link";

export default function ChoosePlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDto | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    subscriptionApi.getActivePlans().then((res) => {
      if (res.success && res.data) {
        setPlans(res.data);
      }
      setIsLoading(false);
    });
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponMessage({ type: "error", text: "Please enter a coupon code." });
      return;
    }
    setIsValidatingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await couponsApi.validateCoupon(couponInput.trim());
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        setCouponMessage({
          type: "success",
          text: `Coupon "${res.data.code}" applied! (${res.data.discountType === 0 ? `${res.data.discountValue}%` : `${res.data.discountValue} EGP`} Off)`
        });
      } else {
        setCouponMessage({ type: "error", text: res.message || "Invalid or expired coupon code." });
        setAppliedCoupon(null);
      }
    } catch {
      setCouponMessage({ type: "error", text: "Failed to validate coupon." });
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
  };

  const handleSelectPlan = async (plan: SubscriptionPlanDto) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSubscribing(plan.planId);
    try {
      // Create Stripe Checkout Session
      const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const sessionRes = await paymentApi.createStripeCheckoutSession({
        planId: plan.planId,
        flowType: "subscribe",
        originUrl,
        couponCode: appliedCoupon?.code || undefined,
      });

      if (sessionRes.success && sessionRes.data?.url) {
        // Redirect the user to Stripe Checkout
        window.location.href = sessionRes.data.url;
      } else {
        showToast(sessionRes.message || "Failed to initiate Stripe payment. Please try again.", "error");
      }
    } catch {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setSubscribing(null);
    }
  };

  const planIcons = [Zap, Star, Crown];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-9 rounded-xl bg-primary/15 text-primary">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg">PulseGym</span>
        </Link>
        <Button
          variant="ghost"
          className="text-slate-500 text-sm"
          onClick={() => router.push("/dashboard")}
        >
          Skip for now
        </Button>
      </div>

      {/* Hero */}
      <div className="text-center pt-10 pb-8 px-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
          Choose Your Plan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto">
          Welcome! Select a membership plan to unlock full access to the gym and AI-powered features.
        </p>
      </div>

      {/* Coupon Application */}
      {!isLoading && plans.length > 0 && (
        <div className="max-w-md mx-auto px-4 mb-8">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Have a coupon code?</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SUMMER50"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon || isValidatingCoupon}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase placeholder:normal-case disabled:opacity-60 text-slate-900 dark:text-slate-100"
              />
              {appliedCoupon ? (
                <Button
                  variant="outline"
                  onClick={handleRemoveCoupon}
                  className="rounded-xl border-red-200 hover:bg-red-50 hover:text-red-600 text-red-500 text-xs h-9 px-4 dark:border-red-950 dark:hover:bg-red-950/20"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className="rounded-xl text-xs h-9 px-5 bg-primary hover:bg-primary/90 text-white font-medium"
                >
                  {isValidatingCoupon ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              )}
            </div>
            {couponMessage && (
              <p className={`text-xs mt-2 font-medium ${couponMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {couponMessage.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium">No plans available at the moment.</p>
            <p className="text-sm mt-1">Please contact the gym reception to subscribe.</p>
            <Button
              className="mt-6 rounded-xl"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => {
              const Icon = planIcons[idx % planIcons.length];
              
              // Calculate discounted price
              let discountedPrice = plan.price;
              if (appliedCoupon) {
                if (appliedCoupon.discountType === 0) { // Percentage
                  discountedPrice = Math.max(0, plan.price * (1 - appliedCoupon.discountValue / 100));
                } else { // FixedAmount
                  discountedPrice = Math.max(0, plan.price - appliedCoupon.discountValue);
                }
              }

              return (
                <Card
                  key={plan.planId}
                  className={`relative p-6 flex flex-col border-0 shadow-sm rounded-2xl overflow-hidden ${
                    plan.isPopular
                      ? "ring-2 ring-primary bg-white dark:bg-slate-800"
                      : "bg-white dark:bg-slate-800"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{plan.planName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {plan.durationDays} days
                      </p>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      {plan.description}
                    </p>
                  )}

                  <div className="mb-5">
                    {appliedCoupon ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-extrabold text-primary dark:text-blue-400">
                          {discountedPrice.toFixed(0)} EGP
                        </span>
                        <span className="text-slate-400 line-through text-sm">
                          {plan.price} EGP
                        </span>
                        <span className="text-slate-400 text-xs ml-1">/{plan.durationDays}d</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                          {plan.price} EGP
                        </span>
                        <span className="text-slate-400 text-sm ml-1">/{plan.durationDays}d</span>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  {plan.features && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {(() => {
                        let featList: string[] = [];
                        try { featList = JSON.parse(plan.features!); }
                        catch { featList = plan.features!.split(","); }
                        return featList.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {feature.trim()}
                          </li>
                        ));
                      })()}
                    </ul>
                  )}

                  {plan.tokensIncluded > 0 && (
                    <div className="flex items-center gap-2 mb-5 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Includes {plan.tokensIncluded} AI tokens
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={subscribing === plan.planId}
                    className={`w-full rounded-xl font-bold h-11 ${
                      plan.isPopular
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : "bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white"
                    }`}
                  >
                    {subscribing === plan.planId ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                    ) : (
                      "Select Plan"
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
