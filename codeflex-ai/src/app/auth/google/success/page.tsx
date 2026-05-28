"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/api/client";
import { apiFetch } from "@/lib/api/client";
import { UserDto } from "@/lib/api/auth";

/**
 * Landing page after server-side Google OAuth redirect.
 *
 * Flow:
 *   Google → Backend /api/auth/google/callback
 *           → Backend generates JWT
 *           → Redirects here: /auth/google/success?token=JWT
 *           → We store token + fetch user → redirect to /dashboard
 */
export default function GoogleSuccessPage() {
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

    // Decode JWT to get userId (payload is the middle base64 segment)
    let userId: number | null = null;
    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      // ASP.NET JWT uses ClaimTypes.NameIdentifier = "sub"
      userId = parseInt(
        payload["sub"] ||
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        payload["nameid"] ||
        "0",
        10
      );
    } catch {
      // If decode fails, still try to redirect — AuthContext will pick up the token
    }

    const continueToApp = (user?: UserDto) => {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      window.location.href = "/dashboard";
    };

    if (userId) {
      // Fetch full user profile so AuthContext can load it from localStorage
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
