'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, Dumbbell, DollarSign } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ReceptionStats, Equipment } from '@/types';

// Mock data
const MOCK_STATS: ReceptionStats = {
  todaysCheckIns: 47,
  inBodyTests: 8,
  equipmentIssues: 2,
  paymentsToday: 1850,
};

const MOCK_EQUIPMENT: Equipment[] = [
  { id: 1, name: 'Treadmill #1', category: 'Cardio', status: 'Available' },
  { id: 2, name: 'Bench Press', category: 'Strength', status: 'Occupied' },
  { id: 3, name: 'Rowing Machine', category: 'Cardio', status: 'Available' },
  { id: 4, name: 'Squat Rack', category: 'Strength', status: 'Maintenance' },
  { id: 5, name: 'Elliptical #2', category: 'Cardio', status: 'Available' },
];

export default function ReceptionDashboard() {
  const [stats, setStats] = useState<ReceptionStats | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API delay
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setStats(MOCK_STATS);
      setEquipment(MOCK_EQUIPMENT);
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
        <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
        <p className="text-gray-600">Manage check-ins and gym operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Check-ins"
          value={stats?.todaysCheckIns || 0}
          icon={Users}
          color="blue"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="InBody Tests"
          value={stats?.inBodyTests || 0}
          icon={Activity}
          color="lime"
        />
        <StatsCard
          title="Equipment Issues"
          value={stats?.equipmentIssues || 0}
          icon={Dumbbell}
          color="red"
        />
        <StatsCard
          title="Payments Today"
          value={`$${stats?.paymentsToday || 0}`}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              Check-in data coming soon
            </p>
            <div className="mt-4">
              <Button className="w-full">
                New Check-in
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No equipment data</p>
            ) : (
              <div className="space-y-3">
                {equipment.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                    <Badge 
                      variant={
                        item.status === 'Available' 
                          ? 'success' 
                          : item.status === 'Occupied' 
                          ? 'warning' 
                          : 'danger'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Equipment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending InBody Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled InBody Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No scheduled tests for today
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
