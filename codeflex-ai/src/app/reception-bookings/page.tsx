"use client";

import { useState } from "react";
import {
  Calendar,
  Search,
  Filter,
  Clock,
  User,
  Dumbbell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function ReceptionBookingsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data for bookings
  const bookings = [
    {
      id: 1,
      memberName: "Ahmed Hassan",
      equipment: "Treadmill 01",
      date: "2024-11-29",
      time: "10:00 AM - 11:00 AM",
      status: "Confirmed",
      type: "Equipment",
      createdAt: "2024-11-28",
      avatar: "AH",
    },
    {
      id: 2,
      memberName: "Sara Mohamed",
      equipment: "Squat Rack 02",
      date: "2024-11-29",
      time: "11:00 AM - 12:00 PM",
      status: "Confirmed",
      type: "Equipment",
      createdAt: "2024-11-28",
      avatar: "SM",
    },
    {
      id: 3,
      memberName: "Omar Ali",
      equipment: "Bench Press 01",
      date: "2024-11-29",
      time: "2:00 PM - 3:00 PM",
      status: "Pending",
      type: "Equipment",
      createdAt: "2024-11-29",
      avatar: "OA",
    },
    {
      id: 4,
      memberName: "Fatma Ibrahim",
      equipment: "Coach Session - Ahmed",
      date: "2024-11-30",
      time: "9:00 AM - 10:00 AM",
      status: "Confirmed",
      type: "Coach",
      createdAt: "2024-11-27",
      avatar: "FI",
    },
    {
      id: 5,
      memberName: "Karim Youssef",
      equipment: "Rowing Machine 03",
      date: "2024-11-30",
      time: "3:00 PM - 4:00 PM",
      status: "Confirmed",
      type: "Equipment",
      createdAt: "2024-11-29",
      avatar: "KY",
    },
    {
      id: 6,
      memberName: "Nour Ahmed",
      equipment: "Yoga Room",
      date: "2024-12-01",
      time: "10:00 AM - 11:00 AM",
      status: "Cancelled",
      type: "Room",
      createdAt: "2024-11-26",
      avatar: "NA",
    },
    {
      id: 7,
      memberName: "Mohamed Ali",
      equipment: "Deadlift Platform",
      date: "2024-12-01",
      time: "4:00 PM - 5:00 PM",
      status: "Pending",
      type: "Equipment",
      createdAt: "2024-11-29",
      avatar: "MA",
    },
    {
      id: 8,
      memberName: "Layla Hassan",
      equipment: "Coach Session - Sara",
      date: "2024-12-02",
      time: "11:00 AM - 12:00 PM",
      status: "Confirmed",
      type: "Coach",
      createdAt: "2024-11-28",
      avatar: "LH",
    },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-500/10 text-green-500";
      case "Pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "Cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Equipment":
        return "bg-blue-500/10 text-blue-500";
      case "Coach":
        return "bg-purple-500/10 text-purple-500";
      case "Room":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const confirmedBookings = bookings.filter(b => b.status === "Confirmed").length;
  const pendingBookings = bookings.filter(b => b.status === "Pending").length;
  const cancelledBookings = bookings.filter(b => b.status === "Cancelled").length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Bookings Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all equipment and coach bookings
          </p>
        </div>
        <Button className="gap-2">
          <Calendar className="h-4 w-4" />
          View Calendar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{bookings.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Bookings</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-500">{confirmedBookings}</div>
              <div className="text-sm text-muted-foreground mt-1">Confirmed</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-500">{pendingBookings}</div>
              <div className="text-sm text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-500">{cancelledBookings}</div>
              <div className="text-sm text-muted-foreground mt-1">Cancelled</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-full">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings by member or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === "Confirmed" ? "default" : "outline"}
            onClick={() => setFilterStatus("Confirmed")}
            size="sm"
          >
            Confirmed
          </Button>
          <Button
            variant={filterStatus === "Pending" ? "default" : "outline"}
            onClick={() => setFilterStatus("Pending")}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === "Cancelled" ? "default" : "outline"}
            onClick={() => setFilterStatus("Cancelled")}
            size="sm"
          >
            Cancelled
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">ID</th>
                <th className="text-left p-4 font-semibold">Member</th>
                <th className="text-left p-4 font-semibold">Equipment/Service</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Time</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Created</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-sm">#{booking.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm">
                        {booking.avatar}
                      </div>
                      <span className="font-semibold">{booking.memberName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.equipment}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(booking.type)}`}>
                      {booking.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(booking.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {booking.time}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {booking.status === "Pending" && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-500">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}

export default function ReceptionBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Reception]}>
      <ReceptionBookingsContent />
    </ProtectedRoute>
  );
}
