'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MemberAccessMode, UserRole } from '@/types';
import { useAuthStore } from '@/hooks/useAuth';

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, memberAccessMode } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== UserRole.Member) {
      router.replace('/login');
      return;
    }

    if (!memberAccessMode && pathname !== '/member/access-choice') {
      router.replace('/member/access-choice');
      return;
    }

    if (
      memberAccessMode === MemberAccessMode.EquipmentOnly &&
      (pathname === '/member/workouts' || pathname === '/member/nutrition')
    ) {
      router.replace('/member/bookings');
    }
  }, [memberAccessMode, pathname, router, user]);

  return <>{children}</>;
}
