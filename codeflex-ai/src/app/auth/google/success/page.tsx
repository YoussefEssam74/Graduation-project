"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setAuthToken, apiFetch } from "@/lib/api/client";
import { UserDto } from "@/lib/api/auth";
import { AuthResponse } from "@/lib/api/auth";

// ─── Inner component (uses useSearchParams — must be inside <Suspense>) ───────

function GoogleSuccessInner() {
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Google sends ?code=... or ?error=...
    const code  = searchParams.get("code");
    const error = searchParams.get("error");

    // Also handle our own legacy ?token=JWT flow (if somehow reached)
    const token = searchParams.get("token");

    if (error) {
      setErrorMsg(
        error === "access_denied"
          ? "Google sign-in was cancelled."
          : decodeURIComponent(error)
      );
      return;
    }

    // ── Legacy flow: backend already gave us a JWT ──────────────────────────
    if (token) {
      handleToken(token);
      return;
    }

    // ── Primary flow: exchange code with our backend ────────────────────────
    if (!code) {
      setErrorMsg("No authorization code received from Google.");
      return;
    }

    // The redirect_uri used in the original auth request must match exactly
    const redirectUri = `${window.location.origin}/auth/google/success`;

    // Retrieve PKCE code_verifier that was stored before the redirect
    const codeVerifier = sessionStorage.getItem("google_pkce_verifier") ?? undefined;
    sessionStorage.removeItem("google_pkce_verifier"); // clean up immediately

    apiFetch<AuthResponse>("/auth/google/callback", {
      method: "POST",
      body: JSON.stringify({ code, redirectUri, codeVerifier }),
      skipAuth: true,
    })
      .then((res) => {
        if (!res.success || !res.data) {
          setErrorMsg(res.message || "Google sign-in failed. Please try again.");
          return;
        }
        handleToken(res.data.token, res.data.user);
      })
      .catch((err) => {
        setErrorMsg(
          err instanceof Error ? err.message : "Google sign-in failed."
        );
      });
  }, [searchParams]);

  function redirectToDestination(user: UserDto) {
    const roleRoutes: Record<string, string> = {
      'Member': "/dashboard",
      'Coach': "/coach-dashboard",
      'Receptionist': "/reception-dashboard",
      'Admin': "/admin-dashboard",
    };

    const role = user.role || 'Member';
    const destination = (role === 'Member' && !user.hasActiveSubscription)
      ? "/choose-plan"
      : (roleRoutes[role] || "/dashboard");

    window.location.href = destination;
  }

  function handleToken(token: string, user?: UserDto) {
    setAuthToken(token);

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      redirectToDestination(user);
      return;
    }

    // Decode JWT to get userId so we can fetch the full user object
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
      // Ignore — just redirect without profile
    }

    if (userId) {
      apiFetch<UserDto>(`/users/${userId}`)
        .then((res) => {
          if (res.data) {
            localStorage.setItem("user", JSON.stringify(res.data));
            redirectToDestination(res.data);
          } else {
            window.location.href = "/dashboard";
          }
        })
        .catch(() => {
          window.location.href = "/dashboard";
        });
    } else {
      window.location.href = "/dashboard";
    }
  }

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

// ─── Loading fallback ─────────────────────────────────────────────────────────

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

// ─── Page export ──────────────────────────────────────────────────────────────

/**
 * Landing page after Google OAuth redirect.
 *
 * New flow (frontend redirect_uri):
 *   User clicks "Sign in with Google"
 *   → Browser goes to accounts.google.com with redirect_uri = /auth/google/success
 *   → User approves
 *   → Google redirects here: /auth/google/success?code=AUTH_CODE
 *   → This page POSTs { code, redirectUri } to POST /api/auth/google/callback
 *   → Backend exchanges code for ID token, validates, returns JWT
 *   → We store JWT + user, redirect to /dashboard
 *
 * The <Suspense> wrapper is required by Next.js when useSearchParams() is used
 * in a statically-generated page.
 */
export default function GoogleSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GoogleSuccessInner />
    </Suspense>
  );
}
