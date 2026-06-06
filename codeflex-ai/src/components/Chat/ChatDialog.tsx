"use client";

import React from "react";
import { ChatPanel } from "./ChatPanel";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ChatDialogProps {
  recipientId: number;
  recipientName: string;
  recipientRole: "coach" | "member";
  onClose: () => void;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({
  recipientId,
  recipientName,
  recipientRole,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl h-[600px] flex flex-col">
        {/* Close Button overlay */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 z-50 h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
        <ChatPanel
          recipientId={recipientId}
          recipientName={recipientName}
          recipientRole={recipientRole}
          onClose={onClose}
          className="h-full w-full"
        />
      </div>
    </div>
  );
};
