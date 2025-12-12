"use client";

import { useState } from "react";
import {
  UserCheck,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function ReceptionCheckInContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [checkInType, setCheckInType] = useState<"checkin" | "checkout">("checkin");

  // Mock data for today's check-ins
  const checkIns = [
    {
      id: 1,
      memberName: "Ahmed Hassan",
      memberId: "M001",
      membershipType: "Premium",
      checkInTime: "08:30 AM",
      status: "Checked In",
      duration: "2h 15m",
      avatar: "AH",
    },
    {
      id: 2,
      memberName: "Sara Mohamed",
      memberId: "M002",
      membershipType: "Standard",
      checkInTime: "09:15 AM",
      status: "Checked In",
      duration: "1h 30m",
      avatar: "SM",
    },
    {
      id: 3,
      memberName: "Omar Ali",
      memberId: "M003",
      membershipType: "Premium",
      checkInTime: "07:45 AM",
      status: "Checked Out",
      duration: "3h 00m",
      avatar: "OA",
    },
    {
      id: 4,
      memberName: "Fatma Ibrahim",
      memberId: "M004",
      membershipType: "Basic",
      checkInTime: "10:00 AM",
      status: "Checked In",
      duration: "45m",
      avatar: "FI",
    },
    {
      id: 5,
      memberName: "Karim Youssef",
      memberId: "M005",
      membershipType: "Standard",
      checkInTime: "08:00 AM",
      status: "Checked Out",
      duration: "2h 45m",
      avatar: "KY",
    },
    {
      id: 6,
      memberName: "Nour Ahmed",
      memberId: "M006",
      membershipType: "Premium",
      checkInTime: "09:30 AM",
      status: "Checked In",
      duration: "1h 15m",
      avatar: "NA",
    },
  ];

  const filteredCheckIns = checkIns.filter((checkIn) =>
    checkIn.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    checkIn.memberId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentlyCheckedIn = checkIns.filter(c => c.status === "Checked In").length;
  const checkedOut = checkIns.filter(c => c.status === "Checked Out").length;
  const totalToday = checkIns.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Checked In":
        return "bg-green-500/10 text-green-500";
      case "Checked Out":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "Premium":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "Standard":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      case "Basic":
        return "bg-gradient-to-r from-gray-500 to-gray-600";
      default:
        return "bg-gradient-to-r from-primary to-primary/50";
    }
  };

  const handleCheckIn = () => {
    // Placeholder for check-in logic
    alert("Check-in functionality would be implemented here");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Member Check-In</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage member check-ins and check-outs
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
          <Activity className="h-5 w-5 text-white" />
          <div className="text-white">
            <div className="text-2xl font-bold">{currentlyCheckedIn}</div>
            <div className="text-xs opacity-90">Currently Inside</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{totalToday}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Today</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-500">{currentlyCheckedIn}</div>
              <div className="text-sm text-muted-foreground mt-1">Checked In</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <UserCheck className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-500">{checkedOut}</div>
              <div className="text-sm text-muted-foreground mt-1">Checked Out</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-500">2h 15m</div>
              <div className="text-sm text-muted-foreground mt-1">Avg Duration</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-full">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Check-In */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">Quick Check-In/Out</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan card or enter member ID..."
                className="pl-10 text-lg h-12"
              />
            </div>
          </div>
          <Button className="gap-2 h-12 px-8" onClick={handleCheckIn}>
            <UserCheck className="h-5 w-5" />
            Check In
          </Button>
          <Button variant="outline" className="gap-2 h-12 px-8">
            <CheckCircle className="h-5 w-5" />
            Check Out
          </Button>
        </div>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by member name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={checkInType === "checkin" ? "default" : "outline"}
            onClick={() => setCheckInType("checkin")}
            size="sm"
          >
            Checked In
          </Button>
          <Button
            variant={checkInType === "checkout" ? "default" : "outline"}
            onClick={() => setCheckInType("checkout")}
            size="sm"
          >
            Checked Out
          </Button>
        </div>
      </div>

      {/* Today's Activity */}
      <Card className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Today's Activity
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Member</th>
                <th className="text-left p-4 font-semibold">Member ID</th>
                <th className="text-left p-4 font-semibold">Membership</th>
                <th className="text-left p-4 font-semibold">Check-In Time</th>
                <th className="text-left p-4 font-semibold">Duration</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCheckIns.map((checkIn) => (
                <tr key={checkIn.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getMembershipColor(checkIn.membershipType)} flex items-center justify-center text-white font-bold text-sm`}>
                        {checkIn.avatar}
                      </div>
                      <span className="font-semibold">{checkIn.memberName}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm">{checkIn.memberId}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getMembershipColor(checkIn.membershipType)}`}>
                      {checkIn.membershipType}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {checkIn.checkInTime}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold">{checkIn.duration}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(checkIn.status)}`}>
                      {checkIn.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {checkIn.status === "Checked In" ? (
                        <Button size="sm" variant="outline" className="text-blue-500">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-green-500">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Check In Again
                        </Button>
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
      {filteredCheckIns.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No check-ins found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}

export default function ReceptionCheckInPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionCheckInContent />
    </ProtectedRoute>
  );
}
