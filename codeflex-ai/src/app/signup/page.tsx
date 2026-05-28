"use client";

import { useState, FormEvent, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";
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
  TicketIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  MapPinIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

/** PKCE helpers — no client secret needed on the backend */
async function generateCodeVerifier(): Promise<string> {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Redirect to Google OAuth with PKCE (stores code_verifier in sessionStorage). */
async function initGoogleSignIn() {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "1083535101116-p4iirka9e60m4nklv8rbr2r0s2ji2ape.apps.googleusercontent.com";

  // Always the frontend success page — add this URL in Google Console → Authorized Redirect URIs
  const redirectUri = `${window.location.origin}/auth/google/success`;

  const codeVerifier  = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  sessionStorage.setItem("google_pkce_verifier", codeVerifier);

  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256`;

  window.location.href = url;
}

// ─────────────────────────────────────────────────────────────
// OTP Verification Modal
// ─────────────────────────────────────────────────────────────
interface OtpModalProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onCancel: () => void;
}

function OtpModal({ email, onVerify, onResend, onCancel }: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = digits.join("");

  const handleDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      setError("");
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setIsVerifying(true);
    setError("");
    try {
      await onVerify(otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      await onResend();
      setDigits(["", "", "", "", "", ""]);
      setError("");
      // 60-second cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/70 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)] p-7 flex flex-col items-center gap-5">
        {/* Icon */}
        <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10">
          <ShieldCheckIcon className="w-7 h-7 text-primary" />
        </div>

        <div className="text-center">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Verify your email</h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-slate-700">{email}</span>
            <br />
            Enter it below. Code expires in 10 minutes.
          </p>
        </div>

        {/* 6-box OTP input */}
        <div className="flex gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <div className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600">
            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <Button
          onClick={handleVerify}
          disabled={isVerifying || otp.length < 6}
          className="w-full h-10 rounded-xl bg-primary hover:bg-blue-600 font-bold text-sm text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Verifying...
            </span>
          ) : (
            "Verify & Create Account"
          )}
        </Button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline transition-opacity"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
          <span className="text-slate-300 text-xs">|</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Change email
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Signup Page
// ─────────────────────────────────────────────────────────────
export default function SignUpPage() {
  const { googleLogin } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<number>(0);
  const [address, setAddress] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP step
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score <= 3) return { score, label: "Strong", color: "bg-secondary" };
    return { score, label: "Very Strong", color: "bg-secondary" };
  }, [password]);

  const validateForm = (): boolean => {
    if (!name.trim()) { setError("Name is required"); return false; }
    if (!email.trim()) { setError("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Invalid email format"); return false; }
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone.trim())) { setError("Please enter a valid phone number"); return false; }
    if (!address.trim()) { setError("Address is required"); return false; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return false; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain at least one uppercase letter"); return false; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number"); return false; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError("Password must contain at least one special character"); return false; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return false; }
    if (!acceptTerms) { setError("You must accept the terms and conditions"); return false; }
    return true;
  };

  // Step 1: validate form → send OTP
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await authApi.sendRegistrationOtp(email);
      if (!res.success) {
        throw new Error(res.message || "Failed to send verification code.");
      }
      setShowOtpModal(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: OTP verified → create account
  const handleVerifyOtp = async (otp: string) => {
    const res = await authApi.verifyAndCompleteRegistration(
      {
        email,
        password,
        name,
        phone,
        dateOfBirth: dateOfBirth || undefined,
        gender,
        address: address || undefined,
        role: "Member",
        invitationCode: invitationCode || undefined,
      },
      otp
    );

    if (!res.success) {
      throw new Error(res.message || "Verification failed.");
    }

    // Auth token stored inside verifyAndCompleteRegistration; redirect handled by AuthContext
    showToast("Account created! Welcome to PulseGym 🎉", "success");
    setShowOtpModal(false);
    // Give the toast a moment then go to dashboard
    window.location.href = "/dashboard";
  };

  const handleResendOtp = async () => {
    const res = await authApi.sendRegistrationOtp(email);
    if (!res.success) {
      throw new Error(res.message || "Failed to resend code.");
    }
    showToast("New verification code sent!", "success");
  };

  const handleFeatureComingSoon = (feature: string) => {
    showToast(`${feature} is coming soon!`, "info");
  };

  return (
    <>
      {showOtpModal && (
        <OtpModal
          email={email}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onCancel={() => setShowOtpModal(false)}
        />
      )}

      <div className="relative min-h-screen w-full overflow-y-auto flex flex-col">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 home-login-bg" />
          <div className="absolute inset-0 home-login-overlay" />
        </div>

        <div className="relative z-10 flex-1 w-full px-3 py-4 lg:px-6 lg:py-6 flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col flex-1 justify-center">
            {/* Header */}
            <div className="flex items-center justify-between px-2 pb-2">
              <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90" aria-label="Go to homepage">
                <div className="flex items-center justify-center size-9 rounded-xl bg-primary/15 text-primary shadow-md shadow-blue-500/20">
                  <HeartPulseIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-[24px] leading-none font-black tracking-tight text-slate-900">PulseGym</h1>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI-Powered Fitness</p>
                </div>
              </Link>
              <p className="hidden sm:block text-xs font-semibold text-slate-500">
                Already a member?{" "}
                <Link href="/login" className="inline-flex items-center rounded-lg bg-white/90 px-3 py-1.5 text-slate-900 shadow-sm hover:bg-white transition-colors">
                  Log in
                </Link>
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-[980px] py-4 items-center justify-center my-auto">
              <div className="grid w-full max-w-[940px] grid-cols-1 overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_20px_48px_rgba(15,23,42,0.18)] backdrop-blur-md md:grid-cols-[0.9fr_1.1fr]">
                {/* Left Visual */}
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
                      Join thousands of members using PulseGym AI to optimize workouts, monitor progress, and stay consistent.
                    </p>
                  </div>
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="rounded-lg bg-primary/20 p-2">
                        <ActivityIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">AI Coaching</p>
                        <p className="text-xs text-slate-300">Adaptive plans for your goals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="rounded-lg bg-amber-500/20 p-2">
                        <TrophyIcon className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Milestones</p>
                        <p className="text-xs text-slate-300">Track wins and progress easily</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Form */}
                <div className="bg-white/95 p-4 sm:p-5 lg:p-5">
                  <div className="mb-2">
                    <h2 className="text-3xl leading-none font-black tracking-tight text-slate-900">Create Account</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">Join the revolution in personalized fitness.</p>
                  </div>

                  <div className="flex justify-center mb-1">
                    <button
                      type="button"
                      onClick={() => initGoogleSignIn()}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
                    >
                      {/* Google logo SVG */}
                      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <g fill="none" fillRule="evenodd">
                          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                          <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                        </g>
                      </svg>
                      Sign up with Google
                    </button>
                  </div>

                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-slate-300" />
                    <span className="text-xs text-slate-500">or sign up with email</span>
                    <div className="flex-1 h-px bg-slate-300" />
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <Label htmlFor="name" className="text-[11px] font-semibold text-slate-700">Full Name</Label>
                        <div className="relative group">
                          <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                          <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)}
                            autoComplete="off"
                            className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                        </div>
                      </label>

                      <label className="flex flex-col gap-1">
                        <Label htmlFor="phone" className="text-[11px] font-semibold text-slate-700">Phone</Label>
                        <div className="relative group">
                          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                          <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)}
                            autoComplete="off"
                            className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                        </div>
                      </label>
                    </div>

                    <label className="flex flex-col gap-1">
                      <Label htmlFor="email" className="text-[11px] font-semibold text-slate-700">Email Address</Label>
                      <div className="relative group">
                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input id="email" type="email" placeholder="member@intellifit.com" value={email} onChange={(e) => setEmail(e.target.value)}
                          autoComplete="off"
                          className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                      </div>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <Label htmlFor="dob" className="text-[11px] font-semibold text-slate-700">Date of Birth</Label>
                        <div className="relative group">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                          <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" />
                        </div>
                      </label>

                      <label className="flex flex-col gap-1">
                        <Label htmlFor="gender" className="text-[11px] font-semibold text-slate-700">Gender</Label>
                        <select id="gender" value={gender} onChange={(e) => setGender(Number(e.target.value))}
                          className="w-full px-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all">
                          <option value={0}>Male</option>
                          <option value={1}>Female</option>
                        </select>
                      </label>
                    </div>

                    <label className="flex flex-col gap-1">
                      <Label htmlFor="address" className="text-[11px] font-semibold text-slate-700">Home Address</Label>
                      <div className="relative group">
                        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input id="address" type="text" placeholder="123 Main St, City, Country" value={address} onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                      </div>
                    </label>

                    <label className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[11px] font-semibold text-slate-700">Password</Label>
                        {password && (
                          <span className={`text-[10px] font-semibold ${passwordStrength.score <= 2 ? "text-red-500" : passwordStrength.score <= 3 ? "text-yellow-500" : "text-emerald-500"}`}>
                            {passwordStrength.label}
                          </span>
                        )}
                      </div>
                      <div className="relative group">
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full pl-9 pr-9 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"}`} />
                          ))}
                        </div>
                      )}
                    </label>

                    <label className="flex flex-col gap-1">
                      <Label htmlFor="confirmPassword" className="text-[11px] font-semibold text-slate-700">Confirm Password</Label>
                      <div className="relative group">
                        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                      </div>
                    </label>

                    <label className="flex flex-col gap-1">
                      <Label htmlFor="invitationCode" className="text-[11px] font-semibold text-slate-700">
                        Invitation Code <span className="font-normal text-slate-400">(optional)</span>
                      </Label>
                      <div className="relative group">
                        <TicketIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                        <Input id="invitationCode" type="text" placeholder="Enter your invitation code" value={invitationCode} onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                          className="w-full pl-9 pr-3 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all tracking-widest" />
                      </div>
                    </label>

                    <div className="flex items-start gap-2">
                      <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 size-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer" />
                      <label htmlFor="terms" className="text-[11px] text-slate-500 leading-snug">
                        I agree to the{" "}
                        <button type="button" className="text-primary font-semibold hover:underline" onClick={() => handleFeatureComingSoon("Terms of Service")}>
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button type="button" className="text-primary font-semibold hover:underline" onClick={() => handleFeatureComingSoon("Privacy Policy")}>
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

                    <Button type="submit" disabled={isLoading}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-600 py-2 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] h-9">
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Sending verification code...
                        </div>
                      ) : (
                        "Continue — Verify Email"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
