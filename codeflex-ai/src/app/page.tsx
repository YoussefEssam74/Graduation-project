"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
import {
  subscriptionApi,
  type SubscriptionPlanDto,
} from "@/lib/api/subscription";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  ChartColumn,
  Dumbbell,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

interface ExerciseDto {
  exerciseId: number;
  name: string;
  muscleGroup?: string;
  difficultyLevel?: number;
}

interface EquipmentDto {
  equipmentId: number;
  name: string;
  statusText?: string;
}

interface LandingData {
  plans: SubscriptionPlanDto[];
  availableEquipment: EquipmentDto[];
  allEquipment: EquipmentDto[];
  activeExercises: ExerciseDto[];
}

const FALLBACK_PLANS: SubscriptionPlanDto[] = [
  {
    planId: 1,
    planName: "Starter",
    durationDays: 30,
    price: 29,
    tokensIncluded: 120,
    isPopular: false,
    isActive: true,
    invitationsAllowed: 0,
    description: "Best for getting started with gym access and app tracking.",
  },
  {
    planId: 2,
    planName: "Pro Athlete",
    durationDays: 30,
    price: 59,
    tokensIncluded: 450,
    isPopular: true,
    isActive: true,
    invitationsAllowed: 2,
    description:
      "Most popular plan with AI coach features and priority booking.",
  },
  {
    planId: 3,
    planName: "Elite",
    durationDays: 30,
    price: 99,
    tokensIncluded: 900,
    isPopular: false,
    isActive: true,
    invitationsAllowed: 5,
    description:
      "Premium support, maximum tokens, and complete analytics access.",
  },
];

const FALLBACK_EXERCISE_COUNT = 1057;

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [isFetching, setIsFetching] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [data, setData] = useState<LandingData>({
    plans: [],
    availableEquipment: [],
    allEquipment: [],
    activeExercises: [],
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    switch (user.role) {
      case "Admin":
        router.replace("/admin-dashboard");
        return;
      case "Coach":
        router.replace("/coach-dashboard");
        return;
      case "Receptionist":
        router.replace("/reception-dashboard");
        return;
      default:
        router.replace("/dashboard");
        return;
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    let isMounted = true;

    const fetchLandingData = async () => {
      setIsFetching(true);
      setApiError(null);

      const [
        plansResult,
        availableEquipmentResult,
        allEquipmentResult,
        exercisesResult,
      ] = await Promise.all([
        subscriptionApi.getActivePlans(),
        apiFetch<EquipmentDto[]>("/equipment/available", { skipAuth: true }),
        apiFetch<EquipmentDto[]>("/equipment", { skipAuth: true }),
        apiFetch<ExerciseDto[]>("/exercise/active", { skipAuth: true }),
      ]);

      if (!isMounted) return;

      const plans =
        plansResult.success && plansResult.data?.length
          ? plansResult.data
          : FALLBACK_PLANS;

      const availableEquipment =
        availableEquipmentResult.success && availableEquipmentResult.data
          ? availableEquipmentResult.data
          : [];

      const allEquipment =
        allEquipmentResult.success && allEquipmentResult.data
          ? allEquipmentResult.data
          : [];

      const activeExercises =
        exercisesResult.success && exercisesResult.data
          ? exercisesResult.data
          : [];

      if (
        !plansResult.success ||
        !availableEquipmentResult.success ||
        !allEquipmentResult.success ||
        !exercisesResult.success
      ) {
        setApiError(
          "Some live stats are temporarily unavailable. Showing best available data.",
        );
      }

      setData({
        plans,
        availableEquipment,
        allEquipment,
        activeExercises,
      });
      setIsFetching(false);
    };

    fetchLandingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const topPlans = useMemo(() => {
    return [...data.plans]
      .sort(
        (a, b) =>
          Number(b.isPopular) - Number(a.isPopular) || a.price - b.price,
      )
      .slice(0, 3);
  }, [data.plans]);

  const showcaseExercises = useMemo(() => {
    return data.activeExercises.slice(0, 4);
  }, [data.activeExercises]);

  const showcaseEquipment = useMemo(() => {
    if (data.availableEquipment.length > 0)
      return data.availableEquipment.slice(0, 4);
    return data.allEquipment.slice(0, 4);
  }, [data.allEquipment, data.availableEquipment]);

  const exerciseCount = data.activeExercises.length || FALLBACK_EXERCISE_COUNT;
  const equipmentCount =
    data.availableEquipment.length > 0
      ? data.availableEquipment.length
      : data.allEquipment.length;
  const planCount = data.plans.length;

  if (isLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">
            Preparing your PulseGym experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none home-login-bg" />
      <div className="fixed inset-0 z-0 pointer-events-none home-login-overlay" />

      <div className="relative z-10 w-full pb-16">
        <section className="relative overflow-hidden px-4 md:px-8 pb-8">
          <div className="absolute inset-0 -z-20 bg-gradient-to-b from-white/45 via-white/30 to-white/55" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-100/45 via-white/25 to-sky-100/30" />

          <div className="relative isolate max-w-6xl mx-auto mt-3 md:mt-6 overflow-hidden rounded-[1.6rem] border border-white/60 bg-gradient-to-br from-white/78 via-white/66 to-sky-50/58 backdrop-blur-xl shadow-[0_24px_60px_rgba(15,23,42,0.16)] px-5 md:px-8 py-6 md:py-8">
            <div className="pointer-events-none absolute -top-16 -left-14 h-44 w-44 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-8 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 md:gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-4">
                  <HeartPulse className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-700">
                    PulseGym Live Platform
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black leading-[1.12] tracking-tight text-slate-900 max-w-3xl">
                  AI-Powered Fitness Built For
                  <span className="block bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                    Real Gym Operations
                  </span>
                </h1>

                <p className="mt-4 text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
                  PulseGym connects member progress, coach workflows, bookings,
                  AI workout generation, and analytics in one unified fitness
                  platform.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
                  >
                    Join PulseGym <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Login
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <HeroTag
                    icon={<Brain className="h-3.5 w-3.5" />}
                    text="Adaptive AI Plans"
                  />
                  <HeroTag
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                    text="Smart Booking"
                  />
                  <HeroTag
                    icon={<ChartColumn className="h-3.5 w-3.5" />}
                    text="Progress Analytics"
                  />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white/82 to-slate-50/62 p-4 md:p-5 shadow-lg">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-blue-200/20 to-transparent" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Live Platform Snapshot
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                  <StatCard
                    value={exerciseCount.toLocaleString()}
                    label="Active Exercises"
                    tone="blue"
                  />
                  <StatCard
                    value={equipmentCount.toString()}
                    label="Equipment Inventory"
                    tone="green"
                  />
                  <StatCard
                    value={planCount.toString()}
                    label="Subscription Plans"
                    tone="orange"
                  />
                </div>

                {apiError && (
                  <p className="mt-3 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                    {apiError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="results" className="px-4 md:px-8 py-5 scroll-mt-28">
          <div className="max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <MiniKpi
                icon={<Users className="h-4 w-4 text-primary" />}
                label="Role-Based Experience"
                value="4 User Roles"
              />
              <MiniKpi
                icon={<Sparkles className="h-4 w-4 text-primary" />}
                label="AI Services"
                value="Workout + Chat"
              />
              <MiniKpi
                icon={<Dumbbell className="h-4 w-4 text-primary" />}
                label="Exercise Base"
                value={`${exerciseCount.toLocaleString()}+`}
              />
              <MiniKpi
                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                label="Architecture"
                value="Clean + Scalable"
              />
            </div>
          </div>
        </section>

        <section id="features" className="px-4 md:px-8 py-8 scroll-mt-28">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <ImageFeatureCard
              title="AI Personal Coaching"
              description="Generate personalized workout plans based on profile, goals, and progress feedback loops."
              badge="Real API-Driven"
              bgClass="home-feature-bg-1"
            />
            <ImageFeatureCard
              title="Smart Gym Operations"
              description="Manage equipment booking, schedules, and role-specific dashboards for members and staff."
              badge="Operational Ready"
              bgClass="home-feature-bg-2"
            />
          </div>
        </section>

        <section className="px-4 md:px-8 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Exercise Snapshot
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Live from your Exercise API
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {showcaseExercises.length > 0 ? (
                  showcaseExercises.map((exercise) => (
                    <div
                      key={exercise.exerciseId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="font-semibold text-slate-800 leading-tight">
                        {exercise.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {exercise.muscleGroup || "General"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 sm:col-span-2">
                    {isFetching
                      ? "Loading exercise library..."
                      : "Unable to load sample exercises right now."}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Equipment Snapshot
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Live from your Equipment API
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {showcaseEquipment.length > 0 ? (
                  showcaseEquipment.map((equipment) => (
                    <div
                      key={equipment.equipmentId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="font-semibold text-slate-800 leading-tight">
                        {equipment.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {equipment.statusText || "Ready"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 sm:col-span-2">
                    {isFetching
                      ? "Loading equipment data..."
                      : "Equipment data unavailable right now."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 md:px-8 py-10 scroll-mt-28">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Subscription Plans
              </h2>
              <p className="mt-2 text-slate-600">
                Live plans from your Subscription API
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPlans.map((plan) => (
                <article
                  key={plan.planId}
                  className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                    plan.isPopular
                      ? "bg-slate-900 text-white border-slate-800"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{plan.planName}</h3>
                    {plan.isPopular && (
                      <span className="rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                        Popular
                      </span>
                    )}
                  </div>

                  <p
                    className={`mt-3 text-sm ${plan.isPopular ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {plan.description ||
                      "AI-powered training and gym services for your performance goals."}
                  </p>

                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-bold">{plan.price} EGP</span>
                    <span
                      className={`text-sm pb-1 ${plan.isPopular ? "text-slate-400" : "text-slate-500"}`}
                    >
                      / {Math.max(1, Math.round(plan.durationDays / 30))} month
                    </span>
                  </div>

                  <ul
                    className={`mt-5 space-y-1.5 text-sm ${plan.isPopular ? "text-slate-200" : "text-slate-700"}`}
                  >
                    <li>{plan.tokensIncluded} tokens included</li>
                    <li>{plan.durationDays} days access</li>
                    <li>AI workout support included</li>
                  </ul>

                  <Link
                    href="/signup"
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      plan.isPopular
                        ? "bg-primary text-white hover:bg-blue-500"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    Choose {plan.planName}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="stories" className="px-4 md:px-8 py-8 scroll-mt-28">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Success Stories
              </h2>
              <p className="mt-2 text-slate-600">
                How PulseGym supports members, coaches, and operations teams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600 leading-relaxed">
                  "AI workouts helped me stay consistent and finally track
                  measurable progress week by week."
                </p>
                <p className="mt-4 font-semibold text-slate-900">
                  Member Experience
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600 leading-relaxed">
                  "Coach dashboard and program tools made client follow-up much
                  faster and more organized."
                </p>
                <p className="mt-4 font-semibold text-slate-900">
                  Coach Experience
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-600 leading-relaxed">
                  "Reception operations are clearer now with live bookings,
                  check-ins, and equipment visibility."
                </p>
                <p className="mt-4 font-semibold text-slate-900">
                  Reception Experience
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-8 pt-2 pb-8">
          <div className="max-w-6xl mx-auto rounded-[1.25rem] overflow-hidden border border-slate-200 shadow-lg relative">
            <div className="home-cta-bg absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-blue-900/60" />
            <div className="relative z-10 px-6 md:px-10 py-10 md:py-12 text-white">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Train Smarter With PulseGym
              </h2>
              <p className="mt-3 text-slate-200 max-w-2xl">
                Launch your fitness journey with AI coaching, smart booking, and
                real gym management in one platform.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/40 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "blue" | "green" | "orange";
}) {
  const toneClasses: Record<typeof tone, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-emerald-200 bg-emerald-50",
    orange: "border-orange-200 bg-orange-50",
  };

  return (
    <div className={`rounded-xl border p-3.5 ${toneClasses[tone]}`}>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs md:text-sm mt-1 text-slate-500">{label}</p>
    </div>
  );
}

function HeroTag({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700">
      <span className="text-primary">{icon}</span>
      {text}
    </span>
  );
}

function MiniKpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function ImageFeatureCard({
  title,
  description,
  badge,
  bgClass,
}: {
  title: string;
  description: string;
  badge: string;
  bgClass: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className={`absolute inset-0 ${bgClass}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/35 to-slate-800/15" />
      <div className="relative z-10 p-6 min-h-[220px] flex flex-col justify-end text-white">
        <span className="mb-3 inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
          {badge}
        </span>
        <h3 className="text-2xl font-bold leading-tight">{title}</h3>
        <p className="mt-2 text-sm text-slate-200 leading-relaxed max-w-md">
          {description}
        </p>
      </div>
    </article>
  );
}
