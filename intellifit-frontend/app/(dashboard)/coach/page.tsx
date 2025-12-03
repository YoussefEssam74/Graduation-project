'use client';

import { useEffect, useState } from 'react';
import { Users, ClipboardList, Star, Calendar } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import { CoachStats } from '@/types';

export default function CoachDashboard() {
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Load stats from API
    const loadData = async () => {
      // await statsApi.getCoachStats(user.userId);
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
        <p className="text-gray-600">Manage your clients and training plans</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          icon={Users}
          color="blue"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Plans"
          value={stats?.activePlans || 0}
          icon={ClipboardList}
          color="lime"
        />
        <StatsCard
          title="Upcoming Sessions"
          value={stats?.upcomingSessions || 0}
          icon={Calendar}
          color="yellow"
        />
        <StatsCard
          title="Average Rating"
          value={stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
          icon={Star}
          color="red"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              Client list coming soon
            </p>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Clients
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Training Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              Your training plans will appear here
            </p>
            <div className="mt-4">
              <Button className="w-full">
                Create New Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Session Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No sessions scheduled for today
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
