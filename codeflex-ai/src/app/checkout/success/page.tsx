"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  AlertTriangle, 
  Dumbbell, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { paymentApi } from "@/lib/api/payment";
import Link from "next/link";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const verificationAttempted = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("No session ID found. Invalid checkout redirect.");
      return;
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    // Call backend to verify the Stripe checkout session status and activate subscription
    paymentApi.verifyStripeSession(sessionId)
      .then((res) => {
        if (res.success && res.data) {
          setStatus("success");
          showToast("Payment verified! Welcome to PulseGym!", "success");
        } else {
          setStatus("error");
          setErrorMessage(res.message || "Stripe session verification failed. Payment might be incomplete.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage("A network error occurred while verifying your payment.");
        console.error("Verification error:", err);
      });
  }, [sessionId, showToast]);

  // Countdown timer for automatic redirect on success
  useEffect(() => {
    if (status !== "success") return;

    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white font-sans">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-transform group-hover:scale-105">
            <Dumbbell className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            PulseGym
          </span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] flex flex-col items-center text-center">
          
          {/* STATE 1: Verifying */}
          {status === "verifying" && (
            <div className="flex flex-col items-center py-6 gap-6 animate-fade-in">
              <div className="relative flex items-center justify-center size-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-2">Verifying Payment</h2>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                  Connecting securely to Stripe to confirm your transaction details. Please do not close or refresh this page.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: Success */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-6 animate-scale-up">
              
              {/* Animated Icon Ring */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-ping" />
                <div className="relative flex items-center justify-center size-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle className="w-12 h-12" />
                  <Sparkles className="absolute top-1 right-1 w-5 h-5 text-amber-300 animate-bounce" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 uppercase tracking-wider mb-2 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Securely Verified
                </span>
                <h2 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  Payment Complete!
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
                  Your membership plan has been activated successfully. Prepare to unleash your full potential.
                </p>
              </div>

              {/* Countdown Alert Box */}
              <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-slate-400">
                Redirecting you to your fitness dashboard in{" "}
                <span className="font-bold text-primary text-sm">{countdown}</span> seconds...
              </div>

              {/* Redirect Action Button */}
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full py-6 rounded-2xl bg-primary hover:bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}

          {/* STATE 3: Error */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-6 animate-shake">
              <div className="flex items-center justify-center size-20 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight mb-2 text-red-400">
                  Verification Failed
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                  {errorMessage || "We could not verify your Stripe checkout session. Please check with your bank or try again."}
                </p>
              </div>

              <div className="flex flex-col w-full gap-3">
                <Button
                  onClick={() => router.push("/choose-plan")}
                  className="w-full py-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all border border-white/10"
                >
                  Return to Plans
                </Button>
                
                <Link 
                  href="mailto:support@pulsegym.com" 
                  className="text-xs text-slate-400 hover:text-slate-300 underline font-medium"
                >
                  Contact Gym Support
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} PulseGym AI. All rights reserved. Secure bank-level payment integration.
      </footer>

    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm text-slate-400 font-medium animate-pulse">Loading secure checkout verification...</p>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
