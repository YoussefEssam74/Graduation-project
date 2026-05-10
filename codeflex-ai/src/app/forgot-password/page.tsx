"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";

type Step = "email" | "otp" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");

  // Step 1
  const [email, setEmail] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState("");

  // Step 2
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setSendError("");
    setSendLoading(true);
    try {
    const res = await authApi.sendForgotPasswordOtp(email.trim());
      if (res.success) {
        setStep("otp");
      } else {
        setSendError(res.errors?.[0] ?? "Failed to send OTP. Please try again.");
      }
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSendLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await authApi.confirmForgotPassword(
        email.trim(),
        otp.trim(),
        newPassword,
        confirmPassword
      );
      if (res.success) {
        setStep("done");
      } else {
        setResetError(res.errors?.[0] ?? "Invalid or expired OTP. Please try again.");
      }
    } catch {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  function handleBack() {
    setStep("email");
    setSendError("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">PulseGym</h1>
          <p className="text-gray-400 mt-2 text-sm">Reset your password</p>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 shadow-xl">

          {/* ── Step 1: Enter email ── */}
          {step === "email" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Forgot Password</h2>
              <p className="text-gray-400 text-sm mb-6">
                Enter the email address linked to your account. We&apos;ll send a one-time code to it.
              </p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                {sendError && (
                  <p className="text-red-400 text-sm">{sendError}</p>
                )}

                <button
                  type="submit"
                  disabled={sendLoading || !email.trim()}
                  className="w-full bg-[#ff6b35] hover:bg-[#e55a25] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  {sendLoading ? "Sending…" : "Send OTP"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Remember your password?{" "}
                <Link href="/login" className="text-[#ff6b35] hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP + new password ── */}
          {step === "otp" && (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Enter Code &amp; New Password</h2>
              <p className="text-gray-400 text-sm mb-6">
                A 6-digit code was sent to{" "}
                <span className="text-white font-medium">{email}</span>.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit code"
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors tracking-widest text-center text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>

                {resetError && (
                  <p className="text-red-400 text-sm">{resetError}</p>
                )}

                <button
                  type="submit"
                  disabled={resetLoading || otp.length < 6 || !newPassword || !confirmPassword}
                  className="w-full bg-[#ff6b35] hover:bg-[#e55a25] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  {resetLoading ? "Resetting…" : "Reset Password"}
                </button>
              </form>

              <button
                onClick={handleBack}
                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Change email / Resend OTP
              </button>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Password Reset!</h2>
              <p className="text-gray-400 text-sm mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block bg-[#ff6b35] hover:bg-[#e55a25] text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
              >
                Go to Login
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
