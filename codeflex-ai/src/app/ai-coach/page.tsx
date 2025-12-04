"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Brain,
  Send,
  Zap,
  History,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AICoachPage() {
  const { user, deductTokens, token } = useAuth();
  // API base - can be configured via environment variable in development/production
  const API_BASE = (
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5025/api"
  ).replace(/\/$/, "");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; content: string; timestamp: string }[]
  >([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const suggestedPrompts = [
    "What should I eat after my workout?",
    "How can I improve my bench press?",
    "Create a meal plan for muscle gain",
    "What exercises target lower back?",
    "How much protein do I need daily?",
    "Tips for better recovery",
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const currentBalance = user?.tokenBalance ?? 0;
    if (currentBalance <= 0) {
      const outOfTokens = {
        role: "ai" as const,
        content:
          "You have run out of tokens — generate more or upgrade your plan to continue using the AI coach.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatHistory((s) => [...s, outOfTokens]);
      return;
    }

    // optimistically add user message
    const newUserMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setChatHistory((s) => [...s, newUserMessage]);
    setIsSending(true);

    // send to backend Gemini endpoint
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/ai/gemini-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId: user?.userId, message }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`AI API error: ${res.status} ${txt}`);
        }

        const payload = await res.json();
        const aiReply = payload?.data?.response ?? "Sorry, I couldn't get a response from the AI.";

        // add ai message and deduct token
        const aiMessage = { role: "ai" as const, content: aiReply, timestamp: new Date().toLocaleTimeString() };
        setChatHistory((s) => [...s, aiMessage]);
        deductTokens(1);
      } catch (err) {
        console.error("Error sending message to Gemini API:", err);
        const errMsg = { role: "ai" as const, content: "Error: Unable to get response from AI. Try again later.", timestamp: new Date().toLocaleTimeString() };
        setChatHistory((s) => [...s, errMsg]);
      } finally {
        setIsSending(false);
        setMessage("");
      }
    })();
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
  };

  // Load chat history for the user on mount
  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      if (!user?.userId) {
        setIsLoadingHistory(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/ai/history/${user.userId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          console.warn("Failed to load chat history", res.status);
          setIsLoadingHistory(false);
          return;
        }

        const data = await res.json();
        // Expecting array of { role, content, timestamp } or similar shape
        if (mounted && Array.isArray(data)) {
          const mapped = data.map((m: any) => ({ role: m.role ?? (m.isUser ? 'user' : 'ai'), content: m.content ?? m.message ?? '', timestamp: m.timestamp ?? new Date().toLocaleTimeString() }));
          // Full history list is available on the left pane
          setHistoryList(mapped);
          // Show recent messages in the main chat area (last 12)
          setChatHistory(mapped.slice(-12));
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      } finally {
        if (mounted) setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => { mounted = false; };
  }, [user?.userId]);

  // Keep chat scrolled to bottom when new messages arrive
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  // Ref to the last message element to reliably scroll into view
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // First try to scroll the last message into view (preferred)
    const last = lastMessageRef.current;
    if (last) {
      try {
        last.scrollIntoView({ behavior: "smooth", block: "end" });
        return;
      } catch {
        // fall back to container scroll
      }
    }

    const el = chatContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatHistory]);

  const handleHistoryItemClick = (index: number) => {
    // load conversation up to clicked message (simple approach)
    setChatHistory(historyList.slice(0, index + 1));
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gradient-to-b from-background to-background/95">
      <div className="flex-1 container mx-auto px-4 py-4 max-w-7xl flex flex-col min-h-0">
        {/* Main Chat Area - Full Height */}
        <div className="flex-1 grid lg:grid-cols-4 gap-4 min-h-0">
          {/* Left: History Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1 hidden lg:block min-h-0">
            <Card className="h-full flex flex-col border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">History</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                {isLoadingHistory && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}
                {!isLoadingHistory && historyList.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
                )}
                {historyList.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleHistoryItemClick(idx)}
                    className="w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-medium uppercase tracking-wide ${item.role === 'ai' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {item.role === 'ai' ? 'AI' : 'You'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-1 group-hover:text-foreground transition-colors">{item.content}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Chat Area */}
          <div className="lg:col-span-3 order-1 lg:order-2 min-h-0">
            <Card className="h-full flex flex-col border-0 shadow-xl bg-card/90 backdrop-blur-sm overflow-hidden min-h-0">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">AI Fitness Coach</h3>
                      <p className="text-xs text-muted-foreground">Powered by Gemini AI</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-sm">{user?.tokenBalance ?? 0}</span>
                      <span className="text-xs text-muted-foreground">tokens</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-transparent to-muted/5 min-h-0">
                {chatHistory.length === 0 && !isLoadingHistory && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="p-3 bg-primary/10 rounded-2xl mb-3">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">Start a Conversation</h3>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md">
                      Ask me anything about fitness, nutrition, or health goals!
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                      {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handlePromptClick(prompt)}
                          className="text-left p-2.5 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/10 hover:border-primary/30 text-xs transition-all duration-200"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    ref={index === chatHistory.length - 1 ? lastMessageRef : null}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-muted/80 border border-border/50"
                      } rounded-2xl px-3 py-2`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-muted/80 border border-border/50 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex-shrink-0 p-3 border-t border-border/50 bg-background/80">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything about fitness, nutrition, or training..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1 border-border/50 bg-muted/30 focus:bg-background transition-colors"
                    disabled={isSending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!message.trim() || (user?.tokenBalance ?? 0) <= 0 || isSending}
                    className="px-4 shadow-lg shadow-primary/20"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
                  1 token per message • Press Enter to send
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
