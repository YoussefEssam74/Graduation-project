"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Loader2,
  Zap,
  Star,
  Crown,
  HeartPulseIcon,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscriptionApi,
  SubscriptionPlanDto,
} from "@/lib/api/subscription";
import { paymentApi } from "@/lib/api/payment";
import { useToast } from "@/components/ui/toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import Link from "next/link";

function ChangePlanContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { subscription: currentSubscription, refreshSubscription } =
    useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [switching, setSwitching] = useState<number | null>(null);

  useEffect(() => {
    subscriptionApi.getActivePlans().then((res) => {
      if (res.success && res.data) {
        setPlans(res.data);
      }
      setIsLoading(false);
    });
  }, []);

  // Calculate when a new plan would start (after current plan expires, or immediately)
  const scheduledStartDate = currentSubscription?.status === "Active" && currentSubscription.endDate
    ? new Date(currentSubscription.endDate)
    : null;

  const handleSwitchPlan = async (plan: SubscriptionPlanDto) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSwitching(plan.planId);
    try {
      // Create a payment record for the new plan
      const paymentRes = await paymentApi.createPayment({
        userId: user.userId,
        amount: plan.price,
        paymentMethod: "Cash",
        paymentType: "Subscription",
        packageId: plan.planId,
      });

      if (!paymentRes.success || !paymentRes.data) {
        showToast("Failed to process payment. Please try again.", "error");
        return;
      }

      // Change the plan
      const changeRes = await subscriptionApi.changePlan({
        userId: user.userId,
        newPlanId: plan.planId,
        paymentId: paymentRes.data.paymentId,
      });

      if (changeRes.success) {
        const startMsg = scheduledStartDate
          ? ` starting ${scheduledStartDate.toLocaleDateString()}`
          : "";
        showToast(`${plan.planName} scheduled${startMsg}!`, "success");
        await refreshSubscription();
        router.push("/profile");
      } else {
        showToast(changeRes.message || "Failed to change plan", "error");
      }
    } catch {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setSwitching(null);
    }
  };

  const planIcons = [Zap, Star, Crown];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-9 rounded-xl bg-primary/15 text-primary">
            <HeartPulseIcon className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg">
            IntelliFit
          </span>
        </Link>
        <Button
          variant="ghost"
          className="text-slate-500 text-sm flex items-center gap-1"
          onClick={() => router.push("/profile")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>
      </div>

      {/* Hero */}
      <div className="text-center pt-10 pb-8 px-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
          Change Your Plan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-md mx-auto">
          Switch to a different membership plan. If you have an active plan, your
          new plan will start automatically when it expires.
        </p>
        {currentSubscription && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm">
              <span className="text-slate-400">Current plan:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {currentSubscription.planName}
              </span>
              <span className="text-slate-400">· expires</span>
              <span className="font-semibold text-primary">
                {new Date(currentSubscription.endDate).toLocaleDateString()}
              </span>
            </div>
            {scheduledStartDate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Your new plan will be charged now and activate on {scheduledStartDate.toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium">
              No plans available at the moment.
            </p>
            <p className="text-sm mt-1">
              Please contact the gym reception for assistance.
            </p>
            <Button
              className="mt-6 rounded-xl"
              onClick={() => router.push("/profile")}
            >
              Back to Profile
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => {
              const Icon = planIcons[idx % planIcons.length];
              const isCurrent =
                currentSubscription?.planId === plan.planId &&
                currentSubscription?.status === "Active";

              return (
                <Card
                  key={plan.planId}
                  className={`relative p-6 flex flex-col border-0 shadow-sm rounded-2xl overflow-hidden transition-opacity ${
                    isCurrent ? "opacity-60" : ""
                  } ${
                    plan.isPopular
                      ? "ring-2 ring-primary bg-white dark:bg-slate-800"
                      : "bg-white dark:bg-slate-800"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-0 left-0 right-0 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold text-center py-1">
                      CURRENT PLAN
                    </div>
                  )}
                  {plan.isPopular && !isCurrent && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                      MOST POPULAR
                    </div>
                  )}

                  <div className={`flex items-center gap-3 mb-4 ${isCurrent ? "mt-5" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {plan.planName}
                      </h3>
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
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {plan.price} EGP
                    </span>
                    <span className="text-slate-400 text-sm ml-1">
                      /{plan.durationDays}d
                    </span>
                  </div>

                  {/* Features */}
                  {plan.features && (
                    <ul className="space-y-2 mb-6 flex-1">
                      {(() => {
                        let featList: string[] = [];
                        try {
                          featList = JSON.parse(plan.features!);
                        } catch {
                          featList = plan.features!.split(",");
                        }
                        return featList.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                          >
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
                    onClick={() => !isCurrent && handleSwitchPlan(plan)}
                    disabled={isCurrent || switching === plan.planId}
                    className={`w-full rounded-xl font-bold h-11 ${
                      isCurrent
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        : plan.isPopular
                          ? "bg-primary hover:bg-primary/90 text-white"
                          : "bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white"
                    }`}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : switching === plan.planId ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                        Switching...
                      </>
                    ) : scheduledStartDate ? (
                      `Schedule for ${scheduledStartDate.toLocaleDateString()}`
                    ) : (
                      "Subscribe Now"
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

export default function ChangePlanPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ChangePlanContent />
    </ProtectedRoute>
  );
}
