"use client";

import { useState, useEffect } from "react";
import {
    MessageSquare,
    Loader2,
    Circle,
    Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { getConversations, type ConversationDto } from "@/lib/api";
import { cn } from "@/lib/utils";

function ChatContent() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ConversationDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [openChat, setOpenChat] = useState<ConversationDto | null>(null);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setIsLoading(true);
                const data = await getConversations();
                setConversations(data);
            } catch (error) {
                console.error("Failed to load conversations:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConversations();
    }, []);

    const filtered = conversations.filter(c =>
        c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTimeAgo = (iso: string) => {
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    // Members chat with coaches; coaches chat with members
    const recipientRole = (user?.role === "Coach" || user?.role === "coach")
        ? "member"
        : "coach";

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    return (
        <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-40px)] w-full gap-4 overflow-hidden pt-4">
            
            {/* Left Panel: Conversation List */}
            <div className={cn(
                "flex flex-col h-full w-full lg:w-[360px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden",
                openChat && "hidden lg:flex"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-xl font-black text-slate-900 dark:text-white">Messages</h1>
                        {totalUnread > 0 && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold animate-pulse">
                                {totalUnread} new
                            </span>
                        )}
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversations scrollable area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0 bg-slate-50/20 dark:bg-slate-950/5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                            <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                            <p className="text-xs">No conversations found</p>
                        </div>
                    ) : (
                        filtered.map((conv) => {
                            const isSelected = openChat?.conversationId === conv.conversationId;
                            return (
                                <div
                                    key={conv.conversationId}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3",
                                        isSelected
                                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/60 shadow-sm"
                                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                                    )}
                                    onClick={() => setOpenChat(conv)}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800">
                                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-sm">
                                                {conv.otherUserName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conv.isOnline && (
                                            <Circle className="absolute bottom-0 right-0 h-3 w-3 text-green-500 fill-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={cn("font-bold text-slate-900 dark:text-white text-sm truncate", conv.unreadCount > 0 && "font-black")}>
                                                {conv.otherUserName}
                                            </span>
                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                {getTimeAgo(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={cn("text-xs text-slate-500 dark:text-slate-400 truncate", conv.unreadCount > 0 && "text-slate-800 dark:text-slate-200 font-bold")}>
                                                {conv.lastMessage || "No messages yet"}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <span className="ml-2 shrink-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Panel: Active Chat Panel or Empty State */}
            <div className={cn(
                "flex-1 h-full",
                !openChat && "hidden lg:block"
            )}>
                {openChat ? (
                    <ChatPanel
                        recipientId={openChat.otherUserId}
                        recipientName={openChat.otherUserName}
                        recipientRole={recipientRole as "coach" | "member"}
                        onClose={() => {
                            setOpenChat(null);
                            // Refresh conversations to update unread counts
                            getConversations().then(setConversations).catch(console.error);
                        }}
                        className="h-full w-full"
                    />
                ) : (
                    <Card className="h-full flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-xl p-8 text-center">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl animate-pulse mb-4">
                            <MessageSquare className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a Conversation</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
                            Choose a conversation from the left to view messages and chat in real-time.
                        </p>
                    </Card>
                )}
            </div>

        </div>
    );
}

export default function ChatPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
            <ChatContent />
        </ProtectedRoute>
    );
}
