"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Scale,
  Zap,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { inbodyApi, bookingsApi, type InBodyMeasurementDto, type BookingDto } from "@/lib/api";

// Generate dynamic available slots based on current date
const generateAvailableSlots = () => {
  const slots = [];
  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip Sundays
    if (date.getDay() === 0) continue;
    
    const timeSlots = date.getDay() === 6 
      ? ["10:00 AM", "11:00 AM", "12:00 PM"] // Saturday - fewer slots
      : ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];
    
    slots.push({
      id: i,
      date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
      fullDate: date,
      day: dayNames[date.getDay()],
      slots: timeSlots,
    });
  }
  return slots;
};

// Map booking status from number to string
const mapBookingStatus = (status: number): string => {
  switch (status) {
    case 0: return "Pending";
    case 1: return "Confirmed";
    case 2: return "Completed";
    case 3: return "Cancelled";
    default: return "Pending";
  }
};

export default function InBodyPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [availableSlots] = useState(generateAvailableSlots());
  const [selectedDate, setSelectedDate] = useState<typeof availableSlots[0] | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduledBooking, setScheduledBooking] = useState<BookingDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real data from API
  const [isLoading, setIsLoading] = useState(true);
  const [measurements, setMeasurements] = useState<InBodyMeasurementDto[]>([]);
  const [latestMeasurement, setLatestMeasurement] = useState<InBodyMeasurementDto | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const [measurementsRes, latestRes, bookingsRes] = await Promise.all([
          inbodyApi.getUserMeasurements(user.userId),
          inbodyApi.getLatestMeasurement(user.userId),
          bookingsApi.getUserBookings(user.userId),
        ]);

        if (measurementsRes.success && measurementsRes.data) {
          // Sort by date descending
          const sorted = [...measurementsRes.data].sort(
            (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
          );
          setMeasurements(sorted);
        }

        if (latestRes.success && latestRes.data) {
          setLatestMeasurement(latestRes.data);
        } else if (measurementsRes.success && measurementsRes.data?.length > 0) {
          // Fallback to first measurement if latest endpoint fails
          const sorted = [...measurementsRes.data].sort(
            (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
          );
          setLatestMeasurement(sorted[0]);
        }

        // Check for existing InBody booking
        if (bookingsRes.success && bookingsRes.data) {
          const inbodyBooking = bookingsRes.data.find(
            b => b.bookingType === "InBody" && (b.status === 0 || b.status === 1) // Pending or Confirmed
          );
          if (inbodyBooking) {
            setScheduledBooking(inbodyBooking);
          }
        }
      } catch (error) {
        console.error("Failed to fetch InBody data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.userId]);

  const handleOpenScheduleModal = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setIsScheduleModalOpen(true);
  };

  // Parse time string like "10:00 AM" to hours and minutes
  const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
    const [time, period] = timeStr.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return { hours, minutes };
  };

  const handleConfirmSchedule = async () => {
    if (!selectedDate || !selectedTime || !user?.userId) return;

    setIsSubmitting(true);
    
    try {
      // Create start and end time for the booking
      const { hours, minutes } = parseTimeString(selectedTime);
      const startTime = new Date(selectedDate.fullDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30); // InBody scan takes 30 minutes

      const response = await bookingsApi.createBooking({
        userId: user.userId,
        bookingType: "InBody",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: "InBody body composition scan",
      });

      if (response.success && response.data) {
        setScheduledBooking(response.data);
        setIsScheduleModalOpen(false);
        showToast(`InBody scan scheduled for ${selectedDate.date} at ${selectedTime}. The receptionist will confirm your appointment.`, "success");
      } else {
        showToast(response.message || "Failed to schedule scan. Please try again.", "error");
      }
    } catch {
      showToast("Failed to schedule scan. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!scheduledBooking) return;
    
    setIsSubmitting(true);
    try {
      const response = await bookingsApi.cancelBooking(scheduledBooking.bookingId, "Cancelled by user");
      if (response.success) {
        setScheduledBooking(null);
        showToast("InBody scan appointment cancelled", "success");
      } else {
        showToast(response.message || "Failed to cancel appointment", "error");
      }
    } catch {
      showToast("Failed to cancel appointment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get previous measurement for comparison
  const getPreviousMeasurement = () => {
    if (measurements.length < 2) return null;
    return measurements[1];
  };

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

  const previousMeasurement = getPreviousMeasurement();

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
        <Button size="lg" onClick={handleOpenScheduleModal}>
          <Calendar className="h-5 w-5 mr-2" />
          {scheduledBooking ? "Reschedule Scan" : "Schedule Scan"}
        </Button>
      </div>

      {/* Scheduled Scan Banner */}
      {scheduledBooking && (
        <Card className="p-4 border-2 border-green-500 bg-green-50 dark:bg-green-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">InBody Scan Scheduled</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {new Date(scheduledBooking.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "long" })} at {new Date(scheduledBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {mapBookingStatus(scheduledBooking.status)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelBooking} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenScheduleModal}>
                Reschedule
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* No measurements message */}
      {!latestMeasurement && (
        <Card className="p-12 text-center border border-border bg-card/50">
          <Scale className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-bold mb-2">No Measurements Yet</h3>
          <p className="text-muted-foreground mb-6">
            Schedule your first InBody scan to start tracking your body composition.
          </p>
          <Button size="lg" onClick={handleOpenScheduleModal}>
            <Calendar className="h-5 w-5 mr-2" />
            Schedule Your First Scan
          </Button>
        </Card>
      )}

      {latestMeasurement && (
        <>
          {/* Latest Measurement Summary */}
          <Card className="p-6 border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                <span className="text-foreground">Latest </span>
                <span className="text-primary">Measurement</span>
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(latestMeasurement.measurementDate)}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold mb-1">{latestMeasurement.weight} kg</div>
                <div className="text-sm text-muted-foreground">Weight</div>
                {previousMeasurement && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
                    {getTrendIcon(latestMeasurement.weight, previousMeasurement.weight, false)}
                    <span>{getChangeText(latestMeasurement.weight, previousMeasurement.weight, "kg")}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold mb-1">{latestMeasurement.bodyFatPercentage}%</div>
                <div className="text-sm text-muted-foreground">Body Fat</div>
                {previousMeasurement && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
                    {getTrendIcon(latestMeasurement.bodyFatPercentage, previousMeasurement.bodyFatPercentage, false)}
                    <span>{getChangeText(latestMeasurement.bodyFatPercentage, previousMeasurement.bodyFatPercentage, "%")}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold mb-1">{latestMeasurement.muscleMass} kg</div>
                <div className="text-sm text-muted-foreground">Muscle Mass</div>
                {previousMeasurement && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
                    {getTrendIcon(latestMeasurement.muscleMass, previousMeasurement.muscleMass, true)}
                    <span>{getChangeText(latestMeasurement.muscleMass, previousMeasurement.muscleMass, "kg")}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold mb-1">{latestMeasurement.bmi}</div>
                <div className="text-sm text-muted-foreground">BMI</div>
                {previousMeasurement && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-sm text-green-500">
                    {getTrendIcon(latestMeasurement.bmi, previousMeasurement.bmi, false)}
                    <span>{getChangeText(latestMeasurement.bmi, previousMeasurement.bmi, "")}</span>
                  </div>
                )}
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
                  <span className="font-bold">{latestMeasurement.bodyWaterPercentage || "N/A"}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="text-muted-foreground">Bone Mass</span>
                  <span className="font-bold">{latestMeasurement.boneMass || "N/A"} kg</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="text-muted-foreground">Visceral Fat Level</span>
                  <span className="font-bold">{latestMeasurement.visceralFatLevel || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="text-muted-foreground">Basal Metabolic Rate</span>
                  <span className="font-bold">{latestMeasurement.bmr || "N/A"} kcal</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">
                <span className="text-foreground">Progress </span>
                <span className="text-primary">Insights</span>
              </h3>
              <div className="space-y-4">
                {measurements.length >= 2 ? (
                  <>
                    {/* Calculate changes over time */}
                    {(() => {
                      const oldest = measurements[measurements.length - 1];
                      const latest = measurements[0];
                      const weightChange = latest.weight - oldest.weight;
                      const fatChange = latest.bodyFatPercentage - oldest.bodyFatPercentage;
                      const muscleChange = latest.muscleMass - oldest.muscleMass;
                      
                      return (
                        <>
                          <div className={`p-4 ${weightChange <= 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg`}>
                            <div className="flex items-start gap-3">
                              {weightChange <= 0 ? (
                                <TrendingDown className="h-5 w-5 text-green-600 mt-1" />
                              ) : (
                                <TrendingUp className="h-5 w-5 text-orange-600 mt-1" />
                              )}
                              <div>
                                <div className={`font-semibold ${weightChange <= 0 ? 'text-green-800' : 'text-orange-800'} mb-1`}>
                                  Weight Change
                                </div>
                                <div className={`text-sm ${weightChange <= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg since {formatDate(oldest.measurementDate)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`p-4 ${fatChange <= 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg`}>
                            <div className="flex items-start gap-3">
                              {fatChange <= 0 ? (
                                <TrendingDown className="h-5 w-5 text-green-600 mt-1" />
                              ) : (
                                <TrendingUp className="h-5 w-5 text-orange-600 mt-1" />
                              )}
                              <div>
                                <div className={`font-semibold ${fatChange <= 0 ? 'text-green-800' : 'text-orange-800'} mb-1`}>
                                  Body Fat Change
                                </div>
                                <div className={`text-sm ${fatChange <= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                                  {fatChange > 0 ? '+' : ''}{fatChange.toFixed(1)}% since {formatDate(oldest.measurementDate)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={`p-4 ${muscleChange >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg`}>
                            <div className="flex items-start gap-3">
                              <Activity className={`h-5 w-5 ${muscleChange >= 0 ? 'text-blue-600' : 'text-orange-600'} mt-1`} />
                              <div>
                                <div className={`font-semibold ${muscleChange >= 0 ? 'text-blue-800' : 'text-orange-800'} mb-1`}>
                                  Muscle Mass
                                </div>
                                <div className={`text-sm ${muscleChange >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                  {muscleChange > 0 ? '+' : ''}{muscleChange.toFixed(1)} kg since {formatDate(oldest.measurementDate)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <div className="font-semibold mb-1">Get More Insights</div>
                        <div className="text-sm text-muted-foreground">
                          Schedule more InBody scans to track your progress over time.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <div className="font-semibold mb-1">AI Recommendation</div>
                      <div className="text-sm text-muted-foreground">
                        {latestMeasurement.bodyFatPercentage > 20
                          ? "Focus on cardio and maintain a caloric deficit to reduce body fat."
                          : latestMeasurement.bodyFatPercentage < 15
                          ? "Great body fat level! Consider increasing protein intake to build more muscle."
                          : "You're in a healthy range! Keep up the balanced workout routine."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Measurement History */}
          {measurements.length > 0 && (
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
                        key={measurement.measurementId}
                        className="border-b border-border hover:bg-primary/5 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(measurement.measurementDate)}</span>
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <span className="font-medium">{measurement.weight}</span>
                          {index < measurements.length - 1 && (
                            <span className={`ml-2 text-xs ${
                              measurement.weight < measurements[index + 1].weight
                                ? "text-green-500"
                                : measurement.weight > measurements[index + 1].weight
                                ? "text-red-500"
                                : "text-muted-foreground"
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
                          <span className="font-medium">{measurement.bodyFatPercentage}%</span>
                          {index < measurements.length - 1 && (
                            <span className={`ml-2 text-xs ${
                              measurement.bodyFatPercentage < measurements[index + 1].bodyFatPercentage
                                ? "text-green-500"
                                : measurement.bodyFatPercentage > measurements[index + 1].bodyFatPercentage
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }`}>
                              {getChangeText(
                                measurement.bodyFatPercentage,
                                measurements[index + 1].bodyFatPercentage,
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
                                : measurement.muscleMass < measurements[index + 1].muscleMass
                                ? "text-red-500"
                                : "text-muted-foreground"
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
                                : measurement.bmi > measurements[index + 1].bmi
                                ? "text-red-500"
                                : "text-muted-foreground"
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
          )}
        </>
      )}

      {/* Schedule InBody Scan Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              <span className="text-foreground">Schedule </span>
              <span className="text-primary">InBody Scan</span>
            </DialogTitle>
            <DialogDescription>
              Select a date and time for your InBody scan. The receptionist will confirm your appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Select Date
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedDate(slot);
                      setSelectedTime(null);
                    }}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedDate?.id === slot.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="font-semibold">{slot.date}</div>
                    <div className="text-xs text-muted-foreground">{slot.day}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Select Time
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {selectedDate.slots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedTime === time
                          ? "border-primary bg-primary text-white"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Summary */}
            {selectedDate && selectedTime && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Selected Appointment</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.date} ({selectedDate.day}) at {selectedTime}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSchedule} 
              disabled={!selectedDate || !selectedTime || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Confirm Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
