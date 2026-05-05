"use client";

import React from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Lock, Loader2 } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { hasActiveSubscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Lock className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Active Membership Required
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Visit the reception desk to activate your membership and unlock this
          feature.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
