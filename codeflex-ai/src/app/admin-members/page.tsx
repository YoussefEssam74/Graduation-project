"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Crown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function AdminMembersContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const members = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      phone: "+20 123 456 7890",
      membershipType: "Premium",
      status: "Active",
      joinDate: "Jan 15, 2025",
      expiryDate: "Jan 15, 2026",
      lastVisit: "Nov 28, 2025",
    },
    {
      id: 2,
      name: "Sara Mohamed",
      email: "sara@example.com",
      phone: "+20 123 456 7891",
      membershipType: "Basic",
      status: "Active",
      joinDate: "Feb 10, 2025",
      expiryDate: "Aug 10, 2025",
      lastVisit: "Nov 29, 2025",
    },
    {
      id: 3,
      name: "Omar Ali",
      email: "omar@example.com",
      phone: "+20 123 456 7892",
      membershipType: "Premium",
      status: "Expiring Soon",
      joinDate: "Mar 5, 2025",
      expiryDate: "Dec 5, 2025",
      lastVisit: "Nov 27, 2025",
    },
    {
      id: 4,
      name: "Fatma Ibrahim",
      email: "fatma@example.com",
      phone: "+20 123 456 7893",
      membershipType: "VIP",
      status: "Active",
      joinDate: "Jan 20, 2025",
      expiryDate: "Jan 20, 2026",
      lastVisit: "Nov 29, 2025",
    },
    {
      id: 5,
      name: "Mahmoud Khaled",
      email: "mahmoud@example.com",
      phone: "+20 123 456 7894",
      membershipType: "Basic",
      status: "Inactive",
      joinDate: "Jun 1, 2024",
      expiryDate: "Dec 1, 2024",
      lastVisit: "Nov 15, 2025",
    },
    {
      id: 6,
      name: "Nour Ahmed",
      email: "nour@example.com",
      phone: "+20 123 456 7895",
      membershipType: "Premium",
      status: "Active",
      joinDate: "Apr 12, 2025",
      expiryDate: "Apr 12, 2026",
      lastVisit: "Nov 28, 2025",
    },
  ];

  const stats = [
    { label: "Total Members", value: "342", color: "text-blue-500", icon: Users },
    { label: "Active Members", value: "298", color: "text-green-500", icon: CheckCircle },
    { label: "Expiring Soon", value: "28", color: "text-orange-500", icon: XCircle },
    { label: "Inactive Members", value: "16", color: "text-red-500", icon: Ban },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Expiring Soon":
        return "bg-orange-100 text-orange-700";
      case "Inactive":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "VIP":
        return "bg-purple-100 text-purple-700";
      case "Premium":
        return "bg-blue-100 text-blue-700";
      case "Basic":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Users className="h-10 w-10 text-blue-500" />
            Manage Members
          </h1>
          <p className="text-muted-foreground mt-2">View and manage all gym members</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 border border-border">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <Card className="p-6 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "Active" ? "default" : "outline"}
              onClick={() => setStatusFilter("Active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "Expiring Soon" ? "default" : "outline"}
              onClick={() => setStatusFilter("Expiring Soon")}
            >
              Expiring
            </Button>
            <Button
              variant={statusFilter === "Inactive" ? "default" : "outline"}
              onClick={() => setStatusFilter("Inactive")}
            >
              Inactive
            </Button>
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="p-6 border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-semibold">Member</th>
                <th className="text-left py-4 px-4 font-semibold">Contact</th>
                <th className="text-left py-4 px-4 font-semibold">Membership</th>
                <th className="text-left py-4 px-4 font-semibold">Status</th>
                <th className="text-left py-4 px-4 font-semibold">Join Date</th>
                <th className="text-left py-4 px-4 font-semibold">Expiry Date</th>
                <th className="text-left py-4 px-4 font-semibold">Last Visit</th>
                <th className="text-left py-4 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-4 px-4">
                    <div className="font-semibold">{member.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">{member.email}</div>
                    <div className="text-sm text-muted-foreground">{member.phone}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getMembershipColor(member.membershipType)}`}>
                      {member.membershipType}
                      {member.membershipType === "VIP" && <Crown className="inline h-3 w-3 ml-1" />}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">{member.joinDate}</td>
                  <td className="py-4 px-4 text-sm">{member.expiryDate}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{member.lastVisit}</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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

export default function AdminMembersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminMembersContent />
    </ProtectedRoute>
  );
}
