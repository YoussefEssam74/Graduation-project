"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@/types/gym";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { activityFeedApi, type ActivityFeedDto, type ActivityFeedCommentDto } from "@/lib/api";
import {
  MessageSquare,
  Heart,
  Send,
  Loader2,
  Users,
  Trash2,
  Globe,
} from "lucide-react";

type PostCategory = "general" | "thanks" | "advice" | "complaint";

const CATEGORIES: {
  value: PostCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: "general",   label: "General",   emoji: "💬", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "thanks",    label: "Thanks",    emoji: "🙏", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { value: "advice",    label: "Advice",    emoji: "💡", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { value: "complaint", label: "Complaint", emoji: "😤", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
];

const FILTERS = [
  { value: "all",         label: "All" },
  { value: "posts",       label: "Posts" },
  { value: "workout",     label: "Workouts" },
  { value: "booking",     label: "Bookings" },
  { value: "achievement", label: "Achievements" },
];

function getCategoryStyle(activityType: string) {
  const type = activityType.toLowerCase();
  const cat = CATEGORIES.find((c) => c.value === type);
  if (cat) return { emoji: cat.emoji, label: cat.label, color: cat.color };
  switch (type) {
    case "workout":
      return { emoji: "🏋️", label: "Workout",     color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" };
    case "booking":
      return { emoji: "📅", label: "Booking",     color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" };
    case "achievement":
      return { emoji: "🏆", label: "Achievement", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" };
    default:
      return { emoji: "📋", label: activityType,  color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" };
  }
}

function isUserPost(activityType: string) {
  return ["general", "thanks", "advice", "complaint", "post"].includes(
    activityType.toLowerCase()
  );
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CommunityContent() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Feed state
  const [activities, setActivities] = useState<ActivityFeedDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Post composer state
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState<PostCategory>("general");
  const [isPosting, setIsPosting] = useState(false);

  // Like / comment state
  const [likeLoading, setLikeLoading] = useState<Set<number>>(new Set());
  const [openCommentBox, setOpenCommentBox] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [comments, setComments] = useState<Map<number, ActivityFeedCommentDto[]>>(new Map());
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await activityFeedApi.getRecentActivities(100);
      if (res.success && res.data) setActivities(res.data);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;
    setIsPosting(true);
    try {
      const res = await activityFeedApi.createActivity({
        activityType: postCategory,
        title: postContent.trim(),
        description: postContent.trim(),
      });
      if (res.success && res.data) {
        setActivities((prev) => [res.data!, ...prev]);
        setPostContent("");
        setComposerExpanded(false);
        showToast("Post shared with the community!", "success");
      }
    } catch {
      showToast("Failed to create post", "error");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await activityFeedApi.deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.activityId !== id));
      showToast("Post deleted", "success");
    } catch {
      showToast("Failed to delete post", "error");
    }
  };

  const handleLike = async (activity: ActivityFeedDto) => {
    if (likeLoading.has(activity.activityId)) return;
    setLikeLoading((prev) => new Set(prev).add(activity.activityId));
    try {
      if (activity.isLikedByCurrentUser) {
        await activityFeedApi.unlikeActivity(activity.activityId);
        setActivities((prev) =>
          prev.map((a) =>
            a.activityId === activity.activityId
              ? { ...a, isLikedByCurrentUser: false, likesCount: a.likesCount - 1 }
              : a
          )
        );
      } else {
        await activityFeedApi.likeActivity(activity.activityId);
        setActivities((prev) =>
          prev.map((a) =>
            a.activityId === activity.activityId
              ? { ...a, isLikedByCurrentUser: true, likesCount: a.likesCount + 1 }
              : a
          )
        );
      }
    } catch {
      showToast("Failed to update like", "error");
    } finally {
      setLikeLoading((prev) => {
        const s = new Set(prev);
        s.delete(activity.activityId);
        return s;
      });
    }
  };

  const handleToggleComments = async (activityId: number) => {
    if (openCommentBox === activityId) {
      setOpenCommentBox(null);
      setCommentText("");
      return;
    }
    setOpenCommentBox(activityId);
    setCommentText("");
    if (!comments.has(activityId)) {
      setLoadingComments((prev) => new Set(prev).add(activityId));
      try {
        const res = await activityFeedApi.getComments(activityId);
        if (res.success && res.data) {
          setComments((prev) => new Map(prev).set(activityId, res.data!));
        }
      } finally {
        setLoadingComments((prev) => {
          const s = new Set(prev);
          s.delete(activityId);
          return s;
        });
      }
    }
  };

  const handleSubmitComment = async (activityId: number) => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await activityFeedApi.addComment(activityId, commentText.trim());
      if (res.success && res.data) {
        setComments((prev) => {
          const existing = prev.get(activityId) || [];
          return new Map(prev).set(activityId, [...existing, res.data!]);
        });
        setActivities((prev) =>
          prev.map((a) =>
            a.activityId === activityId ? { ...a, commentsCount: a.commentsCount + 1 } : a
          )
        );
        setCommentText("");
      }
    } catch {
      showToast("Failed to add comment", "error");
    } finally {
      setCommentLoading(false);
    }
  };

  const filteredActivities = activities.filter((a) => {
    if (filter === "all") return true;
    if (filter === "posts") return isUserPost(a.activityType);
    return a.activityType.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Community
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Share your thoughts with fellow gym members
          </p>
        </div>

        {/* Post Composer */}
        <Card className="p-4 mb-4 border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {!composerExpanded ? (
                <button
                  onClick={() => setComposerExpanded(true)}
                  className="w-full text-left bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2.5 text-slate-400 text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  What&apos;s on your mind, {user?.name?.split(" ")[0] || "there"}?
                </button>
              ) : (
                <div>
                  <textarea
                    autoFocus
                    placeholder={`What's on your mind, ${user?.name?.split(" ")[0] || "there"}?`}
                    className="w-full resize-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none min-h-[80px]"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setComposerExpanded(false);
                        setPostContent("");
                      }
                    }}
                  />
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      Post type:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setPostCategory(cat.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${
                            postCategory === cat.value
                              ? "border-blue-500 " + cat.color + " shadow-sm"
                              : "border-transparent bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setComposerExpanded(false);
                          setPostContent("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreatePost}
                        disabled={!postContent.trim() || isPosting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5"
                      >
                        {isPosting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Post"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Nothing here yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Be the first to share something!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const postStyle = isUserPost(activity.activityType);
              const catStyle = getCategoryStyle(activity.activityType);
              const isOwn = activity.userId === user?.userId;

              return (
                <Card
                  key={activity.activityId}
                  className="p-4 border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback
                          className={`font-bold text-sm ${
                            postStyle
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {activity.userName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {activity.userName || "Member"}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${catStyle.color}`}
                          >
                            {catStyle.emoji} {catStyle.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <Globe className="h-3 w-3" />
                          {getTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => handleDeletePost(activity.activityId)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="mt-3">
                    {postStyle ? (
                      <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                        {activity.title}
                      </p>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {activity.title}
                        </p>
                        {activity.description &&
                          activity.description !== activity.title && (
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                              {activity.description}
                            </p>
                          )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleLike(activity)}
                      disabled={likeLoading.has(activity.activityId)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                        activity.isLikedByCurrentUser
                          ? "text-red-500"
                          : "text-slate-400 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 ${activity.isLikedByCurrentUser ? "fill-current" : ""}`}
                      />
                      <span>
                        {activity.likesCount > 0 ? activity.likesCount : "Like"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleToggleComments(activity.activityId)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                        openCommentBox === activity.activityId
                          ? "text-blue-500"
                          : "text-slate-400 hover:text-blue-500"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>
                        {activity.commentsCount > 0 ? activity.commentsCount : "Comment"}
                      </span>
                    </button>
                  </div>

                  {/* Comments section */}
                  {openCommentBox === activity.activityId && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
                      {loadingComments.has(activity.activityId) ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                      ) : (
                        (comments.get(activity.activityId) || []).map((c) => (
                          <div key={c.id} className="flex items-start gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                                {c.userName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {c.userName || "Member"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {getTimeAgo(c.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300">
                                {c.comment}
                              </p>
                            </div>
                          </div>
                        ))
                      )}

                      {/* New comment input */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                            {user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitComment(activity.activityId);
                              }
                            }}
                            className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-sm h-8 rounded-full px-4"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSubmitComment(activity.activityId)}
                            disabled={commentLoading || !commentText.trim()}
                            className="h-8 w-8 p-0 rounded-full"
                          >
                            {commentLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        UserRole.Member,
        UserRole.Coach,
        UserRole.Receptionist,
        UserRole.Admin,
      ]}
    >
      <CommunityContent />
    </ProtectedRoute>
  );
}

