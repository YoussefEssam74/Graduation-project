"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/client";
import { UserDto } from "@/lib/api/auth";

// ─── Inner component (uses useSearchParams — must be inside <Suspense>) ───────

function GoogleSuccessInner() {
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      return;
    }

    if (!token) {
      setErrorMsg("No authentication token received from Google.");
      return;
    }

    // Store JWT
    setAuthToken(token);

    // Decode JWT payload to extract userId
    let userId: number | null = null;
    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      userId = parseInt(
        payload["sub"] ||
          payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ] ||
          payload["nameid"] ||
          "0",
        10
      );
    } catch {
      // Decode failed — proceed without profile; AuthContext will handle it
    }

    const continueToApp = (user?: UserDto) => {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      window.location.href = "/dashboard";
    };

    if (userId) {
      apiFetch<UserDto>(`/users/${userId}`)
        .then((res) => continueToApp(res.data))
        .catch(() => continueToApp());
    } else {
      continueToApp();
    }
  }, [searchParams]);

  if (errorMsg) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4 p-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
          <span className="text-2xl">❌</span>
        </div>
        <p className="text-red-600 font-semibold text-sm text-center max-w-xs">
          {errorMsg}
        </p>
        <a
          href="/login"
          className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-bold hover:bg-blue-600 transition-colors"
        >
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      <p className="text-slate-500 text-sm font-medium">
        Signing you in with Google…
      </p>
    </div>
  );
}

// ─── Loading fallback (shown during Suspense) ─────────────────────────────────

function LoadingFallback() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      <p className="text-slate-500 text-sm font-medium">
        Signing you in with Google…
      </p>
    </div>
  );
}

// ─── Page export (wraps inner component in Suspense) ─────────────────────────

/**
 * Landing page after server-side Google OAuth redirect.
 *
 * Flow:
 *   Google → Backend /api/auth/google/callback
 *           → Redirects here: /auth/google/success?token=JWT
 *           → Stores token, fetches user profile, redirects to /dashboard
 *
 * The Suspense wrapper is required by Next.js App Router whenever
 * useSearchParams() is used in a statically-generated page.
 */
export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GoogleSuccessInner />
    </Suspense>
  );
}

