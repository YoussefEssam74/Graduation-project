import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MemberAccessMode, User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  memberAccessMode: MemberAccessMode | null;
  setAuth: (user: User, token: string) => void;
  setMemberAccessMode: (mode: MemberAccessMode) => void;
  resetMemberAccessMode: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      memberAccessMode: null,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      setMemberAccessMode: (mode) => {
        set({ memberAccessMode: mode });
      },
      resetMemberAccessMode: () => {
        set({ memberAccessMode: null });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, memberAccessMode: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
