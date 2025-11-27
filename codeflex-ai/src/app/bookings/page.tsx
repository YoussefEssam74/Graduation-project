"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Dumbbell,
  User,
  CheckCircle,
  XCircle,
  Zap,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data - will be replaced with Convex queries
  const mockEquipment = [
    {
      id: 1,
      name: "Bench Press",
      category: "strength",
      status: "available",
      location: "Zone A",
      tokensCost: 10,
      nextAvailable: null,
    },
    {
      id: 2,
      name: "Treadmill #3",
      category: "cardio",
      status: "available",
      location: "Zone B",
      tokensCost: 5,
      nextAvailable: null,
    },
    {
      id: 3,
      name: "Squat Rack",
      category: "strength",
      status: "in_use",
      location: "Zone A",
      tokensCost: 10,
      nextAvailable: "11:00 AM",
    },
    {
      id: 4,
      name: "Cable Machine",
      category: "strength",
      status: "available",
      location: "Zone A",
      tokensCost: 8,
      nextAvailable: null,
    },
    {
      id: 5,
      name: "Rowing Machine",
      category: "cardio",
      status: "maintenance",
      location: "Zone B",
      tokensCost: 5,
      nextAvailable: "Tomorrow",
    },
    {
      id: 6,
      name: "Leg Press",
      category: "strength",
      status: "available",
      location: "Zone A",
      tokensCost: 8,
      nextAvailable: null,
    },
  ];

  const mockCoaches = [
    {
      id: 1,
      name: "Ahmed Hassan",
      specialization: "Strength & Conditioning",
      rating: 4.9,
      sessionsCompleted: 250,
      tokensCost: 30,
      availability: "Today 2:00 PM",
    },
    {
      id: 2,
      name: "Sara Mohamed",
      specialization: "HIIT & Cardio",
      rating: 4.8,
      sessionsCompleted: 180,
      tokensCost: 25,
      availability: "Tomorrow 10:00 AM",
    },
    {
      id: 3,
      name: "Omar Ali",
      specialization: "Bodybuilding",
      rating: 5.0,
      sessionsCompleted: 320,
      tokensCost: 35,
      availability: "Today 4:00 PM",
    },
  ];

  const upcomingBookings = [
    {
      id: 1,
      type: "equipment",
      name: "Bench Press",
      date: "Tomorrow",
      time: "10:00 AM - 11:00 AM",
      status: "confirmed",
      tokensCost: 10,
    },
    {
      id: 2,
      type: "coach",
      name: "Ahmed Hassan",
      date: "Dec 28, 2024",
      time: "2:00 PM - 3:00 PM",
      status: "confirmed",
      tokensCost: 30,
    },
    {
      id: 3,
      type: "equipment",
      name: "Treadmill #5",
      date: "Today",
      time: "6:00 PM - 7:00 PM",
      status: "pending",
      tokensCost: 5,
    },
  ];

  const pastBookings = [
    {
      id: 4,
      type: "equipment",
      name: "Squat Rack",
      date: "Dec 24, 2024",
      time: "10:00 AM - 11:00 AM",
      status: "completed",
      tokensCost: 10,
    },
    {
      id: 5,
      type: "coach",
      name: "Sara Mohamed",
      date: "Dec 22, 2024",
      time: "3:00 PM - 4:00 PM",
      status: "completed",
      tokensCost: 25,
    },
    {
      id: 6,
      type: "equipment",
      name: "Cable Machine",
      date: "Dec 20, 2024",
      time: "5:00 PM - 6:00 PM",
      status: "cancelled",
      tokensCost: 0,
    },
  ];

  const filteredEquipment = mockEquipment.filter((equipment) => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || equipment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      available: {
        text: "Available",
        color: "bg-green-100 text-green-700 border-green-300",
      },
      in_use: {
        text: "In Use",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      },
      maintenance: {
        text: "Maintenance",
        color: "bg-red-100 text-red-700 border-red-300",
      },
      confirmed: {
        text: "Confirmed",
        color: "bg-blue-100 text-blue-700 border-blue-300",
      },
      pending: {
        text: "Pending",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      },
      completed: {
        text: "Completed",
        color: "bg-green-100 text-green-700 border-green-300",
      },
      cancelled: {
        text: "Cancelled",
        color: "bg-red-100 text-red-700 border-red-300",
      },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">
          <span className="text-foreground">Book </span>
          <span className="text-primary">Equipment & Coaches</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Reserve equipment or schedule coaching sessions
        </p>
      </div>

      {/* My Bookings Section */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4">
          <span className="text-foreground">My </span>
          <span className="text-primary">Bookings</span>
        </h2>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              Past
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    {booking.type === "equipment" ? (
                      <Dumbbell className="h-6 w-6 text-primary" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold">{booking.name}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" />
                        {booking.tokensCost} tokens
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(booking.status)}
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-6">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-card rounded-lg border border-border flex items-center justify-between opacity-75"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-full">
                    {booking.type === "equipment" ? (
                      <Dumbbell className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <User className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold">{booking.name}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {booking.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.time}
                      </span>
                      {booking.tokensCost > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {booking.tokensCost} tokens
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Browse Equipment */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          <span className="text-foreground">Browse </span>
          <span className="text-primary">Equipment</span>
        </h2>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "strength" ? "default" : "outline"}
              onClick={() => setSelectedCategory("strength")}
            >
              Strength
            </Button>
            <Button
              variant={selectedCategory === "cardio" ? "default" : "outline"}
              onClick={() => setSelectedCategory("cardio")}
            >
              Cardio
            </Button>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {filteredEquipment.map((equipment) => (
            <Card
              key={equipment.id}
              className="p-6 border border-border bg-card/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                {getStatusBadge(equipment.status)}
              </div>
              <h3 className="font-bold text-lg mb-2">{equipment.name}</h3>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium text-foreground">{equipment.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <Zap className="h-3 w-3" />
                    {equipment.tokensCost} tokens/hour
                  </span>
                </div>
                {equipment.nextAvailable && (
                  <div className="flex justify-between">
                    <span>Next Available:</span>
                    <span className="font-medium text-foreground">
                      {equipment.nextAvailable}
                    </span>
                  </div>
                )}
              </div>
              <Button
                className="w-full"
                disabled={equipment.status !== "available"}
              >
                {equipment.status === "available" ? "Book Now" : "Unavailable"}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Browse Coaches */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          <span className="text-foreground">Browse </span>
          <span className="text-primary">Coaches</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {mockCoaches.map((coach) => (
            <Card
              key={coach.id}
              className="p-6 border border-border bg-card/50 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{coach.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {coach.specialization}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="font-medium">⭐ {coach.rating}/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="font-medium">{coach.sessionsCompleted}+ completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <Zap className="h-3 w-3" />
                    {coach.tokensCost} tokens/session
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Available:</span>
                  <span className="font-medium text-green-600">{coach.availability}</span>
                </div>
              </div>

              <Button className="w-full">Book Session</Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
