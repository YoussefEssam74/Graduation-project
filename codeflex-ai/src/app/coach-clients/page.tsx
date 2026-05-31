"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Activity,
  Eye,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, type CoachClientDto } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ClientProgressModal } from "@/components/coach/ClientProgressModal";
import { ClientPlansProgressModal } from "@/components/coach/ClientPlansProgressModal";
import { ChatDialog } from "@/components/Chat/ChatDialog";

function CoachClientsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<CoachClientDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Chat States
  const [selectedClient, setSelectedClient] = useState<CoachClientDto | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [chatMemberId, setChatMemberId] = useState<number | null>(null);
  const [chatMemberName, setChatMemberName] = useState<string>("");

  // Fetch real clients from the new backend endpoint
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.userId) return;

      try {
        setIsLoading(true);
        const response = await usersApi.getCoachClients(user.userId);
        if (response.success && response.data) {
          setClients(response.data);
        } else {
          showToast(response.message || "Failed to load clients", "error");
        }
      } catch (error) {
        console.error("Failed to load coach clients:", error);
        showToast("An error occurred while loading clients.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [user?.userId, showToast]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenProfile = (client: CoachClientDto) => {
    setSelectedClient(client);
    setIsProfileModalOpen(true);
  };

  const handleOpenPlans = (client: CoachClientDto) => {
    setSelectedClient(client);
    setIsPlansModalOpen(true);
  };

  const handleOpenChat = (userId: number, userName: string) => {
    setChatMemberId(userId);
    setChatMemberName(userName);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">My Clients</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your clients' progress
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
          <Users className="h-5 w-5 text-white" />
          <div className="text-white">
            <div className="text-2xl font-bold">
              {isLoading ? "..." : clients.length}
            </div>
            <div className="text-xs opacity-90">Total Clients</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or email..."
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

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your clients...</span>
        </div>
      ) : (
        <>
          {/* Clients Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card
                key={client.userId}
                className="p-6 border border-border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Client Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {client.profileImageUrl ? (
                        <img
                          src={client.profileImageUrl}
                          alt={client.name}
                          className="w-12 h-12 rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                          {getInitials(client.name)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{client.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            client.membershipType?.toLowerCase().includes("premium")
                              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}
                        >
                          {client.membershipType || "Standard"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-primary/70" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-primary/70" />
                      <span>{client.phone || "No phone number"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span>
                        Joined: {new Date(client.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {client.activeProgramsCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Programs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {client.progress}%
                      </div>
                      <div className="text-xs text-muted-foreground">Workout Progress</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-semibold text-foreground">
                        {client.progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all"
                        style={{ width: `${client.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      size="sm"
                      onClick={() => handleOpenProfile(client)}
                    >
                      <Eye className="h-4 w-4" />
                      View Profile
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      size="sm"
                      onClick={() => handleOpenPlans(client)}
                    >
                      <Activity className="h-4 w-4" />
                      Track Progress
                    </Button>
                  </div>
                  {client.lastSessionDate ? (
                    <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                      Last session: {new Date(client.lastSessionDate).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/60 text-center pt-2 border-t border-border italic">
                      No sessions completed yet
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredClients.length === 0 && (
            <div className="text-center py-20 bg-card/40 border border-border border-dashed rounded-xl">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No clients found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search query or check back later
              </p>
            </div>
          )}
        </>
      )}

      {/* Client Detail Progress Modal */}
      {selectedClient && (
        <ClientProgressModal
          client={selectedClient}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedClient(null);
          }}
          onOpenChat={handleOpenChat}
        />
      )}

      {/* Client Active Workout & Nutrition Plans Modal */}
      {selectedClient && (
        <ClientPlansProgressModal
          client={selectedClient}
          isOpen={isPlansModalOpen}
          onClose={() => {
            setIsPlansModalOpen(false);
            setSelectedClient(null);
          }}
        />
      )}

      {/* Chat Dialog overlay */}
      {chatMemberId && chatMemberName && (
        <ChatDialog
          recipientId={chatMemberId}
          recipientName={chatMemberName}
          recipientRole="member"
          onClose={() => {
            setChatMemberId(null);
            setChatMemberName("");
          }}
        />
      )}
    </div>
  );
}

export default function CoachClientsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Coach]}>
      <CoachClientsContent />
    </ProtectedRoute>
  );
}
