"use client";

import { useState, useEffect } from "react";
import {
  UserCog,
  Search,
  Star,
  Users,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { usersApi, type CoachDto } from "@/lib/api/users";
import Link from "next/link";

function AdminCoachesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [coaches, setCoaches] = useState<CoachDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getCoachesWithProfiles(true);
      if (response.success && response.data) {
        setCoaches(response.data);
      } else {
        setError(response.errors?.[0] || "Failed to load coaches");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while loading coaches");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const total = coaches.length;
    const active = coaches.filter(c => c.isAvailable).length;
    const avgRating = total > 0 
      ? (coaches.reduce((acc, c) => acc + (c.rating || 0), 0) / total).toFixed(1) 
      : "0.0";
    const totalClients = coaches.reduce((acc, c) => acc + (c.totalClients || 0), 0);

    return [
      { label: "Total Coaches", value: total.toString(), color: "text-purple-500", icon: UserCog },
      { label: "Available/Active", value: active.toString(), color: "text-green-500", icon: CheckCircle },
      { label: "Avg Rating", value: avgRating, color: "text-yellow-500", icon: Star },
      { label: "Total Clients", value: totalClients.toString(), color: "text-blue-500", icon: Users },
    ];
  };

  const stats = getStats();

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700";
  };

  const filteredCoaches = coaches.filter((coach) => {
    const name = coach.name || "";
    const email = coach.email || "";
    const spec = coach.specialization || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           spec.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <UserCog className="h-10 w-10 text-purple-500" />
            Manage Coaches
          </h1>
          <p className="text-muted-foreground mt-2">View and manage all gym coaches</p>
        </div>
        <Link href="/admin-users">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <UserCog className="h-4 w-4 mr-2" />
            Create New Staff
          </Button>
        </Link>
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

      {/* Search */}
      <Card className="p-6 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2 text-lg">Loading coaches...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-8 border border-red-200 bg-red-50">
          <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Failed to Load Coaches
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={fetchCoaches}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && coaches.length === 0 && (
        <Card className="p-8 border border-border text-center">
          <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Coaches Found</h3>
          <p className="text-muted-foreground mb-4">Create coach accounts via Create Staff.</p>
          <Link href="/admin-users">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Go to Create Staff
            </Button>
          </Link>
        </Card>
      )}

      {/* Coaches Grid */}
      {!loading && !error && filteredCoaches.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => (
            <Card key={coach.userId} className="p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{coach.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{coach.specialization || "General Trainer"}</p>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(coach.isAvailable)}`}>
                    {coach.isAvailable ? "Available" : "Not Available"}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                  <span className="font-semibold text-yellow-700">{(coach.rating || 0).toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Clients:</span>
                  <span className="font-semibold">{coach.totalClients || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <span className="text-muted-foreground">Reviews:</span>
                  <span className="font-semibold">{coach.totalReviews || 0} reviews</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-semibold">{coach.hourlyRate || 0} EGP/hr</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">Experience:</span>
                  <span className="font-semibold">{coach.experienceYears || 0} years</span>
                </div>
              </div>

              {coach.certifications && coach.certifications.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-semibold">Certifications</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coach.certifications.map((cert, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">
                  <div>{coach.email}</div>
                  <div>{coach.phone || "No phone number"}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCoachesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <AdminCoachesContent />
    </ProtectedRoute>
  );
}
