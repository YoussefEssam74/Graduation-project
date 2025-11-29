"use client";

import { useState } from "react";
import {
  Dumbbell,
  Search,
  Plus,
  Edit,
  Trash2,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function AdminEquipmentContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const equipment = [
    {
      id: 1,
      name: "Treadmill Pro X1",
      category: "Cardio",
      quantity: 8,
      status: "Operational",
      location: "Cardio Zone A",
      lastMaintenance: "Nov 15, 2025",
      nextMaintenance: "Dec 15, 2025",
      purchaseDate: "Jan 2024",
      warranty: "2 years",
    },
    {
      id: 2,
      name: "Bench Press Station",
      category: "Strength",
      quantity: 6,
      status: "Operational",
      location: "Strength Zone B",
      lastMaintenance: "Nov 20, 2025",
      nextMaintenance: "Dec 20, 2025",
      purchaseDate: "Feb 2024",
      warranty: "3 years",
    },
    {
      id: 3,
      name: "Rowing Machine Elite",
      category: "Cardio",
      quantity: 4,
      status: "Under Maintenance",
      location: "Cardio Zone B",
      lastMaintenance: "Nov 25, 2025",
      nextMaintenance: "Dec 25, 2025",
      purchaseDate: "Mar 2024",
      warranty: "2 years",
    },
    {
      id: 4,
      name: "Power Rack Pro",
      category: "Strength",
      quantity: 5,
      status: "Operational",
      location: "Strength Zone A",
      lastMaintenance: "Nov 10, 2025",
      nextMaintenance: "Dec 10, 2025",
      purchaseDate: "Jan 2024",
      warranty: "5 years",
    },
    {
      id: 5,
      name: "Spin Bike Master",
      category: "Cardio",
      quantity: 12,
      status: "Operational",
      location: "Cycling Studio",
      lastMaintenance: "Nov 22, 2025",
      nextMaintenance: "Dec 22, 2025",
      purchaseDate: "Apr 2024",
      warranty: "2 years",
    },
    {
      id: 6,
      name: "Cable Machine Dual",
      category: "Strength",
      quantity: 3,
      status: "Needs Repair",
      location: "Strength Zone B",
      lastMaintenance: "Oct 15, 2025",
      nextMaintenance: "Overdue",
      purchaseDate: "Dec 2023",
      warranty: "3 years",
    },
    {
      id: 7,
      name: "Olympic Barbell Set",
      category: "Weights",
      quantity: 15,
      status: "Operational",
      location: "Free Weights Area",
      lastMaintenance: "Nov 18, 2025",
      nextMaintenance: "Dec 18, 2025",
      purchaseDate: "Jan 2024",
      warranty: "10 years",
    },
    {
      id: 8,
      name: "Yoga Mat Premium",
      category: "Accessories",
      quantity: 30,
      status: "Operational",
      location: "Yoga Studio",
      lastMaintenance: "Nov 28, 2025",
      nextMaintenance: "Jan 28, 2026",
      purchaseDate: "May 2024",
      warranty: "1 year",
    },
  ];

  const stats = [
    { label: "Total Equipment", value: "86", color: "text-green-500", icon: Package },
    { label: "Operational", value: "78", color: "text-blue-500", icon: CheckCircle },
    { label: "Under Maintenance", value: "6", color: "text-orange-500", icon: Wrench },
    { label: "Needs Repair", value: "2", color: "text-red-500", icon: AlertTriangle },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Operational":
        return "bg-green-100 text-green-700";
      case "Under Maintenance":
        return "bg-orange-100 text-orange-700";
      case "Needs Repair":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Operational":
        return <CheckCircle className="h-4 w-4" />;
      case "Under Maintenance":
        return <Wrench className="h-4 w-4" />;
      case "Needs Repair":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Dumbbell className="h-10 w-10 text-green-500" />
            Equipment Management
          </h1>
          <p className="text-muted-foreground mt-2">Track and manage all gym equipment</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
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
              placeholder="Search equipment..."
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
              variant={statusFilter === "Operational" ? "default" : "outline"}
              onClick={() => setStatusFilter("Operational")}
            >
              Operational
            </Button>
            <Button
              variant={statusFilter === "Under Maintenance" ? "default" : "outline"}
              onClick={() => setStatusFilter("Under Maintenance")}
            >
              Maintenance
            </Button>
            <Button
              variant={statusFilter === "Needs Repair" ? "default" : "outline"}
              onClick={() => setStatusFilter("Needs Repair")}
            >
              Needs Repair
            </Button>
          </div>
        </div>
      </Card>

      {/* Equipment Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className="p-6 border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
              </div>
              <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                {getStatusIcon(item.status)}
                {item.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-semibold">{item.quantity} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold">{item.location}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Maintenance:</span>
                <span className="font-semibold">{item.lastMaintenance}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Maintenance:</span>
                <span className={`font-semibold ${item.nextMaintenance === "Overdue" ? "text-red-600" : ""}`}>
                  {item.nextMaintenance}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Purchase Date:</span>
                <span className="font-semibold">{item.purchaseDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Warranty:</span>
                <span className="font-semibold">{item.warranty}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button size="sm" variant="outline" className="flex-1">
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Wrench className="h-3 w-3 mr-2" />
                Maintain
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminEquipmentPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminEquipmentContent />
    </ProtectedRoute>
  );
}
