"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole, Gender } from "@/types/gym";
import { authApi, getAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, role: UserRole, gender?: number) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  // modify token balance by a signed integer (positive to add, negative to deduct)
  adjustTokens: (amount: number) => void;
  // convenience: deduct tokens (positive number -> decreases balance)
  deductTokens: (amount?: number) => void;
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
    const storedToken = getAuthToken(); // Use auth_token from API client

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Single API call - backend detects role from database
      const response = await authApi.login({ email, password });

      if (!response?.success || !response.data) {
        throw new Error("Invalid credentials");
      }

      const { user: userData, token: authToken } = response.data;

      // Calculate age from DateOfBirth
      const calculateAge = (dob: string | null | undefined): number => {
        if (!dob) return 25;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      // Map backend role string to frontend UserRole enum
      const roleMap: Record<string, UserRole> = {
        'Member': UserRole.Member,
        'Coach': UserRole.Coach,
        'Receptionist': UserRole.Reception,
        'Reception': UserRole.Reception,
        'Admin': UserRole.Admin,
      };

      const mappedRole = roleMap[userData.role];
      
      if (!mappedRole) {
        throw new Error(`Unknown role: ${userData.role}`);
      }

      // Convert backend UserDto to frontend User type
      const userObj: User = {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        age: calculateAge(userData.dateOfBirth),
        gender: userData.gender === 0 ? Gender.Male : userData.gender === 1 ? Gender.Female : Gender.Male,
        fitnessGoal: "General Fitness", // Default, will be loaded from Member table
        tokenBalance: userData.tokenBalance,
        role: mappedRole,
        createdAt: userData.createdAt,
        phone: userData.phone,
        profileImageUrl: userData.profileImageUrl,
        address: userData.address,
      };

      // Save to state and localStorage
      setUser(userObj);
      setToken(authToken);
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("auth_token", authToken);

      // Redirect based on role returned from backend
      const roleRoutes: Record<UserRole, string> = {
        [UserRole.Member]: "/dashboard",
        [UserRole.Coach]: "/coach-dashboard",
        [UserRole.Reception]: "/reception-dashboard",
        [UserRole.Admin]: "/admin-dashboard",
      };

      router.push(roleRoutes[mappedRole]);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, phone: string, role: UserRole, gender?: number) => {
    try {
      console.log('Registering with:', { email, name, phone, role, gender });
      const response = await authApi.register({ 
        email, 
        password, 
        name, 
        phone,
        gender,
        role: role // Now accepts string directly
      });

      console.log('Registration response:', response);
      console.log('Response data:', response.data);
      console.log('Response success:', response.success);

      if (!response.success || !response.data) {
        console.error('Registration failed:', response);
        throw new Error(response.message || "Registration failed");
      }

      const { user: userData, token: authToken } = response.data;
      // Map backend role string to frontend UserRole enum
      const roleMap: Record<string, UserRole> = {
        'Member': UserRole.Member,
        'Coach': UserRole.Coach,
        'Receptionist': UserRole.Reception,
        'Reception': UserRole.Reception,
        'Admin': UserRole.Admin,
      };

      const userObj: User = {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        age: 25,
        gender: userData.gender === 0 ? Gender.Male : userData.gender === 1 ? Gender.Female : Gender.Male,
        fitnessGoal: "General Fitness",
        tokenBalance: userData.tokenBalance,
        role: roleMap[userData.role] || UserRole.Member,
        createdAt: userData.createdAt,
        phone: userData.phone,
        profileImageUrl: userData.profileImageUrl,
        address: userData.address,
      };

      // Save to state and localStorage
      setUser(userObj);
      setToken(authToken);
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("auth_token", authToken);

      // Redirect based on role
      const roleRoutes: Record<UserRole, string> = {
        [UserRole.Member]: "/dashboard",
        [UserRole.Coach]: "/coach-dashboard",
        [UserRole.Reception]: "/reception-dashboard",
        [UserRole.Admin]: "/admin-dashboard",
      };

      router.push(roleRoutes[role]);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const adjustTokens = (amount: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newBalance = Math.max(0, (prev.tokenBalance ?? 0) + amount);
      const updated = { ...prev, tokenBalance: newBalance } as User;
      if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const deductTokens = (amount: number = 1) => {
    adjustTokens(-Math.abs(amount));
  };

  const logout = () => {
    authApi.logout(); // Clear token from API client
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
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
        adjustTokens,
        deductTokens,
        isLoading,
        login,
        register,
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
