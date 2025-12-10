"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Edit,
  Eye,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function ReceptionMembersContent() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for members
  const members = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed.hassan@example.com",
      phone: "+20 123 456 7890",
      membershipType: "Premium",
      status: "Active",
      joinDate: "2024-01-15",
      expiryDate: "2025-01-15",
      lastCheckIn: "2024-11-29",
      avatar: "AH",
    },
    {
      id: 2,
      name: "Sara Mohamed",
      email: "sara.mohamed@example.com",
      phone: "+20 123 456 7891",
      membershipType: "Standard",
      status: "Active",
      joinDate: "2024-02-20",
      expiryDate: "2025-02-20",
      lastCheckIn: "2024-11-28",
      avatar: "SM",
    },
    {
      id: 3,
      name: "Omar Ali",
      email: "omar.ali@example.com",
      phone: "+20 123 456 7892",
      membershipType: "Premium",
      status: "Active",
      joinDate: "2024-03-10",
      expiryDate: "2025-03-10",
      lastCheckIn: "2024-11-29",
      avatar: "OA",
    },
    {
      id: 4,
      name: "Fatma Ibrahim",
      email: "fatma.ibrahim@example.com",
      phone: "+20 123 456 7893",
      membershipType: "Basic",
      status: "Expiring Soon",
      joinDate: "2024-04-05",
      expiryDate: "2024-12-05",
      lastCheckIn: "2024-11-26",
      avatar: "FI",
    },
    {
      id: 5,
      name: "Karim Youssef",
      email: "karim.youssef@example.com",
      phone: "+20 123 456 7894",
      membershipType: "Standard",
      status: "Active",
      joinDate: "2024-05-12",
      expiryDate: "2025-05-12",
      lastCheckIn: "2024-11-29",
      avatar: "KY",
    },
    {
      id: 6,
      name: "Nour Ahmed",
      email: "nour.ahmed@example.com",
      phone: "+20 123 456 7895",
      membershipType: "Premium",
      status: "Inactive",
      joinDate: "2024-06-01",
      expiryDate: "2024-11-01",
      lastCheckIn: "2024-10-28",
      avatar: "NA",
    },
  ];

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500";
      case "Expiring Soon":
        return "bg-yellow-500/10 text-yellow-500";
      case "Inactive":
        return "bg-red-500/10 text-red-500";
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

  const activeMembers = members.filter(m => m.status === "Active").length;
  const expiringMembers = members.filter(m => m.status === "Expiring Soon").length;
  const inactiveMembers = members.filter(m => m.status === "Inactive").length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Members Management</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all gym members
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{members.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Members</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-500">{activeMembers}</div>
              <div className="text-sm text-muted-foreground mt-1">Active Members</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <UserCheck className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-500">{expiringMembers}</div>
              <div className="text-sm text-muted-foreground mt-1">Expiring Soon</div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-500">{inactiveMembers}</div>
              <div className="text-sm text-muted-foreground mt-1">Inactive</div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-full">
              <UserX className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Members Table */}
      <Card className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Member</th>
                <th className="text-left p-4 font-semibold">Contact</th>
                <th className="text-left p-4 font-semibold">Membership</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Join Date</th>
                <th className="text-left p-4 font-semibold">Expiry Date</th>
                <th className="text-left p-4 font-semibold">Last Check-In</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getMembershipColor(member.membershipType)} flex items-center justify-center text-white font-bold text-sm`}>
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-xs text-muted-foreground">ID: #{member.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{member.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getMembershipColor(member.membershipType)}`}>
                      {member.membershipType}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{new Date(member.joinDate).toLocaleDateString()}</td>
                  <td className="p-4 text-sm">{new Date(member.expiryDate).toLocaleDateString()}</td>
                  <td className="p-4 text-sm">{new Date(member.lastCheckIn).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No members found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}

export default function ReceptionMembersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Reception]}>
      <ReceptionMembersContent />
    </ProtectedRoute>
  );
}
