"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { HubConnectionState } from "@microsoft/signalr";
import { useSignalR } from "@/contexts/SignalRContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChatMessage } from "@/lib/signalr/hubConnection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getChatHistory, markMessagesAsRead, ChatMessageDto } from "@/lib/api/chat";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  recipientId: number;
  recipientName: string;
  recipientRole: "coach" | "member";
  onClose?: () => void; // Show close/back button if provided
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  recipientId,
  recipientName,
  recipientRole,
  onClose,
  className,
}) => {
  const { user } = useAuth();
  const {
    sendMessageToCoach,
    sendMessageToMember,
    onChatMessage,
    offChatMessage,
    chatConnectionState,
  } = useSignalR();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (instant = false) => {
    if (instant && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on recipient change
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        console.log("Loading chat history with user:", recipientId);
        const history = await getChatHistory(recipientId);
        console.log("Chat history loaded:", history.length, "messages");

        // Convert API response to ChatMessage format
        const chatMessages: ChatMessage[] = history.map((msg: ChatMessageDto) => ({
          senderId: msg.senderId,
          senderName: msg.senderName,
          message: msg.message,
          timestamp: msg.createdAt,
          conversationId: msg.conversationId,
        }));

        setMessages(chatMessages);

        // Mark messages as read
        await markMessagesAsRead(recipientId);

        // Scroll to bottom
        setTimeout(() => scrollToBottom(true), 50);
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [recipientId]);

  // Listen for incoming messages
  useEffect(() => {
    const handleMessage = (message: ChatMessage) => {
      console.log("Received message via SignalR:", message);
      // Only add message if it's from/to this conversation
      if (
        message.senderId === recipientId ||
        (user?.userId && message.senderId === user.userId)
      ) {
        setMessages((prev) => {
          const isDuplicate = prev.some(
            (m) =>
              m.message === message.message &&
              m.senderId === message.senderId &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000
          );
          if (isDuplicate) return prev;
          return [...prev, message];
        });

        // Mark as read if message is from recipient
        if (message.senderId === recipientId) {
          markMessagesAsRead(recipientId).catch(console.error);
        }
      }
    };

    console.log("Setting up message listener for chat with:", recipientName);
    onChatMessage(handleMessage);

    return () => {
      console.log("Removing message listener");
      offChatMessage(handleMessage);
    };
  }, [onChatMessage, offChatMessage, recipientName, recipientId, user?.userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending || chatConnectionState !== HubConnectionState.Connected) {
      return;
    }

    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage(""); // Clear immediately for better UX

    try {
      console.log(`Sending message to ${recipientRole} (ID: ${recipientId}):`, messageText);

      if (recipientRole === "coach") {
        await sendMessageToCoach(recipientId, messageText);
      } else {
        await sendMessageToMember(recipientId, messageText);
      }

      setMessages((prev) => [
        ...prev,
        {
          senderId: user?.userId || 0,
          senderName: user?.name || "You",
          message: messageText,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageText); // Restore message on error
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const isConnected = chatConnectionState === HubConnectionState.Connected;

  return (
    <Card className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center gap-3 border-b border-slate-100 dark:border-slate-800 py-4 px-6 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
            {recipientName}
          </CardTitle>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500")} />
            {isConnected ? "Online" : "Connecting..."}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 min-h-0 space-y-4 bg-slate-50/30 dark:bg-slate-950/10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-slate-500">Loading history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400">
              <p className="text-sm">No messages yet. Send a message to start!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isOwnMessage = msg.senderId === user?.userId;
                return (
                  <div
                    key={index}
                    className={cn("flex w-full", isOwnMessage ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed",
                        isOwnMessage
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-tl-none"
                      )}
                    >
                      {!isOwnMessage && (
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={cn("text-[9px] text-right mt-1.5", isOwnMessage ? "text-blue-200" : "text-slate-400")}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-slate-100 dark:border-slate-800 p-4 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected || isSending}
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus-visible:ring-blue-500"
            />
            <Button
              type="submit"
              disabled={!isConnected || !newMessage.trim() || isSending}
              size="icon"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
