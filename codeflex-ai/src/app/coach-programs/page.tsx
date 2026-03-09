"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dumbbell,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { getCoachReviewPlans, updatePlanStatus, type UserAIWorkoutPlan } from "@/lib/api/workoutAI";

function CoachProgramsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewPlans, setReviewPlans] = useState<UserAIWorkoutPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<"all" | "UnderReview" | "Approved" | "Rejected">("all");
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [notesPlan, setNotesPlan] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchReviewPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const response = await getCoachReviewPlans();
      setReviewPlans(response.data || []);
    } catch {
      showToast("Failed to load plans for review", "error");
    } finally {
      setLoadingPlans(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReviewPlans();
  }, [fetchReviewPlans]);

  const handleUpdateStatus = async (planId: number, status: "Approved" | "Rejected", notes?: string) => {
    setActionLoading(planId);
    try {
      const response = await updatePlanStatus(planId, status, notes);
      if (response.success) {
        setReviewPlans(prev =>
          prev.map(p => p.planId === planId ? { ...p, status, approvalNotes: notes } : p)
        );
        showToast(`Plan ${status === "Approved" ? "approved" : "rejected"} successfully`, "success");
        setNotesPlan(null);
        setNotesText("");
      } else {
        showToast(response.message || "Failed to update plan status", "error");
      }
    } catch {
      showToast("Failed to update plan status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Mock data for programs
  const programs = [
    { id: 1, name: "Strength Building Program", type: "Workout", description: "12-week strength training program", duration: "12 weeks", activeClients: 8, createdDate: "2025-10-15", difficulty: "Intermediate", sessionsPerWeek: 4, status: "Active" },
    { id: 2, name: "Weight Loss Journey", type: "Full Program", description: "Combined workout and nutrition plan", duration: "16 weeks", activeClients: 12, createdDate: "2025-09-20", difficulty: "Beginner", sessionsPerWeek: 5, status: "Active" },
    { id: 3, name: "Athletic Performance", type: "Workout", description: "Advanced program for athletes", duration: "8 weeks", activeClients: 5, createdDate: "2025-11-01", difficulty: "Advanced", sessionsPerWeek: 6, status: "Active" },
    { id: 4, name: "Beginner Fitness Basics", type: "Workout", description: "Foundation program for newcomers", duration: "8 weeks", activeClients: 15, createdDate: "2025-08-15", difficulty: "Beginner", sessionsPerWeek: 3, status: "Active" },
  ];

  const filteredPlans = reviewPlans.filter(p =>
    (reviewFilter === "all" || p.status === reviewFilter) &&
    (p.planName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.goal?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingCount = reviewPlans.filter(p => p.status === "UnderReview").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UnderReview":
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full flex items-center gap-1"><AlertCircle className="h-3 w-3" />Under Review</span>;
      case "Approved":
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</span>;
      case "Rejected":
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</span>;
      default:
        return <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Training Programs</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Review AI-generated member plans and manage your programs
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-primary">{reviewPlans.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total AI Plans</div>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-full"><Dumbbell className="h-5 w-5 text-primary" /></div>
          </div>
        </Card>
        <Card className="p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending Review</div>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-full"><AlertCircle className="h-5 w-5 text-amber-500" /></div>
          </div>
        </Card>
        <Card className="p-5 border border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-500">{reviewPlans.filter(p => p.status === "Approved").length}</div>
              <div className="text-xs text-muted-foreground mt-1">Approved Plans</div>
            </div>
            <div className="p-2.5 bg-green-500/10 rounded-full"><CheckCircle className="h-5 w-5 text-green-500" /></div>
          </div>
        </Card>
        <Card className="p-5 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-primary">{programs.length}</div>
              <div className="text-xs text-muted-foreground mt-1">My Programs</div>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-full"><Users className="h-5 w-5 text-blue-500" /></div>
          </div>
        </Card>
      </div>

      {/* ─── AI Plans for Review ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">AI Plans for Review</h2>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(["all", "UnderReview", "Approved", "Rejected"] as const).map(f => (
              <button
                key={f}
                onClick={() => setReviewFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${reviewFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {f === "all" ? "All" : f === "UnderReview" ? "Under Review" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member, plan or goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loadingPlans ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card className="p-10 border border-border text-center bg-card/50">
            <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{reviewPlans.length === 0 ? "No AI plans assigned to you yet" : "No plans match your filter"}</p>
            <p className="text-sm text-muted-foreground mt-1">Plans will appear here when members save AI-generated workouts</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.planId} className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {getStatusBadge(plan.status || "Unknown")}
                        <span className="text-xs text-muted-foreground">
                          {new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg truncate">{plan.planName}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Users className="h-3 w-3" />
                          {plan.memberName || `Member #${plan.memberId}`}
                        </span>
                        {plan.goal && <><span className="text-slate-300 dark:text-slate-600">·</span><span className="text-xs text-slate-500 dark:text-slate-400">{plan.goal}</span></>}
                        {plan.fitnessLevel && <><span className="text-slate-300 dark:text-slate-600">·</span><span className="text-xs text-slate-500 dark:text-slate-400">{plan.fitnessLevel}</span></>}
                        {plan.daysPerWeek && <><span className="text-slate-300 dark:text-slate-600">·</span><span className="text-xs text-slate-500 dark:text-slate-400">{plan.daysPerWeek}d/week</span></>}
                      </div>
                      {plan.approvalNotes && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">&ldquo;{plan.approvalNotes}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {plan.status === "UnderReview" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                            onClick={() => handleUpdateStatus(plan.planId, "Approved")}
                            disabled={actionLoading === plan.planId}
                          >
                            {actionLoading === plan.planId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-500 hover:bg-red-500/10 gap-1.5"
                            onClick={() => { setNotesPlan(notesPlan === plan.planId ? null : plan.planId); setNotesText(""); }}
                            disabled={actionLoading === plan.planId}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() => setExpandedPlan(expandedPlan === plan.planId ? null : plan.planId)}
                      >
                        {expandedPlan === plan.planId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {expandedPlan === plan.planId ? "Hide" : "View"} Plan
                      </Button>
                    </div>
                  </div>

                  {/* Rejection notes inline */}
                  {notesPlan === plan.planId && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <p className="text-sm font-medium">Rejection reason (optional)</p>
                      <textarea
                        className="w-full text-sm bg-muted rounded-lg p-3 border border-border outline-none focus:ring-1 focus:ring-red-500 resize-none"
                        rows={3}
                        placeholder="Explain why this plan is being rejected..."
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleUpdateStatus(plan.planId, "Rejected", notesText || undefined)}
                          disabled={actionLoading === plan.planId}
                        >
                          {actionLoading === plan.planId ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                          Confirm Reject
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setNotesPlan(null); setNotesText(""); }}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Expanded exercise plan */}
                  {expandedPlan === plan.planId && plan.days && plan.days.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {plan.days.map((day, di) => (
                        <div key={di} className="rounded-lg bg-muted/50 p-3">
                          <p className="text-sm font-semibold mb-2 text-primary">
                            Day {day.day}: {day.focus || day.dayName}
                          </p>
                          <div className="grid gap-1.5">
                            {day.exercises.map((ex, ei) => (
                              <div key={ei} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-background/60 rounded px-3 py-1.5">
                                <span className="font-medium">{ex.exerciseName || ex.name}</span>
                                <span className="text-muted-foreground tabular-nums">
                                  {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.duration || ""}
                                  {ex.restSeconds ? ` · ${ex.restSeconds}s rest` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ─── My Programs ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">My Programs</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((program) => (
            <Card key={program.id} className="p-5 border border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg"><Dumbbell className="h-4 w-4 text-primary" /></div>
                    <span className="text-xs text-muted-foreground">{program.type}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${program.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}`}>{program.status}</span>
                </div>
                <div>
                  <h3 className="font-bold">{program.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{program.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">{program.difficulty}</span>
                  {program.sessionsPerWeek > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">{program.sessionsPerWeek}x/week</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{program.duration}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{program.activeClients} clients</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1.5" size="sm"><Eye className="h-3.5 w-3.5" />View</Button>
                  <Button variant="outline" className="flex-1 gap-1.5" size="sm"><Edit className="h-3.5 w-3.5" />Edit</Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function CoachProgramsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachProgramsContent />
    </ProtectedRoute>
  );
}

    {
      id: 2,
      name: "Weight Loss Journey",
      type: "Full Program",
      description: "Combined workout and nutrition plan for healthy weight loss",
      duration: "16 weeks",
      activeClients: 12,
      createdDate: "2025-09-20",
      difficulty: "Beginner",
      sessionsPerWeek: 5,
      status: "Active",
    },
    {
      id: 3,
      name: "Athletic Performance",
      type: "Workout",
      description: "Advanced program for athletes focusing on speed and agility",
      duration: "8 weeks",
      activeClients: 5,
      createdDate: "2025-11-01",
      difficulty: "Advanced",
      sessionsPerWeek: 6,
      status: "Active",
    },
    {
      id: 4,
      name: "Muscle Gain Nutrition",
      type: "Nutrition",
      description: "High-protein meal plan optimized for muscle growth",
      duration: "12 weeks",
      activeClients: 10,
      createdDate: "2025-10-10",
      difficulty: "All Levels",
      sessionsPerWeek: 0,
      status: "Active",
    },
    {
      id: 5,
      name: "Beginner Fitness Basics",
      type: "Workout",
      description: "Foundation program for gym newcomers",
      duration: "8 weeks",
      activeClients: 15,
      createdDate: "2025-08-15",
      difficulty: "Beginner",
      sessionsPerWeek: 3,
      status: "Active",
    },
    {
      id: 6,
      name: "Recovery & Flexibility",
      type: "Workout",
      description: "Low-impact program focusing on mobility and recovery",
      duration: "6 weeks",
      activeClients: 4,
      createdDate: "2025-11-10",
      difficulty: "All Levels",
      sessionsPerWeek: 3,
      status: "Draft",
    },
  ];

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/10 text-green-500";
      case "Intermediate":
        return "bg-yellow-500/10 text-yellow-500";
      case "Advanced":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Workout":
        return <Dumbbell className="h-4 w-4" />;
      case "Nutrition":
        return <Calendar className="h-4 w-4" />;
      case "Full Program":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Dumbbell className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Training Programs</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage workout and nutrition programs
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Program
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{programs.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Programs</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {programs.reduce((sum, p) => sum + p.activeClients, 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Clients</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">
                {programs.filter(p => p.status === "Active").length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Programs</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Programs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="p-6 border border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
            <div className="space-y-4">
              {/* Program Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getTypeIcon(program.type)}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{program.type}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    program.status === "Active"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}>
                    {program.status}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{program.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {program.description}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(program.difficulty)}`}>
                  {program.difficulty}
                </span>
                {program.sessionsPerWeek > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                    {program.sessionsPerWeek}x/week
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">{program.duration}</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">{program.activeClients}</div>
                    <div className="text-xs text-muted-foreground">Clients</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button variant="outline" className="flex-1 gap-2" size="sm">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Created Date */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                Created: {new Date(program.createdDate).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No programs found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}

export default function CoachProgramsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachProgramsContent />
    </ProtectedRoute>
  );
}
