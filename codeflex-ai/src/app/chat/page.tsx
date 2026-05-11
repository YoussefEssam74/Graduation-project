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
import { ChatDialog } from "@/components/Chat/ChatDialog";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { getConversations, type ConversationDto } from "@/lib/api";

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
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Messages</h1>
                        <p className="text-slate-500 mt-1">
                            {totalUnread > 0
                                ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}`
                                : "All caught up!"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                        <MessageSquare className="h-4 w-4" />
                        {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-10 bg-white border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="p-12 text-center border-slate-200 shadow-sm">
                        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Conversations Yet</h3>
                        <p className="text-slate-500">
                            {searchQuery
                                ? "No conversations match your search."
                                : "Start a conversation from your dashboard."}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((conv) => (
                            <Card
                                key={conv.conversationId}
                                className="p-4 border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-200"
                                onClick={() => setOpenChat(conv)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow">
                                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                                                {conv.otherUserName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conv.isOnline && (
                                            <Circle className="absolute bottom-0 right-0 h-3.5 w-3.5 text-green-500 fill-green-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-bold text-slate-900 truncate">
                                                {conv.otherUserName}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-2 shrink-0">
                                                {getTimeAgo(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-500 truncate">
                                                {conv.lastMessage || "No messages yet"}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <span className="ml-2 shrink-0 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Dialog */}
            {openChat && (
                <ChatDialog
                    recipientId={openChat.otherUserId}
                    recipientName={openChat.otherUserName}
                    recipientRole={recipientRole as "coach" | "member"}
                    onClose={() => {
                        setOpenChat(null);
                        // Refresh conversations to update unread counts
                        getConversations().then(setConversations).catch(console.error);
                    }}
                />
            )}
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
