'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  Dumbbell, 
  MessageSquare, 
  Activity, 
  CreditCard,
  Users,
  ClipboardList,
  LogOut,
  LucideIcon,
  Apple,
  Brain,
  User,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { useAuthStore } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/member', icon: Home, roles: [UserRole.Member] },
  { label: 'Profile', href: '/member/profile', icon: User, roles: [UserRole.Member] },
  { label: 'Tokens', href: '/member/tokens', icon: Zap, roles: [UserRole.Member] },
  { label: 'Workout Plans', href: '/member/workouts', icon: Dumbbell, roles: [UserRole.Member] },
  { label: 'Nutrition', href: '/member/nutrition', icon: Apple, roles: [UserRole.Member] },
  { label: 'AI Coach', href: '/member/ai-coach', icon: Brain, roles: [UserRole.Member] },
  { label: 'InBody', href: '/member/inbody', icon: Activity, roles: [UserRole.Member] },
  { label: 'Bookings', href: '/member/bookings', icon: Calendar, roles: [UserRole.Member] },
  { label: 'Subscription', href: '/member/subscription', icon: CreditCard, roles: [UserRole.Member] },
  
  { label: 'Dashboard', href: '/coach', icon: Home, roles: [UserRole.Coach] },
  { label: 'Clients', href: '/coach/clients', icon: Users, roles: [UserRole.Coach] },
  { label: 'Plans', href: '/coach/plans', icon: ClipboardList, roles: [UserRole.Coach] },
  { label: 'Schedule', href: '/coach/schedule', icon: Calendar, roles: [UserRole.Coach] },
  
  { label: 'Dashboard', href: '/reception', icon: Home, roles: [UserRole.Reception] },
  { label: 'Check-ins', href: '/reception/checkins', icon: Users, roles: [UserRole.Reception] },
  { label: 'InBody', href: '/reception/inbody', icon: Activity, roles: [UserRole.Reception] },
  { label: 'Equipment', href: '/reception/equipment', icon: Dumbbell, roles: [UserRole.Reception] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <aside className="flex h-screen w-64 flex-col bg-white dark:bg-gray-900 shadow-lg transition-colors duration-300">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b dark:border-gray-800 px-6">
        <h1 className="text-2xl font-bold text-primary-blue dark:text-[#18cef2]">IntelliFit</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-blue dark:bg-[#18cef2] text-white dark:text-gray-900'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t dark:border-gray-800 p-4">
        <div className="mb-2 rounded-md bg-gray-50 dark:bg-gray-800 p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
