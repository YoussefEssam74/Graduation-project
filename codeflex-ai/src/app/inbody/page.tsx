"use client";

import { useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Scale,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InBodyPage() {

  // Mock data - will be replaced with Convex queries
  const latestMeasurement = {
    date: "Dec 24, 2024",
    weight: 75.5,
    bodyFatPercentage: 18.2,
    muscleMass: 58.3,
    bmi: 23.8,
    bodyWaterPercentage: 58.5,
    boneMass: 3.2,
    visceralFatLevel: 8,
    bmr: 1650,
  };

  const measurements = [
    {
      date: "Dec 24, 2024",
      weight: 75.5,
      bodyFat: 18.2,
      muscleMass: 58.3,
      bmi: 23.8,
    },
    {
      date: "Dec 17, 2024",
      weight: 76.2,
      bodyFat: 19.1,
      muscleMass: 57.8,
      bmi: 24.0,
    },
    {
      date: "Dec 10, 2024",
      weight: 77.0,
      bodyFat: 20.0,
      muscleMass: 57.2,
      bmi: 24.3,
    },
    {
      date: "Dec 3, 2024",
      weight: 77.8,
      bodyFat: 20.8,
      muscleMass: 56.8,
      bmi: 24.5,
    },
    {
      date: "Nov 26, 2024",
      weight: 78.5,
      bodyFat: 21.5,
      muscleMass: 56.3,
      bmi: 24.8,
    },
  ];

  const getTrendIcon = (current: number, previous: number, higher_is_better: boolean) => {
    if (current === previous) return null;
    const isImproving = higher_is_better
      ? current > previous
      : current < previous;
    return isImproving ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeText = (current: number, previous: number, unit: string) => {
    const diff = current - previous;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(1)}${unit}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">InBody </span>
            <span className="text-primary">Tracking</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your body composition over time
          </p>
        </div>
        <Button size="lg">
          <Calendar className="h-5 w-5 mr-2" />
          Schedule Scan
        </Button>
      </div>

      {/* Latest Measurement Summary */}
      <Card className="p-6 border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <span className="text-foreground">Latest </span>
            <span className="text-primary">Measurement</span>
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{latestMeasurement.date}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">{latestMeasurement.weight} kg</div>
            <div className="text-sm text-muted-foreground">Weight</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
              {getTrendIcon(75.5, 76.2, false)}
              <span>{getChangeText(75.5, 76.2, "kg")}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">{latestMeasurement.bodyFatPercentage}%</div>
            <div className="text-sm text-muted-foreground">Body Fat</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
              {getTrendIcon(18.2, 19.1, false)}
              <span>{getChangeText(18.2, 19.1, "%")}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">{latestMeasurement.muscleMass} kg</div>
            <div className="text-sm text-muted-foreground">Muscle Mass</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
              {getTrendIcon(58.3, 57.8, true)}
              <span>{getChangeText(58.3, 57.8, "kg")}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">{latestMeasurement.bmi}</div>
            <div className="text-sm text-muted-foreground">BMI</div>
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
              {getTrendIcon(23.8, 24.0, false)}
              <span>{getChangeText(23.8, 24.0, "")}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">
            <span className="text-foreground">Body </span>
            <span className="text-primary">Composition</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-muted-foreground">Body Water</span>
              <span className="font-bold">{latestMeasurement.bodyWaterPercentage}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-muted-foreground">Bone Mass</span>
              <span className="font-bold">{latestMeasurement.boneMass} kg</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-muted-foreground">Visceral Fat Level</span>
              <span className="font-bold">{latestMeasurement.visceralFatLevel}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-muted-foreground">Basal Metabolic Rate</span>
              <span className="font-bold">{latestMeasurement.bmr} kcal</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">
            <span className="text-foreground">Progress </span>
            <span className="text-primary">Insights</span>
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <div className="font-semibold text-green-800 mb-1">
                    Great Progress!
                  </div>
                  <div className="text-sm text-green-700">
                    You've lost 3.0 kg and 3.3% body fat in the last month. Your muscle mass increased by 2.0 kg.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-semibold text-blue-800 mb-1">
                    Body Composition
                  </div>
                  <div className="text-sm text-blue-700">
                    Your muscle-to-fat ratio is improving. Keep up the strength training!
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-1" />
                <div>
                  <div className="font-semibold mb-1">AI Recommendation</div>
                  <div className="text-sm text-muted-foreground">
                    Based on your InBody data, consider increasing protein intake to 180g/day to support muscle growth.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Measurement History */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">
          <span className="text-foreground">Measurement </span>
          <span className="text-primary">History</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-center p-3 font-semibold">Weight (kg)</th>
                <th className="text-center p-3 font-semibold">Body Fat (%)</th>
                <th className="text-center p-3 font-semibold">Muscle Mass (kg)</th>
                <th className="text-center p-3 font-semibold">BMI</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement, index) => (
                <tr
                  key={index}
                  className="border-b border-border hover:bg-primary/5 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{measurement.date}</span>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <span className="font-medium">{measurement.weight}</span>
                    {index < measurements.length - 1 && (
                      <span className={`ml-2 text-xs ${
                        measurement.weight < measurements[index + 1].weight
                          ? "text-green-500"
                          : "text-red-500"
                      }`}>
                        {getChangeText(
                          measurement.weight,
                          measurements[index + 1].weight,
                          ""
                        )}
                      </span>
                    )}
                  </td>
                  <td className="text-center p-3">
                    <span className="font-medium">{measurement.bodyFat}%</span>
                    {index < measurements.length - 1 && (
                      <span className={`ml-2 text-xs ${
                        measurement.bodyFat < measurements[index + 1].bodyFat
                          ? "text-green-500"
                          : "text-red-500"
                      }`}>
                        {getChangeText(
                          measurement.bodyFat,
                          measurements[index + 1].bodyFat,
                          ""
                        )}
                      </span>
                    )}
                  </td>
                  <td className="text-center p-3">
                    <span className="font-medium">{measurement.muscleMass}</span>
                    {index < measurements.length - 1 && (
                      <span className={`ml-2 text-xs ${
                        measurement.muscleMass > measurements[index + 1].muscleMass
                          ? "text-green-500"
                          : "text-red-500"
                      }`}>
                        {getChangeText(
                          measurement.muscleMass,
                          measurements[index + 1].muscleMass,
                          ""
                        )}
                      </span>
                    )}
                  </td>
                  <td className="text-center p-3">
                    <span className="font-medium">{measurement.bmi}</span>
                    {index < measurements.length - 1 && (
                      <span className={`ml-2 text-xs ${
                        measurement.bmi < measurements[index + 1].bmi
                          ? "text-green-500"
                          : "text-red-500"
                      }`}>
                        {getChangeText(
                          measurement.bmi,
                          measurements[index + 1].bmi,
                          ""
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
