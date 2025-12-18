"use client";

import Link from "next/link"; // Added Link import

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SignalRProvider } from "@/contexts/SignalRContext";
import { ToastProvider } from "@/components/ui/toast";
import { usePathname } from 'next/navigation';
import { NotificationListener } from "@/components/Notifications/NotificationListener";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isRedirecting, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // Hide nav on auth pages
  const isAuthPage = pathname && (pathname.startsWith('/login') || pathname.startsWith('/signup'));

  if (isAuthPage) {
    return (
      <>
        {/* GRID BACKGROUND */}
        <div className="fixed inset-0 -z-1">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background"></div>
          <div className="absolute inset-0 bg-[linear-gradient(var(--cyber-grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--cyber-grid-color)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>
        <main className="flex-grow">{children}</main>
      </>
    );
  }

  // Authenticated Layout with Sidebar
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FA]">
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-[240px] flex flex-col min-h-screen">
          {/* Mobile Header (Hidden on Desktop) */}
          <header className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
            <span className="font-bold text-lg">Pulse<span className="text-blue-600">Gym</span></span>
            {/* Mobile Menu Button would go here */}
          </header>

          {/* Top Header (Desktop - Search & Profile) */}
          <header className="hidden lg:flex h-16 items-center justify-between px-6 bg-[#F8F9FA]">
            {/* Search Bar */}
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border-0 bg-white rounded-full text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                placeholder="Search..."
              />
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-4">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-2 h-1.5 w-1.5 bg-red-500 rounded-full border border-white"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-900">Alex Doe</p>
                  <p className="text-[10px] text-slate-500">Level 4 Athlete</p>
                </div>
                <Link href="/profile">
                  <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:border-blue-200 transition-colors">
                    <img src="https://i.pravatar.cc/150?u=alex" alt="Profile" className="h-full w-full object-cover" />
                  </div>
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-3 md:p-6 pt-0">
            {children}
          </main>
        </div>

        <NotificationListener />
      </div>
    );
  }

  // Public Layout (Navbar for non-authenticated public pages if any)
  return (
    <>
      <Navbar />
      <NotificationListener />
      <div className="fixed inset-0 -z-1">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background"></div>
        <div className="absolute inset-0 bg-[linear-gradient(var(--cyber-grid-color)_1px,transparent_1px),linear-gradient(90deg,var(--cyber-grid-color)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>
      <main className="pt-24 flex-grow">{children}</main>
      <Footer />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <SignalRProvider>
              <LayoutContent>{children}</LayoutContent>
            </SignalRProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
