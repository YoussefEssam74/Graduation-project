'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Calendar,
  Dumbbell,
  TrendingUp,
  Apple,
  Brain,
  Clock,
  Target,
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/hooks/useAuth';
import { MemberStats, ActivityItem } from '@/types';
import { statsApi } from '@/lib/api/services';

// Default/fallback stats while loading
const DEFAULT_STATS: MemberStats = {
  currentWeight: 0,
  bodyFatPercentage: 0,
  muscleMass: 0,
  bmi: 0,
  tokenBalance: 0,
  activeWorkoutPlans: 0,
  activeNutritionPlans: 0,
  upcomingBookings: 0,
  completedWorkouts: 0,
  totalCaloriesBurned: 0,
};

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'workout',
    title: 'Completed Upper Body Workout',
    description: '6 exercises • 45 minutes • 320 calories',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    type: 'nutrition',
    title: 'Logged Daily Meals',
    description: '2,150 calories • Protein: 145g',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    type: 'ai',
    title: 'AI Recommendation',
    description: 'New workout plan suggested based on your progress',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    type: 'booking',
    title: 'Booking Confirmed',
    description: 'Personal Training Session - Tomorrow 10:00 AM',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function MemberDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<MemberStats>(DEFAULT_STATS);
  const [activities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load real member stats from API when user is available
    const loadData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await statsApi.getMemberStats(user.userId);
        if (res?.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        // Could add toast / logging here
        console.error('Failed to load member stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b4fd4] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Member'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s your fitness journey overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-[#a3e221] rounded-lg">
            <span className="text-sm font-semibold text-gray-900">
              💎 {stats.tokenBalance} Tokens
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Body Weight"
          value={`${stats.currentWeight} kg`}
          icon={Activity}
          color="blue"
          subtitle={`BMI: ${stats.bmi}`}
        />
        <StatsCard
          title="Body Fat"
          value={`${stats.bodyFatPercentage}%`}
          icon={TrendingUp}
          color="lime"
          subtitle={`Muscle: ${stats.muscleMass}kg`}
        />
        <StatsCard
          title="Active Plans"
          value={stats.activeWorkoutPlans + stats.activeNutritionPlans}
          icon={Target}
          color="yellow"
          subtitle={`${stats.activeWorkoutPlans} Workout, ${stats.activeNutritionPlans} Nutrition`}
        />
        <StatsCard
          title="Completed"
          value={stats.completedWorkouts}
          icon={Dumbbell}
          color="red"
          subtitle={`${stats.totalCaloriesBurned} cal burned`}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/member/workouts')}
              className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-[#0b4fd4] hover:bg-blue-50 transition-all"
            >
              <Dumbbell className="h-8 w-8 text-[#0b4fd4] mb-2" />
              <span className="text-sm font-medium text-gray-900">
                Workout Plans
              </span>
            </button>
            <button
              onClick={() => router.push('/member/nutrition')}
              className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-[#a3e221] hover:bg-lime-50 transition-all"
            >
              <Apple className="h-8 w-8 text-[#a3e221] mb-2" />
              <span className="text-sm font-medium text-gray-900">
                Nutrition
              </span>
            </button>
            <button
              onClick={() => router.push('/member/ai-coach')}
              className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <Brain className="h-8 w-8 text-purple-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">
                AI Coach
              </span>
            </button>
            <button
              onClick={() => router.push('/member/bookings')}
              className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <Calendar className="h-8 w-8 text-orange-500 mb-2" />
              <span className="text-sm font-medium text-gray-900">
                Bookings
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s Schedule</CardTitle>
              <Badge variant="default">{stats.upcomingBookings} upcoming</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingBookings === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No sessions scheduled for today</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/member/bookings')}
                  >
                    Book a Session
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex-shrink-0 mt-1">
                      <Clock className="h-5 w-5 text-[#0b4fd4]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          Upper Body Workout
                        </h4>
                        <span className="text-sm text-gray-600">10:00 AM</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Personal Training • Coach Sarah
                      </p>
                      <Badge variant="success" className="mt-2">
                        Confirmed
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          Cardio Session
                        </h4>
                        <span className="text-sm text-gray-600">4:00 PM</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Equipment: Treadmill #3
                      </p>
                      <Badge variant="default" className="mt-2">
                        Confirmed
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/member/bookings')}
                  >
                    View All Bookings
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => {
                const icons = {
                  workout: Dumbbell,
                  nutrition: Apple,
                  ai: Brain,
                  booking: Calendar,
                  inbody: Activity,
                };
                const Icon = icons[activity.type];
                const colors = {
                  workout: 'text-[#0b4fd4] bg-blue-50',
                  nutrition: 'text-[#a3e221] bg-lime-50',
                  ai: 'text-purple-500 bg-purple-50',
                  booking: 'text-orange-500 bg-orange-50',
                  inbody: 'text-green-500 bg-green-50',
                };

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`flex-shrink-0 p-2 rounded-lg ${
                        colors[activity.type]
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Workout Progress
                </span>
                <span className="text-sm text-[#0b4fd4] font-semibold">
                  75%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#0b4fd4] h-2 rounded-full"
                  style={{ width: '75%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                24 of 32 workouts completed this month
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Nutrition Goal
                </span>
                <span className="text-sm text-[#a3e221] font-semibold">
                  92%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#a3e221] h-2 rounded-full"
                  style={{ width: '92%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                On track with your calorie goals
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Body Composition
                </span>
                <span className="text-sm text-green-500 font-semibold">
                  -2.3%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: '65%' }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Body fat reduced since last month
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => router.push('/member/inbody')}
              variant="outline"
              className="flex-1"
            >
              View Detailed Progress
            </Button>
            <Button
              onClick={() => router.push('/member/ai-coach')}
              className="flex-1"
            >
              Get AI Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
