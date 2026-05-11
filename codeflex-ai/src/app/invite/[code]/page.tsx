"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { invitationsApi, GuestCheckInResponse } from "@/lib/api/invitations";

export default function GuestCheckInPage() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [data, setData] = useState<GuestCheckInResponse | null>(null);

  useEffect(() => {
    if (!code) return;
    invitationsApi
      .guestCheckIn(code)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          setStatus(res.data.isValid ? "success" : "error");
        } else {
          setData(null);
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 flex items-center justify-center p-4">
      {status === "loading" && (
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Checking your invitation…</p>
        </div>
      )}

      {status === "success" && data && (
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          {/* Gym logo placeholder */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Welcome, Guest! 👋
          </h1>
          <p className="text-slate-500 mb-6 text-base">
            You&apos;ve been invited by{" "}
            <span className="font-semibold text-slate-800">
              {data.invitedByName ?? "a member"}
            </span>
          </p>

          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold text-green-700">✓ Valid pass</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Checked in at</span>
              <span className="font-semibold text-slate-700">
                {data.guestVisitedAt
                  ? new Date(data.guestVisitedAt).toLocaleString()
                  : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-slate-400 text-xs">
            Please show this screen to the receptionist at the front desk.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-slate-500 mb-4">
            {data?.isExpired
              ? "This invitation has expired."
              : data?.isAlreadyUsed
              ? "This invitation has already been redeemed."
              : (data?.message ?? "This QR code is not valid.")}
          </p>
          {data?.invitedByName && (
            <p className="text-slate-400 text-sm">
              Originally invited by{" "}
              <span className="font-medium">{data.invitedByName}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
