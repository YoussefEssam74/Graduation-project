"use client";

import { useState, FormEvent, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  HeartPulseIcon,
  ZapIcon,
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  UserCircleIcon,
  PhoneIcon,
  TrophyIcon,
  ActivityIcon,
  EyeIcon,
  EyeOffIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function SignUpPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<number>(0); // 0 = Male, 1 = Female
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Strong", color: "bg-secondary" };
    return { score, label: "Very Strong", color: "bg-secondary" };
  }, [password]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return false;
    }
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Please enter a valid phone number");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!acceptTerms) {
      setError("You must accept the terms and conditions");
      return false;
    }
    return true;
  };

  const handleFeatureComingSoon = (feature: string) => {
    showToast(`${feature} is coming soon!`, "info");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Always register as Member - public registration is Members only
      await register(email, password, name, "Member", phone, gender);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 home-login-bg" />
        <div className="absolute inset-0 home-login-overlay"></div>
      </div>

      <div className="relative z-10 h-full w-full px-3 py-3 lg:px-6 lg:py-4">
        <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col">
          <div className="flex items-center justify-between px-2 pb-2">
            <Link
              href="/"
              className="flex items-center gap-3 transition-opacity hover:opacity-90"
              aria-label="Go to homepage"
            >
              <div className="flex items-center justify-center size-9 rounded-xl bg-primary/15 text-primary shadow-md shadow-blue-500/20">
                <HeartPulseIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[24px] leading-none font-black tracking-tight text-slate-900">
                  PulseGym
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  AI-Powered Fitness
                </p>
              </div>
            </Link>
            <p className="hidden sm:block text-xs font-semibold text-slate-500">
              Already a member?{" "}
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg bg-white/90 px-3 py-1.5 text-slate-900 shadow-sm hover:bg-white transition-colors"
              >
                Log in
              </Link>
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-[980px] flex-1 items-center justify-center">
            <div className="grid w-full max-w-[940px] grid-cols-1 overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_20px_48px_rgba(15,23,42,0.18)] backdrop-blur-md md:grid-cols-[0.9fr_1.1fr]">
              {/* Left Visual Card */}
              <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-5 text-white">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                  <ZapIcon className="w-3.5 h-3.5" />
                  AI-Driven Results
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="text-3xl leading-tight font-black tracking-tight">
                    Train smarter,
                    <span className="block text-slate-200">not harder.</span>
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    Join thousands of members using PulseGym AI to optimize
                    workouts, monitor progress, and stay consistent.
                  </p>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="rounded-lg bg-primary/20 p-2">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">AI Coaching</p>
                      <p className="text-xs text-slate-300">
                        Adaptive plans for your goals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="rounded-lg bg-amber-500/20 p-2">
                      <TrophyIcon className="h-4 w-4 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Milestones</p>
                      <p className="text-xs text-slate-300">
                        Track wins and progress easily
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Form Card */}
              <div className="bg-white/95 p-4 sm:p-5 lg:p-5">
                <div className="mb-2">
                  <h2 className="text-3xl leading-none font-black tracking-tight text-slate-900">
                    Create Account
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Join the revolution in personalized fitness.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleFeatureComingSoon("Google Signup")}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all h-8"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleFeatureComingSoon("Apple Signup")}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all h-8"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Apple
                  </Button>
                </div>

                <div className="relative flex items-center py-0.5 mb-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="mx-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Or register with email
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <Label
                        htmlFor="name"
                        className="text-[11px] font-semibold text-slate-700"
                      >
                        Full Name
                      </Label>
                      <div className="relative group">
                        <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                          required
                        />
                      </div>
                    </label>

                    <label className="flex flex-col gap-1">
                      <Label
                        htmlFor="phone"
                        className="text-[11px] font-semibold text-slate-700"
                      >
                        Phone
                      </Label>
                      <div className="relative group">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                          required
                        />
                      </div>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <Label
                      htmlFor="email"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Email Address
                    </Label>
                    <div className="relative group">
                      <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        required
                      />
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <Label
                        htmlFor="dob"
                        className="text-[11px] font-semibold text-slate-700"
                      >
                        Date of Birth
                      </Label>
                      <div className="relative group">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input
                          id="dob"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </label>

                    <label className="flex flex-col gap-1">
                      <Label
                        htmlFor="gender"
                        className="text-[11px] font-semibold text-slate-700"
                      >
                        Gender
                      </Label>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(Number(e.target.value))}
                        className="w-full px-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      >
                        <option value={0}>Male</option>
                        <option value={1}>Female</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-[11px] font-semibold text-slate-700"
                      >
                        Password
                      </Label>
                      {password && (
                        <span
                          className={`text-[10px] font-semibold ${passwordStrength.score <= 2 ? "text-red-500" : passwordStrength.score <= 3 ? "text-yellow-500" : "text-emerald-500"}`}
                        >
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative group">
                      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {password && (
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-0.5 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"}`}
                          />
                        ))}
                      </div>
                    )}
                  </label>

                  <label className="flex flex-col gap-1">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        required
                      />
                    </div>
                  </label>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 size-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label
                      htmlFor="terms"
                      className="text-[11px] text-slate-500 leading-snug"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-primary font-semibold hover:underline"
                        onClick={() =>
                          handleFeatureComingSoon("Terms of Service")
                        }
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        className="text-primary font-semibold hover:underline"
                        onClick={() =>
                          handleFeatureComingSoon("Privacy Policy")
                        }
                      >
                        Privacy Policy
                      </button>
                      . I consent to receive AI-generated fitness insights.
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 text-red-600">
                      <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-600 py-2 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] h-9"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Creating account...
                      </div>
                    ) : (
                      "Create Free Account"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
