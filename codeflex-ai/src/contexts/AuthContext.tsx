"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types/gym";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for authentication
const MOCK_USERS = [
  {
    userId: 1,
    email: "member@intellifit.com",
    password: "password",
    name: "Youssef Ahmed",
    age: 25,
    gender: "Male",
    fitnessGoal: "Muscle Building",
    tokenBalance: 250,
    role: UserRole.Member,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 2,
    email: "coach@intellifit.com",
    password: "password",
    name: "Sarah Johnson",
    age: 32,
    gender: "Female",
    fitnessGoal: "Professional Training",
    tokenBalance: 500,
    role: UserRole.Coach,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 3,
    email: "receptionist@intellifit.com",
    password: "password",
    name: "Mike Williams",
    age: 28,
    gender: "Male",
    fitnessGoal: "General Fitness",
    tokenBalance: 100,
    role: UserRole.Reception,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 4,
    email: "admin@intellifit.com",
    password: "password",
    name: "Admin User",
    age: 35,
    gender: "Male",
    fitnessGoal: "System Management",
    tokenBalance: 1000,
    role: UserRole.Admin,
    createdAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load auth from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Find matching user
    const foundUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password && u.role === role
    );

    if (!foundUser) {
      throw new Error("Invalid credentials or role");
    }

    // Create mock token
    const mockToken = `token_${Date.now()}_${foundUser.userId}`;

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = foundUser;

    // Save to state and localStorage
    setUser(userWithoutPassword as User);
    setToken(mockToken);
    localStorage.setItem("user", JSON.stringify(userWithoutPassword));
    localStorage.setItem("token", mockToken);

    // Redirect based on role
    const roleRoutes: Record<UserRole, string> = {
      [UserRole.Member]: "/dashboard",
      [UserRole.Coach]: "/coach-dashboard",
      [UserRole.Reception]: "/reception-dashboard",
      [UserRole.Admin]: "/admin-dashboard",
    };

    router.push(roleRoutes[role]);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
