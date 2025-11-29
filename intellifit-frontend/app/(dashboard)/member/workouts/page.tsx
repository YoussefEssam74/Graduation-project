'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { workoutPlanApi } from '@/lib/api/services';
import { useRouter } from 'next/navigation';
import {
  Dumbbell,
  Calendar,
  Plus,
  Clock,
  Target,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { MemberWorkoutPlan, WorkoutPlanTemplate, PlanSource, WorkoutPlanStatus, ApprovalStatus, DifficultyLevel } from '@/types';

// Mock data
const MOCK_PLANS: MemberWorkoutPlan[] = [
  {
    planInstanceID: 1,
    userID: 1,
    templateID: 1,
    assignedByCoachID: 2,
    startDate: new Date(Date.now() - 604800000).toISOString(),
    endDate: new Date(Date.now() + 5097600000).toISOString(),
    status: WorkoutPlanStatus.Active,
    completedWorkouts: 18,
    planSource: PlanSource.Coach,
    approvalStatus: ApprovalStatus.Approved,
    template: {
      templateID: 1,
      templateName: 'Strength Building Program',
      description: 'Focus on compound movements and progressive overload',
      difficultyLevel: DifficultyLevel.Intermediate,
      durationWeeks: 8,
      workoutsPerWeek: 4,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
  },
  {
    planInstanceID: 2,
    userID: 1,
    generatedByAI_ID: 1,
    startDate: new Date(Date.now() - 1209600000).toISOString(),
    endDate: new Date(Date.now() + 3888000000).toISOString(),
    status: WorkoutPlanStatus.Active,
    completedWorkouts: 6,
    planSource: PlanSource.AI,
    approvalStatus: ApprovalStatus.Pending,
    template: {
      templateID: 2,
      templateName: 'AI Personalized Cardio Plan',
      description: 'Customized cardio workouts based on your goals',
      difficultyLevel: DifficultyLevel.Beginner,
      durationWeeks: 6,
      workoutsPerWeek: 3,
      isPublic: false,
      createdAt: new Date().toISOString(),
    },
  },
];

const MOCK_TEMPLATES: WorkoutPlanTemplate[] = [
  {
    templateID: 3,
    templateName: 'Full Body Blast',
    description: 'Complete full-body workouts for maximum efficiency',
    difficultyLevel: DifficultyLevel.Intermediate,
    durationWeeks: 6,
    workoutsPerWeek: 3,
    isPublic: true,
    createdAt: new Date().toISOString(),
  },
  {
    templateID: 4,
    templateName: 'Athletic Performance',
    description: 'Enhance power, speed, and agility',
    difficultyLevel: DifficultyLevel.Advanced,
    durationWeeks: 12,
    workoutsPerWeek: 5,
    isPublic: true,
    createdAt: new Date().toISOString(),
  },
];

export default function WorkoutsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [myPlans, setMyPlans] = useState<MemberWorkoutPlan[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<WorkoutPlanTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const plansRes = await workoutPlanApi.getMyPlans(user.userId);
        if (plansRes?.success && plansRes.data) setMyPlans(plansRes.data);

        const templatesRes = await workoutPlanApi.getTemplates();
        if (templatesRes?.success && templatesRes.data) setAvailableTemplates(templatesRes.data);
      } catch (err) {
        console.error('Failed to load workout data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b4fd4]"></div>
      </div>
    );
  }

  const activePlans = myPlans.filter((p) => p.status === WorkoutPlanStatus.Active);
  const completedPlans = myPlans.filter((p) => p.status === WorkoutPlanStatus.Completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workout Plans</h1>
          <p className="text-gray-600 mt-1">Manage and track your fitness programs</p>
        </div>
        <Button onClick={() => router.push('/member/ai-coach')}>
          <Plus className="h-4 w-4 mr-2" />
          Request AI Plan
        </Button>
      </div>

      {/* Active Plans */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Plans ({activePlans.length})</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {activePlans.map((plan) => {
            const progress = plan.template
              ? (plan.completedWorkouts / (plan.template.durationWeeks * plan.template.workoutsPerWeek)) * 100
              : 0;

            return (
              <Card key={plan.planInstanceID} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plan.template?.templateName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {plan.template?.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        plan.planSource === PlanSource.AI
                          ? 'default'
                          : plan.planSource === PlanSource.Coach
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {plan.planSource}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-[#0b4fd4]">
                          {plan.template?.durationWeeks}
                        </p>
                        <p className="text-xs text-gray-600">Weeks</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#a3e221]">
                          {plan.template?.workoutsPerWeek}
                        </p>
                        <p className="text-xs text-gray-600">Per Week</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-500">
                          {plan.completedWorkouts}
                        </p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-[#0b4fd4]">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#0b4fd4] h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Started: {new Date(plan.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Ends: {new Date(plan.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Approval Status */}
                    {plan.approvalStatus === ApprovalStatus.Pending && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-xs text-yellow-800">Awaiting coach approval</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Workout
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Available Templates */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse Templates</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {availableTemplates.map((template) => (
            <Card key={template.templateID} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <Dumbbell className="h-8 w-8 text-[#0b4fd4]" />
                  <Badge variant="default">{template.difficultyLevel}</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{template.templateName}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{template.durationWeeks} weeks</span>
                  <span>{template.workoutsPerWeek}x/week</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Preview
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Plans */}
      {completedPlans.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Completed Plans ({completedPlans.length})
          </h2>
          <div className="space-y-3">
            {completedPlans.map((plan) => (
              <Card key={plan.planInstanceID}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {plan.template?.templateName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Completed on {new Date(plan.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Results
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
