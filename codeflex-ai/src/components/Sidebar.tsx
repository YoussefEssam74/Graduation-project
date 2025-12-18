"use client";

import {
    UserIcon,
    Ticket,
    LayoutDashboardIcon,
    CalendarIcon,
    ActivityIcon,
    CoinsIcon,
    BrainIcon,
    Users2Icon,
    ShieldIcon,
    LogOutIcon,
    DumbbellIcon,
    UserCogIcon,
    SettingsIcon,
    Menu,
    TrophyIcon
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { Button } from "./ui/button";
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

// Map backend role strings to frontend UserRole enum
const normalizeRole = (role: string): UserRole => {
    const roleMap: Record<string, UserRole> = {
        'Member': UserRole.Member,
        'Coach': UserRole.Coach,
        'Receptionist': UserRole.Receptionist,
        'Admin': UserRole.Admin,
    };
    return roleMap[role] || UserRole.Member;
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // Role-based navigation items
    const getMemberNav = () => [
        { href: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
        { href: "/bookings", icon: CalendarIcon, label: "Schedule" }, // Bookings -> Schedule
        { href: "/ai-coach", icon: BrainIcon, label: "AI Coach" }, // Added New badge in UI
        { href: "/tokens", icon: CoinsIcon, label: "Tokens" },
        { href: "/inbody", icon: ActivityIcon, label: "Analytics" }, // InBody -> Analytics
        { href: "/achievements", icon: TrophyIcon, label: "Achievements" },
        { href: "/programs", icon: DumbbellIcon, label: "My Plans" },
    ];

    const getCoachNav = () => [
        { href: "/coach-dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
        { href: "/coach-clients", icon: Users2Icon, label: "Clients" },
        { href: "/coach-programs", icon: DumbbellIcon, label: "Programs" },
        { href: "/coach-schedule", icon: CalendarIcon, label: "Schedule" },
        { href: "/coach-profile", icon: UserIcon, label: "My Profile" },
    ];

    const getReceptionNav = () => [
        { href: "/reception-dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
        { href: "/reception-members", icon: Users2Icon, label: "Members" },
        { href: "/reception-bookings", icon: CalendarIcon, label: "Bookings" },
        { href: "/reception-checkin", icon: ActivityIcon, label: "Check-In" },
    ];

    const getAdminNav = () => [
        { href: "/admin-dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
        { href: "/admin-users", icon: Users2Icon, label: "Manage Staff" },
        { href: "/admin-members", icon: Users2Icon, label: "Members" },
        { href: "/admin-coaches", icon: UserCogIcon, label: "Coaches" },
        { href: "/admin-equipment", icon: DumbbellIcon, label: "Equipment" },
        { href: "/admin-analytics", icon: ActivityIcon, label: "Analytics" },
    ];

    const getNavItems = () => {
        if (!user) return [];
        const role = normalizeRole(user.role);
        switch (role) {
            case UserRole.Member:
                return getMemberNav();
            case UserRole.Coach:
                return getCoachNav();
            case UserRole.Receptionist:
                return getReceptionNav();
            case UserRole.Admin:
                return getAdminNav();
            default:
                return [];
        }
    };

    const navItems = getNavItems();
    const activeRole = normalizeRole(user?.role || '');

    // Get dashboard URL based on normalized role
    const getDashboardUrl = () => {
        if (!user) return "/";
        switch (activeRole) {
            case UserRole.Member: return "/dashboard";
            case UserRole.Coach: return "/coach-dashboard";
            case UserRole.Receptionist: return "/reception-dashboard";
            case UserRole.Admin: return "/admin-dashboard";
            default: return "/dashboard";
        }
    };

    return (
        <div className="hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0 bg-white border-r border-slate-200 z-50">
            {/* Logo Area */}
            <div className="p-6 pb-2">
                <Link href={getDashboardUrl()} className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                        <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Pulse<span className="text-blue-600">Gym</span>
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <Icon size={20} className={cn(
                                "transition-colors",
                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            <span>{item.label}</span>

                            {/* New Badge for AI Coach */}
                            {item.label === "AI Coach" && (
                                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 rounded">
                                    NEW
                                </span>
                            )}

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 mt-auto">
                {/* Token Balance (for members) */}
                {activeRole === UserRole.Member && (
                    <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white relative overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                        <div className="relative z-10">
                            <p className="text-xs text-slate-400 mb-1">Current Plan</p>
                            <h4 className="font-bold text-sm mb-2">Premium Member</h4>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
                                <div className="bg-green-500 h-1.5 rounded-full w-3/4"></div>
                            </div>
                            <p className="text-[10px] text-slate-400">22 days left</p>
                        </div>
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    </div>
                )}

                {/* User Menu */}
                <div className="space-y-1 pt-4 border-t border-slate-100">
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        <SettingsIcon size={18} />
                        <span>Settings</span>
                    </Link>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        <LogOutIcon size={18} />
                        <span>Log out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
