"use client";

import { UserRole } from "@/types/gym";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    MessageSquare,
    Heart,
    Share2,
    Search,
    Filter,
    MoreHorizontal
} from "lucide-react";

function CommunityContent() {
    const posts = [
        {
            id: 1,
            author: "Sarah Jenkins",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
            time: "2 hours ago",
            content: "Just finished the Hypertrophy Phase 1 program! Feeling stronger than ever. Thanks to my coach for the guidance. 💪 #FitnessJourney #PulseGym",
            image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
            likes: 24,
            comments: 5
        },
        {
            id: 2,
            author: "Mike Ross",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
            time: "5 hours ago",
            content: "Anyone up for a running group this weekend? Thinking of doing the river trail on Saturday morning.",
            likes: 12,
            comments: 8
        }
    ];

    return (
        <div className="min-h-screen relative p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Community Feed</h1>
                        <p className="text-slate-500 mt-1">Connect with other members and share your progress.</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        Create Post
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search posts..." className="pl-10 bg-white border-slate-200" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Feed */}
                <div className="space-y-6">
                    {posts.map((post) => (
                        <Card key={post.id} className="p-6 border-slate-200 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={post.avatar} />
                                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{post.author}</h3>
                                        <p className="text-xs text-slate-500">{post.time}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-400">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>

                            <p className="text-slate-700 mb-4 leading-relaxed">
                                {post.content}
                            </p>

                            {post.image && (
                                <div className="rounded-xl overflow-hidden mb-4">
                                    <img src={post.image} alt="Post content" className="w-full object-cover max-h-[400px]" />
                                </div>
                            )}

                            <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                                <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
                                    <Heart className="h-5 w-5" />
                                    <span className="text-sm font-medium">{post.likes}</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors">
                                    <MessageSquare className="h-5 w-5" />
                                    <span className="text-sm font-medium">{post.comments}</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-green-500 transition-colors ml-auto">
                                    <Share2 className="h-5 w-5" />
                                    <span className="text-sm font-medium">Share</span>
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>

            </div>
        </div>
    );
}

export default function CommunityPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach, UserRole.Receptionist, UserRole.Admin]}>
            <CommunityContent />
        </ProtectedRoute>
    );
}
