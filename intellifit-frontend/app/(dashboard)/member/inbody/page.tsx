'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { inBodyApi } from '@/lib/api/services';
import { Activity, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { InBodyMeasurement } from '@/types';

// Mock data
// measurements will be loaded from the API

export default function InBodyPage() {
  const { user } = useAuthStore();
  const [measurements, setMeasurements] = useState<InBodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await inBodyApi.getMyMeasurements(user.userId);
        if (res?.success && res.data) setMeasurements(res.data);
      } catch (err) {
        console.error('Failed loading measurements', err);
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

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];

  const calculateChange = (current: number, prev: number) => {
    const change = ((current - prev) / prev) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
    };
  };

  const weightChange = previous ? calculateChange(latest.weight, previous.weight) : null;
  const fatChange = previous
    ? calculateChange(latest.bodyFatPercentage, previous.bodyFatPercentage)
    : null;
  const muscleChange = previous ? calculateChange(latest.muscleMass, previous.muscleMass) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">InBody Analysis</h1>
          <p className="text-gray-600 mt-1">Track your body composition over time</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Book InBody Test
        </Button>
      </div>

      {/* Latest Measurement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Latest Measurement</CardTitle>
            <span className="text-sm text-gray-600">
              {new Date(latest.measurementDate).toLocaleDateString()}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Activity className="h-8 w-8 text-[#0b4fd4] mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">{latest.weight} kg</p>
              <p className="text-sm text-gray-600 mt-1">Body Weight</p>
              {weightChange && (
                <p
                  className={`text-xs mt-2 flex items-center justify-center gap-1 ${
                    !weightChange.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {!weightChange.isPositive ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {weightChange.value}%
                </p>
              )}
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">{latest.bodyFatPercentage}%</p>
              <p className="text-sm text-gray-600 mt-1">Body Fat</p>
              {fatChange && (
                <p
                  className={`text-xs mt-2 flex items-center justify-center gap-1 ${
                    !fatChange.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {!fatChange.isPositive ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {fatChange.value}%
                </p>
              )}
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">{latest.muscleMass} kg</p>
              <p className="text-sm text-gray-600 mt-1">Muscle Mass</p>
              {muscleChange && (
                <p
                  className={`text-xs mt-2 flex items-center justify-center gap-1 ${
                    muscleChange.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {muscleChange.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {muscleChange.value}%
                </p>
              )}
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900">{latest.bmi}</p>
              <p className="text-sm text-gray-600 mt-1">BMI</p>
              <p className="text-xs text-gray-500 mt-2">
                {latest.bmi < 18.5
                  ? 'Underweight'
                  : latest.bmi < 25
                  ? 'Normal'
                  : latest.bmi < 30
                  ? 'Overweight'
                  : 'Obese'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Body Composition Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">Body Water</span>
                <span className="font-semibold text-gray-900">
                  {latest.bodyWaterPercentage}%
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">Bone Mass</span>
                <span className="font-semibold text-gray-900">{latest.boneMass} kg</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-700">Visceral Fat Level</span>
                <span className="font-semibold text-gray-900">{latest.visceralFatLevel}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-700">Basal Metabolic Rate</span>
                <span className="font-semibold text-gray-900">{latest.bmr} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold text-green-800 mb-2">✅ Great Progress!</p>
                <p className="text-sm text-green-700">
                  You&apos;ve reduced body fat by {measurements.length > 0 ? Math.abs(latest.bodyFatPercentage - measurements[0].bodyFatPercentage).toFixed(1) : '0.0'}% since your first measurement.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-800 mb-2">💪 Muscle Gain</p>
                <p className="text-sm text-blue-700">
                  You&apos;ve gained {measurements.length > 0 ? (latest.muscleMass - measurements[0].muscleMass).toFixed(1) : '0.0'}kg of muscle mass. Keep up the strength training!
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="font-semibold text-orange-800 mb-2">🎯 Recommendation</p>
                <p className="text-sm text-orange-700">
                  Continue your current program. Schedule your next InBody test in 30 days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Measurement History */}
      <Card>
        <CardHeader>
          <CardTitle>Measurement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Weight
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Body Fat %
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Muscle Mass
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    BMI
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    BMR
                  </th>
                </tr>
              </thead>
              <tbody>
                {measurements
                  .slice()
                  .reverse()
                  .map((measurement) => (
                    <tr key={measurement.inBodyID} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(measurement.measurementDate).toLocaleDateString()}
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-900">
                        {measurement.weight} kg
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-900">
                        {measurement.bodyFatPercentage}%
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-900">
                        {measurement.muscleMass} kg
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-900">
                        {measurement.bmi}
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-900">
                        {measurement.bmr} kcal
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
