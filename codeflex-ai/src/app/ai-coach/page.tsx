"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import {
  Brain,
  Send,
  Ticket,
  History,
  Plus,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiApi, AIChatLogDto, AIChatSessionDto } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

// Message type for display
interface DisplayMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

function AICoachContent() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sessions, setSessions] = useState<AIChatSessionDto[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      if (!user?.userId) return;

      try {
        const response = await aiApi.getChatSessions(user.userId);
        if (response.success && response.data?.sessions) {
          setSessions(response.data.sessions);
        }
      } catch (error) {
        console.error("Failed to load chat sessions:", error);
      }
    };

    loadSessions();
  }, [user?.userId]);

  // Load messages for a session
  const loadSessionMessages = async (sessionId: string) => {
    if (!user?.userId) return;

    setIsLoading(true);
    setCurrentSessionId(sessionId);

    try {
      const response = await aiApi.getSessionMessages(user.userId, sessionId);
      if (response.success && response.data?.messages) {
        const displayMessages: DisplayMessage[] = response.data.messages.map((msg: AIChatLogDto) => ({
          id: msg.chatLogId.toString(),
          role: "user" as const,
          content: msg.userMessage,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        // Add AI responses
        const withAiResponses: DisplayMessage[] = [];
        response.data.messages.forEach((msg: AIChatLogDto) => {
          withAiResponses.push({
            id: `user-${msg.chatLogId}`,
            role: "user",
            content: msg.userMessage,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          withAiResponses.push({
            id: `ai-${msg.chatLogId}`,
            role: "ai",
            content: msg.aiResponse,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        });

        setMessages(withAiResponses);
      }
    } catch (error) {
      console.error("Failed to load session messages:", error);
      showToast("Failed to load messages", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  // Send message to AI
  const handleSend = async () => {
    if (!input.trim() || !user?.userId || isSending) return;

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await aiApi.sendMessage(
        user.userId,
        input,
        currentSessionId || undefined
      );

      if (response.success && response.data) {
        const aiMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: response.data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, aiMessage]);

        // Set session ID if this was a new chat
        if (!currentSessionId && response.data.sessionId) {
          setCurrentSessionId(response.data.sessionId);
        }

        // Refresh user to update token balance
        refreshUser();

        // Reload sessions to show the new one
        const sessionsResponse = await aiApi.getChatSessions(user.userId);
        if (sessionsResponse.success && sessionsResponse.data?.sessions) {
          setSessions(sessionsResponse.data.sessions);
        }
      } else {
        showToast(response.message || "Failed to get AI response", "error");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 relative overflow-hidden flex flex-col md:flex-row">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          opacity: 0.1
        }}
      />

      {/* Sidebar - Chat Sessions */}
      <div className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col z-10">
        <div className="p-4 border-b border-slate-100">
          <Button
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
          >
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
            Chat History
          </h3>

          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No previous chats</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <div
                  key={session.sessionId}
                  onClick={() => loadSessionMessages(session.sessionId)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${currentSessionId === session.sessionId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 text-sm truncate">
                        {session.title || "Chat Session"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(session.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Chat Header */}
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">AI Fitness Coach</h2>
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Online • 1 token per message
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
              <Ticket className="h-3 w-3" />
              {user?.tokenBalance ?? 0} tokens
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Start a Conversation</h3>
              <p className="text-slate-500 max-w-md">
                Ask me anything about workouts, nutrition, recovery, or your fitness goals.
                I&apos;m here to help you on your fitness journey!
              </p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                  : 'bg-slate-200'
                  }`}>
                  {msg.role === 'ai'
                    ? <Brain className="h-4 w-4 text-white" />
                    : <span className="text-xs font-bold text-slate-600">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  }
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai'
                  ? 'bg-white text-slate-700 rounded-tl-none shadow-sm'
                  : 'bg-blue-600 text-white rounded-tr-none'
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-2 ${msg.role === 'ai' ? 'text-slate-400' : 'text-blue-200'
                    }`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about workouts, nutrition, or your fitness goals..."
              className="flex-1 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            AI responses are for informational purposes only. Always consult with a professional for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AICoachPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <AICoachContent />
    </ProtectedRoute>
  );
}
