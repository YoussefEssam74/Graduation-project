'use client';

import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Navbar() {
  const { user } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-gray-900 dark:border-gray-800 px-6 transition-colors duration-300">
      {/* Search */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2 pl-10 pr-4 focus:border-primary-blue dark:focus:border-[#18cef2] focus:outline-none focus:ring-2 focus:ring-primary-blue/20 dark:focus:ring-[#18cef2]/20 transition-colors"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Notifications */}
        <button className="relative rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-blue dark:bg-[#18cef2] flex items-center justify-center">
            <span className="text-sm font-medium text-white dark:text-gray-900">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
