"use client";

import { 
  UserIcon, 
  ZapIcon, 
  LayoutDashboardIcon,
  CalendarIcon,
  ActivityIcon,
  CoinsIcon,
  BrainIcon,
  Users2Icon,
  ShieldIcon,
  LogOutIcon,
  DumbbellIcon,
  UserCogIcon
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import { Button } from "./ui/button";

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

export default function Navbar() {
  const { user, isAuthenticated, isRedirecting, logout } = useAuth();

  // Don't render navbar during redirect
  if (isRedirecting) {
    return null;
  }

  // Role-based navigation items
  const getMemberNav = () => [
    { href: "/dashboard", icon: LayoutDashboardIcon, label: "Dashboard" },
    { href: "/book-coach", icon: UserCogIcon, label: "Book Coach" },
    { href: "/bookings", icon: CalendarIcon, label: "Bookings" },
    { href: "/inbody", icon: ActivityIcon, label: "InBody" },
    { href: "/ai-coach", icon: BrainIcon, label: "AI Coach" },
    { href: "/tokens", icon: CoinsIcon, label: "Tokens" },
    { href: "/profile", icon: UserIcon, label: "Profile" },
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

  const getRoleBadgeColor = () => {
    if (!user) return "bg-gray-500";
    const role = normalizeRole(user.role);
    switch (role) {
      case UserRole.Member:
        return "bg-blue-500";
      case UserRole.Coach:
        return "bg-green-500";
      case UserRole.Receptionist:
        return "bg-purple-500";
      case UserRole.Admin:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const navItems = getNavItems();

  // Get dashboard URL based on normalized role
  const getDashboardUrl = () => {
    if (!user) return "/";
    const role = normalizeRole(user.role);
    switch (role) {
      case UserRole.Member:
        return "/dashboard";
      case UserRole.Coach:
        return "/coach-dashboard";
      case UserRole.Receptionist:
        return "/reception-dashboard";
      case UserRole.Admin:
        return "/admin-dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link href={isAuthenticated ? getDashboardUrl() : "/"} className="flex items-center gap-2">
          <div className="p-1 bg-primary/10 rounded">
            <ZapIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xl font-bold font-mono">
            Intel<span className="text-primary">Fit</span>
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          {!isAuthenticated ? (
            <>
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {normalizeRole(user?.role || '') === UserRole.Member && (
                <Button
                  asChild
                  variant="outline"
                  className="ml-2 border-primary/50 text-primary hover:bg-primary hover:text-white"
                >
                  <Link href="/generate-program">Generate Program</Link>
                </Button>
              )}

              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getRoleBadgeColor()} flex items-center justify-center`}>
                    {normalizeRole(user?.role || '') === UserRole.Admin && <ShieldIcon className="w-4 h-4 text-white" />}
                    {normalizeRole(user?.role || '') === UserRole.Coach && <UserCogIcon className="w-4 h-4 text-white" />}
                    {normalizeRole(user?.role || '') === UserRole.Receptionist && <Users2Icon className="w-4 h-4 text-white" />}
                    {normalizeRole(user?.role || '') === UserRole.Member && <UserIcon className="w-4 h-4 text-white" />}
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">{user?.name?.split(' ')[0]}</div>
                    <div className="text-xs text-muted-foreground capitalize">{normalizeRole(user?.role || '')}</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={logout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOutIcon size={16} className="mr-1" />
                  Logout
                </Button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
