"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Dumbbell, MapPin, Check, Activity } from "lucide-react";
import { equipmentApi, type EquipmentDto, type MuscleDto } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useToast } from "@/components/ui/toast";

// Simple Checkbox component
const Checkbox = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: () => void;
}) => (
  <button
    type="button"
    onClick={onCheckedChange}
    className={`h-4 w-4 rounded border flex items-center justify-center ${
      checked ? "bg-primary border-primary" : "border-muted-foreground"
    }`}
  >
    {checked && <Check className="h-3 w-3 text-primary-foreground" />}
  </button>
);

// Simple Skeleton component
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} />
);

// Simple Badge component
const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
  className?: string;
}) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default function EquipmentBrowsePage() {
  const { showToast } = useToast();

  // Data states
  const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
  const [muscles, setMuscles] = useState<MuscleDto[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMuscles, setLoadingMuscles] = useState(true);

  // Load muscles
  useEffect(() => {
    const loadMuscles = async () => {
      setLoadingMuscles(true);
      try {
        const response = await equipmentApi.getMuscles();
        if (response.success && response.data) {
          setMuscles(response.data);
        }
      } catch (error) {
        console.error("Failed to load muscles:", error);
      } finally {
        setLoadingMuscles(false);
      }
    };

    loadMuscles();
  }, []);

  // Load equipment
  useEffect(() => {
    const loadEquipment = async () => {
      setLoading(true);
      try {
        let response;
        if (selectedMuscle) {
          response = await equipmentApi.getEquipmentByMuscle(selectedMuscle);
        } else {
          response = await equipmentApi.getAllEquipment();
        }

        if (response.success && response.data) {
          setEquipment(response.data);
        }
      } catch (error) {
        console.error("Failed to load equipment:", error);
        showToast("Failed to load equipment", "error");
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [selectedMuscle, showToast]);

  // Filter by search term
  const filteredEquipment = equipment.filter((eq) =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMuscle = (muscleId: number) => {
    setSelectedMuscle(selectedMuscle === muscleId ? null : muscleId);
  };

  const clearFilters = () => {
    setSelectedMuscle(null);
    setSearchTerm("");
  };

  const hasActiveFilters = selectedMuscle !== null || searchTerm.length > 0;

  return (
    <ProtectedRoute>
      <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen bg-background">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 space-y-6">
          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Muscle Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Target Muscle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {loadingMuscles ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))
                  ) : (
                    muscles.map((muscle) => (
                      <label
                        key={muscle.muscleId}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded"
                      >
                        <Checkbox
                          checked={selectedMuscle === muscle.muscleId}
                          onCheckedChange={() => toggleMuscle(muscle.muscleId)}
                        />
                        <span className="text-sm">
                          {muscle.nameEn || muscle.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" className="w-full" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Dumbbell className="h-8 w-8" />
              Equipment Browser
            </h1>
            <p className="text-muted-foreground">
              {filteredEquipment.length} equipment items
              {selectedMuscle &&
                ` targeting ${muscles.find((m) => m.muscleId === selectedMuscle)?.nameEn || "selected muscle"}`}
            </p>
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEquipment.length === 0 ? (
            <Card className="p-12 text-center">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedMuscle
                  ? "No equipment targets the selected muscle"
                  : "Try adjusting your search"}
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEquipment.map((eq) => (
                <Card key={eq.equipmentId} className="hover:shadow-lg transition-shadow">
                  {/* Equipment Image / Category */}
                  <div className="relative h-48 bg-muted rounded-t-lg flex items-center justify-center">
                    <Badge className="absolute top-2 left-2">
                      {eq.category || "Equipment"}
                    </Badge>
                    <Dumbbell className="h-16 w-16 text-muted-foreground" />
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{eq.name}</h3>

                    {/* Location */}
                    {eq.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3" />
                        {eq.location}
                      </div>
                    )}

                    {/* Target Muscles */}
                    {eq.targetMuscles && eq.targetMuscles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Target Muscles:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {eq.targetMuscles.map((muscle) => (
                            <Badge key={muscle.muscleId} variant="secondary">
                              {muscle.nameEn || muscle.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          eq.status === 1
                            ? "text-green-600"
                            : eq.status === 2
                            ? "text-orange-600"
                            : "text-red-600"
                        }`}
                      >
                        {eq.status === 1
                          ? "Available"
                          : eq.status === 2
                          ? "In Use"
                          : "Under Maintenance"}
                      </span>
                      {eq.tokensCost > 0 && (
                        <span className="text-muted-foreground">
                          {eq.tokensCost} tokens/hr
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
