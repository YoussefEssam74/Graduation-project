"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { milestonesApi, type UserMilestoneDto } from "@/lib/api";
import {
  Award,
  Star,
  Trophy,
  Target,
  Flame,
  Dumbbell,
  Calendar,
  TrendingUp,
  Crown,
  Zap,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

// Badge type icons mapping
const badgeIcons: Record<string, React.ReactNode> = {
  workout: <Dumbbell className="h-6 w-6" />,
  streak: <Flame className="h-6 w-6" />,
  weight: <TrendingUp className="h-6 w-6" />,
  nutrition: <Star className="h-6 w-6" />,
  training: <Target className="h-6 w-6" />,
  social: <Crown className="h-6 w-6" />,
  consistency: <Calendar className="h-6 w-6" />,
  strength: <Trophy className="h-6 w-6" />,
  default: <Award className="h-6 w-6" />,
};

// Badge colors based on tier
const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-amber-700/20", text: "text-amber-600", border: "border-amber-600/30" },
  silver: { bg: "bg-slate-400/20", text: "text-slate-400", border: "border-slate-400/30" },
  gold: { bg: "bg-yellow-500/20", text: "text-yellow-500", border: "border-yellow-500/30" },
  platinum: { bg: "bg-cyan-400/20", text: "text-cyan-400", border: "border-cyan-400/30" },
  diamond: { bg: "bg-purple-400/20", text: "text-purple-400", border: "border-purple-400/30" },
  default: { bg: "bg-primary/20", text: "text-primary", border: "border-primary/30" },
};

function AchievementsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [milestones, setMilestones] = useState<UserMilestoneDto[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "in-progress">("all");

  useEffect(() => {
    const fetchMilestones = async () => {
      if (!user?.userId) return;

      try {
        const response = await milestonesApi.getUserMilestones(user.userId);
        if (response.success && response.data) {
          setMilestones(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch milestones:", error);
        showToast("Failed to load achievements", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMilestones();
  }, [user?.userId, showToast]);

  const getBadgeIcon = (milestoneName: string) => {
    const name = milestoneName.toLowerCase();
    if (name.includes("workout") || name.includes("exercise")) return badgeIcons.workout;
    if (name.includes("streak") || name.includes("consecutive")) return badgeIcons.streak;
    if (name.includes("weight") || name.includes("body")) return badgeIcons.weight;
    if (name.includes("nutrition") || name.includes("meal")) return badgeIcons.nutrition;
    if (name.includes("training") || name.includes("session")) return badgeIcons.training;
    if (name.includes("social") || name.includes("friend")) return badgeIcons.social;
    if (name.includes("consistency") || name.includes("regular")) return badgeIcons.consistency;
    if (name.includes("strength") || name.includes("pr")) return badgeIcons.strength;
    return badgeIcons.default;
  };

  const getTierColor = (milestone: UserMilestoneDto) => {
    const tokenReward = milestone.tokensAwarded || 0;
    if (tokenReward >= 100) return tierColors.diamond;
    if (tokenReward >= 50) return tierColors.platinum;
    if (tokenReward >= 25) return tierColors.gold;
    if (tokenReward >= 10) return tierColors.silver;
    if (tokenReward >= 5) return tierColors.bronze;
    return tierColors.default;
  };

  const completedMilestones = milestones.filter((m) => m.isCompleted);
  const inProgressMilestones = milestones.filter((m) => !m.isCompleted && m.currentValue > 0);
  const lockedMilestones = milestones.filter((m) => !m.isCompleted && m.currentValue === 0);

  const filteredMilestones =
    filter === "completed"
      ? completedMilestones
      : filter === "in-progress"
      ? inProgressMilestones
      : milestones;

  const totalTokensEarned = completedMilestones.reduce(
    (sum, m) => sum + (m.tokensAwarded || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          <span>
            <span className="text-foreground">Your </span>
            <span className="text-primary">Achievements</span>
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete milestones to earn badges and bonus tokens
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <div className="text-3xl font-bold">{completedMilestones.length}</div>
          <div className="text-xs text-muted-foreground">achievements</div>
        </Card>

        <Card className="p-5 border border-border bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <div className="text-3xl font-bold">{inProgressMilestones.length}</div>
          <div className="text-xs text-muted-foreground">milestones</div>
        </Card>

        <Card className="p-5 border border-border bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Lock className="h-5 w-5 text-purple-500" />
            </div>
            <span className="text-sm text-muted-foreground">Locked</span>
          </div>
          <div className="text-3xl font-bold">{lockedMilestones.length}</div>
          <div className="text-xs text-muted-foreground">to unlock</div>
        </Card>

        <Card className="p-5 border border-border bg-gradient-to-br from-green-500/10 to-green-600/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">Tokens Earned</span>
          </div>
          <div className="text-3xl font-bold">{totalTokensEarned}</div>
          <div className="text-xs text-muted-foreground">from achievements</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({milestones.length})
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Completed ({completedMilestones.length})
        </Button>
        <Button
          variant={filter === "in-progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("in-progress")}
        >
          <Target className="h-4 w-4 mr-1" />
          In Progress ({inProgressMilestones.length})
        </Button>
      </div>

      {/* Achievements Grid */}
      {filteredMilestones.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-card/50">
          <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
          <p className="text-muted-foreground">
            {filter === "completed"
              ? "Complete milestones to earn achievements"
              : filter === "in-progress"
              ? "Start working on milestones to track progress"
              : "Keep working out to unlock achievements!"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMilestones.map((milestone) => {
            const tierColor = getTierColor(milestone);
            const progress = milestone.targetValue
              ? Math.min((milestone.currentValue / milestone.targetValue) * 100, 100)
              : 0;

            return (
              <Card
                key={milestone.milestoneId}
                className={`relative overflow-hidden border ${
                  milestone.isCompleted
                    ? `${tierColor.border} ${tierColor.bg}`
                    : "border-border bg-card/50"
                } ${!milestone.isCompleted && milestone.currentValue === 0 ? "opacity-60" : ""}`}
              >
                {/* Completed badge */}
                {milestone.isCompleted && (
                  <div className="absolute top-3 right-3">
                    <div className={`p-1.5 rounded-full ${tierColor.bg} ${tierColor.text}`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                )}

                {/* Locked overlay */}
                {!milestone.isCompleted && milestone.currentValue === 0 && (
                  <div className="absolute top-3 right-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="p-5">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`p-3 rounded-xl ${
                        milestone.isCompleted
                          ? `${tierColor.bg} ${tierColor.text}`
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getBadgeIcon(milestone.milestoneName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {milestone.milestoneName}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {milestone.milestoneDescription}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  {!milestone.isCompleted && milestone.targetValue > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {milestone.currentValue} / {milestone.targetValue}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Reward */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">Reward</span>
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span>{milestone.tokensAwarded} Tokens</span>
                    </div>
                  </div>

                  {/* Completion date */}
                  {milestone.isCompleted && milestone.completedAt && (
                    <div className="mt-2 text-xs text-muted-foreground text-right">
                      Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Motivation Card */}
      <Card className="p-6 border-2 border-primary bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">Keep Going!</h3>
            <p className="text-muted-foreground">
              {completedMilestones.length === 0
                ? "Start your journey to earn your first achievement badge!"
                : `You've earned ${completedMilestones.length} badge${
                    completedMilestones.length > 1 ? "s" : ""
                  }! Keep pushing to unlock more rewards.`}
            </p>
          </div>
          {inProgressMilestones.length > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {inProgressMilestones.length}
              </div>
              <div className="text-sm text-muted-foreground">close to completion</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <AchievementsContent />
    </ProtectedRoute>
  );
}
