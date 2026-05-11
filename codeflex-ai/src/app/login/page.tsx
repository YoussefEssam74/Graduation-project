"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  HeartPulseIcon,
  ZapIcon,
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  ActivityIcon,
  TrophyIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
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
              New here?{" "}
              <Link
                href="/signup"
                className="inline-flex items-center rounded-lg bg-white/90 px-3 py-1.5 text-slate-900 shadow-sm hover:bg-white transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-[820px] flex-1 items-center justify-center">
            <div className="grid w-full max-w-[760px] grid-cols-1 overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_20px_48px_rgba(15,23,42,0.18)] backdrop-blur-md md:min-h-[560px] md:grid-cols-[0.9fr_1.1fr]">
              {/* Left Visual Card */}
              <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-6 text-white">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200">
                  <ZapIcon className="w-3.5 h-3.5" />
                  Member Access
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-3xl leading-tight font-black tracking-tight">
                    Your progress,
                    <span className="block text-slate-200">
                      waiting for you.
                    </span>
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Log in to continue your plan, track your sessions, and let
                    PulseGym AI guide your next best workout.
                  </p>
                </div>

                <div className="space-y-3 pt-5">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <div className="rounded-lg bg-primary/20 p-2">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Workout Continuity
                      </p>
                      <p className="text-xs text-slate-300">
                        Resume your latest training plan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                    <div className="rounded-lg bg-amber-500/20 p-2">
                      <TrophyIcon className="h-4 w-4 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Performance Insights
                      </p>
                      <p className="text-xs text-slate-300">
                        See what changed since your last login
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Form Card */}
              <div className="bg-white/95 p-5 sm:p-6 lg:p-7">
                <div className="mb-4">
                  <h2 className="text-3xl leading-none font-black tracking-tight text-slate-900">
                    Welcome Back
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Sign in to continue your fitness journey.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Email Input */}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-700">
                      Email Address
                    </span>
                    <div className="relative group">
                      <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="coach@pulsegym.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 h-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        required
                      />
                    </div>
                  </label>

                  {/* Password Input */}
                  <label className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700">
                        Password
                      </span>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-primary hover:text-blue-600 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative group">
                      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 h-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  {/* Remember Me */}
                  <div className="flex items-center gap-2">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                    >
                      Remember for 30 days
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600">
                      <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-600 py-2.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] h-11"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Signing in...
                      </div>
                    ) : (
                      "Log In"
                    )}
                  </Button>

                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
                    <span className="text-xs text-slate-500">or</span>
                    <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600" />
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={async ({ credential }) => {
                        if (!credential) return;
                        setError("");
                        setIsLoading(true);
                        try {
                          await googleLogin(credential);
                        } catch (err) {
                          setError(
                            err instanceof Error ? err.message : "Google sign-in failed."
                          );
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      onError={() => setError("Google sign-in failed.")}
                      useOneTap={false}
                    />
                  </div>

                  <div className="pt-1 text-center">
                    <p className="text-sm text-slate-600">
                      New to PulseGym?{" "}
                      <Link
                        href="/signup"
                        className="font-bold text-primary hover:text-blue-600 transition-colors"
                      >
                        Create an account
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
