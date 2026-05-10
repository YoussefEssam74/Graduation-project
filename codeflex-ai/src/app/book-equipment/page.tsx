"use client";

import { useState, useEffect } from "react";
import {
    Dumbbell,
    Search,
    Filter,
    Clock,
    MapPin,
    Ticket,
    ChevronLeft,
    CheckCircle,
    Loader2,
    X,
    CalendarDays,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { equipmentApi, bookingsApi, type EquipmentDto } from "@/lib/api";
import { apiFetch } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface BookedSlot {
    bookingId: number;
    startTime: string;
    endTime: string;
    isCoachSession: boolean;
    bookedByUserName?: string;
}

interface EquipmentWithDetails extends EquipmentDto {
    category: string;
    location: string;
    tokensCost: number;
    imageUrl?: string;
}

// Equipment images for gym vibe
const equipmentImages: Record<string, string> = {
    "treadmill": "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80",
    "bench press": "https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=800&q=80",
    "squat rack": "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=800&q=80",
    "leg press": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    "cable machine": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80",
    "dumbbells": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
    "rowing machine": "https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=800&q=80",
    "elliptical": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    "default": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
};

const getEquipmentImage = (name: string): string => {
    const lowerName = name.toLowerCase();
    for (const [key, url] of Object.entries(equipmentImages)) {
        if (lowerName.includes(key)) return url;
    }
    return equipmentImages.default;
};

const mapEquipmentStatus = (status: number): "available" | "in_use" | "maintenance" => {
    switch (status) {
        case 0: return "available";
        case 1: return "in_use";
        case 2: return "maintenance";
        default: return "available";
    }
};

function BookEquipmentContent() {
    const { user, deductTokens, refreshUser } = useAuth();
    const { showToast } = useToast();

    const [equipment, setEquipment] = useState<EquipmentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Booking modal state
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithDetails | null>(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(60);
    const [bookingDate, setBookingDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isBooking, setIsBooking] = useState(false);
    // Sequential booking state
    const [lastBookingEndTime, setLastBookingEndTime] = useState("");
    const [lastBookingDate, setLastBookingDate] = useState("");
    const [selectedRestTime, setSelectedRestTime] = useState(5);

    // Coach session blocking state
    const [isCheckingCoachSession, setIsCheckingCoachSession] = useState(false);
    const [hasCoachSession, setHasCoachSession] = useState(false);
    const [coachSessionMessage, setCoachSessionMessage] = useState("");

    // User equipment bookings: equipmentId -> bookingId (for Cancel button)
    const [userEquipmentBookings, setUserEquipmentBookings] = useState<Map<number, number>>(new Map());
    // Time ranges for in-use equipment: equipmentId -> {start, end}
    const [equipmentBookingTimes, setEquipmentBookingTimes] = useState<Map<number, { start: string; end: string }>>(new Map());

    // Availability grid state
    const [showingAvailabilityId, setShowingAvailabilityId] = useState<number | null>(null);
    const [availabilityData, setAvailabilityData] = useState<Map<number, BookedSlot[]>>(new Map());
    const [availabilityDate, setAvailabilityDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    // Duration options
    const durationOptions = [
        { value: 30, label: "30 minutes" },
        { value: 45, label: "45 minutes" },
        { value: 60, label: "1 hour" },
        { value: 90, label: "1.5 hours" },
    ];

    // Rest time options between sequential equipment bookings
    const restOptions = [
        { value: 3, label: "3 min" },
        { value: 5, label: "5 min" },
        { value: 10, label: "10 min" },
    ];

    // Fetch equipment
    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                setIsLoading(true);
                const response = await equipmentApi.getAllEquipment();

                if (response.success && response.data) {
                    const mappedEquipment = response.data.map((eq: EquipmentDto) => ({
                        ...eq,
                        category: (eq.categoryName || eq.category || "strength").toLowerCase(),
                        location: eq.location || "Main Floor",
                        tokensCost: eq.tokensCostPerHour || eq.tokensCost || 5,
                        imageUrl: getEquipmentImage(eq.name),
                    }));
                    setEquipment(mappedEquipment);
                }
            } catch (error) {
                console.error("Failed to fetch equipment:", error);
                showToast("Failed to load equipment", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEquipment();
    }, [showToast]);

    // Fetch user's active equipment bookings (for Cancel button + time range display)
    useEffect(() => {
        if (!user?.userId) return;
        const fetchUserEquipmentBookings = async () => {
            try {
                const response = await bookingsApi.getUserBookings(user.userId);
                if (response.success && response.data) {
                    const now = new Date();
                    const bookingMap = new Map<number, number>();
                    const timeMap = new Map<number, { start: string; end: string }>();
                    response.data.forEach(b => {
                        if (b.equipmentId && b.status !== 2 && new Date(b.endTime) > now) {
                            bookingMap.set(b.equipmentId, b.bookingId);
                            timeMap.set(b.equipmentId, {
                                start: new Date(b.startTime).toTimeString().slice(0, 5),
                                end: new Date(b.endTime).toTimeString().slice(0, 5),
                            });
                        }
                    });
                    setUserEquipmentBookings(bookingMap);
                    setEquipmentBookingTimes(timeMap);
                }
            } catch (error) {
                console.error("Failed to fetch user equipment bookings:", error);
            }
        };
        fetchUserEquipmentBookings();
    }, [user?.userId]);

    // Filter equipment
    const filteredEquipment = equipment.filter(eq => {
        const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || eq.category === filterCategory;
        const status = mapEquipmentStatus(eq.status);
        const matchesStatus = filterStatus === "all" || status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Get unique categories
    const categories = [...new Set(equipment.map(eq => eq.category))];

    // Check if user has a coach session for selected time slot
    const checkCoachSessionForTimeSlot = async (date: string, start: string, end: string) => {
        if (!user?.userId || !date || !start || !end) return;

        try {
            setIsCheckingCoachSession(true);
            const startDateTime = `${date}T${start}:00`;
            const endDateTime = `${date}T${end}:00`;

            const response = await bookingsApi.checkUserHasCoachBooking(
                user.userId,
                startDateTime,
                endDateTime
            );

            if (response.success && response.data) {
                setHasCoachSession(response.data.hasCoachBooking);
                setCoachSessionMessage(response.data.message);
            }
        } catch (error) {
            console.error("Error checking coach session:", error);
        } finally {
            setIsCheckingCoachSession(false);
        }
    };

    // Effect to check coach session when time slot changes
    useEffect(() => {
        if (bookingModalOpen && bookingDate && startTime && endTime) {
            checkCoachSessionForTimeSlot(bookingDate, startTime, endTime);
        }
    }, [bookingDate, startTime, endTime, bookingModalOpen]);

    // Auto-compute endTime whenever startTime or selectedDuration changes
    useEffect(() => {
        if (startTime) {
            const [h, m] = startTime.split(":").map(Number);
            const totalMins = h * 60 + m + selectedDuration;
            const endH = Math.floor(totalMins / 60) % 24;
            const endM = totalMins % 60;
            setEndTime(`${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
        }
    }, [startTime, selectedDuration]);

    // When rest time changes and there's a previous booking, recompute start time
    useEffect(() => {
        if (lastBookingEndTime && bookingModalOpen) {
            const [h, m] = lastBookingEndTime.split(":").map(Number);
            const totalMins = h * 60 + m + selectedRestTime;
            const startH = Math.floor(totalMins / 60) % 24;
            const startM = totalMins % 60;
            setStartTime(`${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`);
        }
    }, [lastBookingEndTime, selectedRestTime, bookingModalOpen]);

    const handleBookEquipment = async () => {
        if (!selectedEquipment || !user?.userId) return;

        // Validate date and time inputs
        if (!bookingDate || !startTime || !endTime) {
            showToast("Please select booking date, start time, and end time", "error");
            return;
        }

        // Check if user has active coach session
        if (hasCoachSession) {
            showToast("You cannot book equipment during your coach session. Equipment is automatically booked based on your workout plan.", "error");
            return;
        }

        const cost = selectedEquipment.tokensCost;
        if ((user.tokenBalance ?? 0) < cost) {
            showToast("Insufficient tokens", "error");
            return;
        }

        // Create booking times from user input
        const bookingStartTime = new Date(`${bookingDate}T${startTime}:00`);
        const bookingEndTime = new Date(`${bookingDate}T${endTime}:00`);

        // Validate times
        if (bookingStartTime >= bookingEndTime) {
            showToast("End time must be after start time", "error");
            return;
        }

        if (bookingStartTime < new Date()) {
            showToast("Cannot book in the past", "error");
            return;
        }

        try {
            setIsBooking(true);
            const response = await bookingsApi.createBooking({
                userId: user.userId,
                equipmentId: selectedEquipment.equipmentId,
                bookingType: "Equipment",
                startTime: `${bookingDate}T${startTime}:00`,
                endTime: `${bookingDate}T${endTime}:00`,
                notes: `Booked ${selectedEquipment.name} from ${startTime} to ${endTime}`,
            });

            if (response.success) {
                // Store end time for next sequential booking
                setLastBookingEndTime(endTime);
                setLastBookingDate(bookingDate);

                // Track booking for cancel button and time range display
                if (response.data?.bookingId) {
                    setUserEquipmentBookings(prev => new Map(prev).set(selectedEquipment.equipmentId, response.data!.bookingId));
                    setEquipmentBookingTimes(prev => new Map(prev).set(selectedEquipment.equipmentId, { start: startTime, end: endTime }));
                }

                deductTokens(cost);
                if (refreshUser) await refreshUser();

                // Update equipment status
                setEquipment(prev => prev.map(eq =>
                    eq.equipmentId === selectedEquipment.equipmentId
                        ? { ...eq, status: 1 }
                        : eq
                ));

                showToast(`Booked ${selectedEquipment.name} — ${cost} tokens`, "success");
                setBookingModalOpen(false);
            } else {
                // Check if error is about coach session
                if (response.message?.toLowerCase().includes("coach session")) {
                    setHasCoachSession(true);
                    setCoachSessionMessage(response.message);
                }
                showToast(response.message || "Failed to book", "error");
            }
        } catch (error) {
            console.error("Booking error:", error);
            showToast("Failed to book equipment", "error");
        } finally {
            setIsBooking(false);
        }
    };

    const fetchEquipmentAvailability = async (equipmentId: number, date: string) => {
        setLoadingAvailability(true);
        try {
            const response = await apiFetch<{
                equipmentId: number;
                startDate: string;
                endDate: string;
                bookedSlots: BookedSlot[];
            }>(`/equipment-availability/${equipmentId}/booked?startDate=${date}T00:00:00&endDate=${date}T23:59:59`);
            const slots: BookedSlot[] = response.data?.bookedSlots ?? [];
            setAvailabilityData(prev => new Map(prev).set(equipmentId, slots));
        } catch (err) {
            console.error("Failed to load availability:", err);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const toggleAvailability = (equipmentId: number) => {
        if (showingAvailabilityId === equipmentId) {
            setShowingAvailabilityId(null);
        } else {
            setShowingAvailabilityId(equipmentId);
            if (!availabilityData.has(equipmentId)) {
                fetchEquipmentAvailability(equipmentId, availabilityDate);
            }
        }
    };

    const handleDateChange = (equipmentId: number, date: string) => {
        setAvailabilityDate(date);
        fetchEquipmentAvailability(equipmentId, date);
    };

    const isSlotBooked = (slots: BookedSlot[], hour: number, date: string): boolean => {
        const slotStart = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00Z`);
        const slotEnd = new Date(`${date}T${String(hour + 1).padStart(2, "0")}:00:00Z`);
        return slots.some(slot => {
            const s = new Date(slot.startTime);
            const e = new Date(slot.endTime);
            return s < slotEnd && e > slotStart;
        });
    };

    const handleSlotClick = (eq: EquipmentWithDetails, hour: number) => {
        const hStr = String(hour).padStart(2, "0");
        setSelectedEquipment(eq);
        setBookingDate(availabilityDate);
        setStartTime(`${hStr}:00`);
        setSelectedDuration(60);
        setLastBookingEndTime("");
        setBookingModalOpen(true);
    };

    const handleCancelEquipmentBooking = async (equipmentId: number) => {
        const bookingId = userEquipmentBookings.get(equipmentId);
        if (!bookingId) return;
        setIsCancellingEquipment(equipmentId);
        try {
            const response = await bookingsApi.cancelBooking(bookingId, "Cancelled by user from equipment page");
            if (response.success) {
                showToast("Booking cancelled. Tokens refunded.", "success");
                setUserEquipmentBookings(prev => { const m = new Map(prev); m.delete(equipmentId); return m; });
                setEquipmentBookingTimes(prev => { const m = new Map(prev); m.delete(equipmentId); return m; });
                setEquipment(prev => prev.map(eq => eq.equipmentId === equipmentId ? { ...eq, status: 0 } : eq));
                setLastBookingEndTime("");
                setLastBookingDate("");
                if (refreshUser) await refreshUser();
            } else {
                showToast(response.message || "Failed to cancel booking", "error");
            }
        } catch {
            showToast("Failed to cancel booking", "error");
        } finally {
            setIsCancellingEquipment(null);
        }
    };

    const to12h = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    const getStatusBadge = (status: number, timeRange?: { start: string; end: string }) => {
        const statusStr = mapEquipmentStatus(status);
        const inUseText = timeRange ? `In Use: ${to12h(timeRange.start)}–${to12h(timeRange.end)}` : "In Use";
        const badges = {
            available: { text: "Available", color: "bg-green-500", textColor: "text-white" },
            in_use: { text: inUseText, color: "bg-amber-500", textColor: "text-white" },
            maintenance: { text: "Maintenance", color: "bg-red-500", textColor: "text-white" },
        };
        const badge = badges[statusStr];
        return (
            <span className={`px-2.5 py-1 rounded-md ${badge.color} ${badge.textColor} text-xs font-bold uppercase tracking-wider flex items-center gap-1`}>
                {statusStr === "available" && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                {badge.text}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f5f8f7] dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-900 dark:text-white relative">
            {/* Header */}
            <header className="relative z-20 sticky top-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                    <Dumbbell className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight">Book Equipment</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/20">
                                <Ticket className="h-4 w-4 text-primary" />
                                <span className="font-bold text-slate-900 dark:text-white">{user?.tokenBalance ?? 0}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">tokens</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        Reserve Your Equipment
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Book gym equipment in advance to ensure it&apos;s ready when you are.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center mb-8 sticky top-20 z-10">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                            placeholder="Search equipment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-700 dark:border-slate-600">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="in_use">In Use</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Equipment Grid */}
                {filteredEquipment.length === 0 ? (
                    <Card className="p-12 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <Dumbbell className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 dark:text-slate-400 text-lg">No equipment found</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredEquipment.map((eq) => {
                            const status = mapEquipmentStatus(eq.status);
                            return (
                                <Card
                                    key={eq.equipmentId}
                                    className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col"
                                >
                                    {/* Equipment Image */}
                                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                                        <img
                                            src={eq.imageUrl}
                                            alt={eq.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3 z-10">
                                            {getStatusBadge(eq.status, equipmentBookingTimes.get(eq.equipmentId))}
                                        </div>

                                        {/* Category Tag */}
                                        <div className="absolute bottom-3 left-3 flex gap-2">
                                            <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-md">
                                                {eq.category.charAt(0).toUpperCase() + eq.category.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                    {eq.name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {eq.location}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary">
                                                    {eq.tokensCost} T
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/hr</span>
                                                </p>
                                            </div>
                                        </div>

                                        {eq.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                                {eq.description}
                                            </p>
                                        )}

                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                                <Clock className="h-4 w-4" />
                                                <span>30-90 min slots</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* View Availability toggle */}
                                                <button
                                                    onClick={() => toggleAvailability(eq.equipmentId)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    Slots
                                                    {showingAvailabilityId === eq.equipmentId
                                                        ? <ChevronUp className="h-3 w-3" />
                                                        : <ChevronDown className="h-3 w-3" />}
                                                </button>

                                            {userEquipmentBookings.has(eq.equipmentId) ? (
                                                <Button
                                                    onClick={() => handleCancelEquipmentBooking(eq.equipmentId)}
                                                    disabled={isCancellingEquipment === eq.equipmentId}
                                                    className="px-4 py-2 text-sm font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isCancellingEquipment === eq.equipmentId
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : "Cancel Booking"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => {
                                                        setSelectedEquipment(eq);
                                                        setSelectedDuration(60);
                                                        setSelectedRestTime(5);
                                                        setBookingModalOpen(true);
                                                        if (lastBookingEndTime) {
                                                            // Chain from previous booking: start = last end + rest time
                                                            const [h, m] = lastBookingEndTime.split(":").map(Number);
                                                            const totalMins = h * 60 + m + 5;
                                                            const startH = Math.floor(totalMins / 60) % 24;
                                                            const startM = totalMins % 60;
                                                            setStartTime(`${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`);
                                                            setBookingDate(lastBookingDate);
                                                        } else {
                                                            // First booking: default to next hour, clamped to business hours
                                                            const now = new Date();
                                                            const nextHour = new Date(now.getTime());
                                                            nextHour.setHours(now.getHours() + 1, 0, 0, 0);
                                                            const OPEN_HOUR = 6;
                                                            const LAST_START_HOUR = 21;
                                                            if (nextHour.getHours() < OPEN_HOUR) {
                                                                nextHour.setHours(OPEN_HOUR, 0, 0, 0);
                                                            } else if (nextHour.getHours() > LAST_START_HOUR) {
                                                                nextHour.setDate(nextHour.getDate() + 1);
                                                                nextHour.setHours(OPEN_HOUR, 0, 0, 0);
                                                            }
                                                            setStartTime(nextHour.toTimeString().slice(0, 5));
                                                            setBookingDate(nextHour.toISOString().split('T')[0]);
                                                        }
                                                        // endTime is auto-computed by the duration useEffect
                                                    }}
                                                    disabled={status !== "available"}
                                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${status === "available"
                                                        ? "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md"
                                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                        }`}
                                                >
                                                    {status === "available" ? "Book Now" : "Unavailable"}
                                                </Button>
                                            )}
                                            </div>
                                        </div>

                                        {/* Availability Grid */}
                                        {showingAvailabilityId === eq.equipmentId && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Today&apos;s Availability</span>
                                                    <input
                                                        type="date"
                                                        value={availabilityDate}
                                                        title="Select date to view availability"
                                                        min={new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => handleDateChange(eq.equipmentId, e.target.value)}
                                                        className="text-xs border border-slate-200 rounded px-2 py-0.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                    />
                                                </div>
                                                {loadingAvailability ? (
                                                    <div className="flex justify-center py-3">
                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Legend */}
                                                        <div className="flex gap-3 mb-2">
                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />Available
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Booked
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />Past
                                                            </div>
                                                        </div>
                                                        {/* Hour grid */}
                                                        <div className="grid grid-cols-8 gap-1">
                                                            {Array.from({ length: 16 }, (_, i) => i + 6).map(hour => {
                                                                const slots = availabilityData.get(eq.equipmentId) ?? [];
                                                                const booked = isSlotBooked(slots, hour, availabilityDate);
                                                                const slotDt = new Date(`${availabilityDate}T${String(hour).padStart(2, "0")}:00:00`);
                                                                const past = slotDt < new Date();
                                                                const label = hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`;
                                                                const colorClass = past
                                                                    ? "bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-600 cursor-not-allowed"
                                                                    : booked
                                                                        ? "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400 cursor-not-allowed"
                                                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 cursor-pointer";
                                                                return (
                                                                    <button
                                                                        key={hour}
                                                                        disabled={past || booked || status !== "available"}
                                                                        onClick={() => !past && !booked && status === "available" && handleSlotClick(eq, hour)}
                                                                        title={past ? "Past" : booked ? "Booked" : `Book ${label}`}
                                                                        className={`flex items-center justify-center h-7 rounded text-xs font-medium transition-colors ${colorClass}`}
                                                                    >
                                                                        {label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1.5">Click a green slot to pre-fill booking form</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Booking Modal */}
            <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Dumbbell className="h-5 w-5 text-primary" />
                            Book {selectedEquipment?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEquipment && (
                        <div className="space-y-3">
                            {/* Equipment Image */}
                            <div className="h-28 rounded-xl overflow-hidden">
                                <img
                                    src={selectedEquipment.imageUrl}
                                    alt={selectedEquipment.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Date and Time Selection */}
                            <div className="space-y-2">
                                {/* Sequential booking: rest time picker */}
                                {lastBookingEndTime && (
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                                            ⏱ Continuing from your previous booking (ended at {to12h(lastBookingEndTime)})
                                        </p>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Rest Time Between Equipment
                                        </label>
                                        <select
                                            title="Rest time between equipment bookings"
                                            value={selectedRestTime}
                                            onChange={(e) => setSelectedRestTime(Number(e.target.value))}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        >
                                            {restOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Booking Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Start Time
                                        </label>
                                        {lastBookingEndTime ? (
                                            <div className="h-10 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 flex items-center text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {to12h(startTime)}
                                            </div>
                                        ) : (
                                            <Input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Duration
                                        </label>
                                        <select
                                            title="Booking duration"
                                            value={selectedDuration}
                                            onChange={(e) => setSelectedDuration(Number(e.target.value))}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        >
                                            {durationOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Coach Session Warning */}
                            {isCheckingCoachSession && (
                                <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                    <span className="text-sm text-slate-500">Checking availability...</span>
                                </div>
                            )}

                            {hasCoachSession && !isCheckingCoachSession && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <X className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-amber-800">Coach Session Active</h4>
                                            <p className="text-sm text-amber-700 mt-1">
                                                {coachSessionMessage || "You have a coach session during this time. Equipment will be automatically booked based on your workout plan."}
                                            </p>
                                            <p className="text-xs text-amber-600 mt-2">
                                                💡 Tip: Book equipment for a different time slot, or check your booked coach sessions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Equipment</span>
                                    <span className="font-medium dark:text-white text-sm">{selectedEquipment.name}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Date</span>
                                    <span className="font-medium dark:text-white text-sm">{bookingDate || "Not selected"}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Time</span>
                                    <span className="font-medium dark:text-white text-sm">{startTime && endTime ? `${startTime} - ${endTime}` : "Not selected"}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600">
                                    <span className="text-slate-500 dark:text-slate-400">Total Cost</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{selectedEquipment.tokensCost}</span>
                                        <Ticket className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setBookingModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={`flex-1 ${hasCoachSession ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                                    onClick={handleBookEquipment}
                                    disabled={isBooking || hasCoachSession || isCheckingCoachSession}
                                >
                                    {isBooking ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Booking...
                                        </>
                                    ) : hasCoachSession ? (
                                        <>
                                            <X className="mr-2 h-4 w-4" />
                                            Blocked by Coach Session
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Confirm Booking
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function BookEquipmentPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member]}>
            <SubscriptionGate>
                <BookEquipmentContent />
            </SubscriptionGate>
        </ProtectedRoute>
    );
}
