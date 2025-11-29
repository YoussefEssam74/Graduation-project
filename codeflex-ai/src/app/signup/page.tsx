"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import Link from "next/link";
import { 
  DumbbellIcon, 
  UserIcon, 
  Users2Icon, 
  ShieldCheckIcon,
  ZapIcon,
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  UserCircleIcon,
  PhoneIcon,
  CheckCircleIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_CONFIG = [
  {
    role: UserRole.Member,
    label: "Member",
    icon: DumbbellIcon,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    description: "Access workouts, bookings & AI coach",
  },
  {
    role: UserRole.Coach,
    label: "Coach",
    icon: UserIcon,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    description: "Manage clients & training programs",
  },
  {
    role: UserRole.Reception,
    label: "Receptionist",
    icon: Users2Icon,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
    description: "Handle bookings & member support",
  },
  {
    role: UserRole.Admin,
    label: "Admin",
    icon: ShieldCheckIcon,
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
    description: "Full system control & analytics",
  },
];

export default function SignUpPage() {
  const { register } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Member);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<number>(0); // 0 = Male, 1 = Female
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return false;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name, phone, selectedRole, gender);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedConfig = ROLE_CONFIG.find((r) => r.role === selectedRole)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-0 bg-background rounded-2xl shadow-2xl overflow-hidden border border-border/50">
          {/* Left Side - Branding */}
          <div className={`${selectedConfig.color} p-12 text-white flex flex-col justify-between relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-64 h-64 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-10 left-10 w-48 h-48 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ZapIcon className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold">IntelliFit</h1>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Join Our Community</h2>
                  <p className="text-white/90 text-lg">
                    Create your account and start your fitness journey with intelligent training solutions
                  </p>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">AI-Powered Coaching</h3>
                      <p className="text-white/80 text-sm">Get personalized workout plans generated by artificial intelligence</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Smart Booking System</h3>
                      <p className="text-white/80 text-sm">Book classes and sessions with ease</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CheckCircleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Progress Tracking</h3>
                      <p className="text-white/80 text-sm">Monitor your fitness journey with InBody analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8">
              <p className="text-white/60 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-white font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="p-12 bg-background">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Create Account</h2>
              <p className="text-muted-foreground">Choose your role and fill in your details</p>
            </div>

            {/* Role Selector */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Select Role</Label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_CONFIG.map((config) => {
                  const Icon = config.icon;
                  const isSelected = selectedRole === config.role;
                  return (
                    <button
                      key={config.role}
                      type="button"
                      onClick={() => setSelectedRole(config.role)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? `${config.color} text-white border-transparent shadow-lg scale-105`
                          : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? "text-white" : "text-primary"}`} />
                      <div className={`font-semibold text-xs ${isSelected ? "text-white" : "text-foreground"}`}>
                        {config.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Gender</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="0"
                      checked={gender === 0}
                      onChange={() => setGender(0)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="1"
                      checked={gender === 1}
                      onChange={() => setGender(1)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Female</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                  <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 ${selectedConfig.color} ${selectedConfig.hoverColor} text-white font-semibold shadow-lg transition-all duration-200 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Account...
                  </div>
                ) : (
                  `Sign up as ${selectedConfig.label}`
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          © 2025 IntelliFit. Smart Gym Management System.
        </div>
      </div>
    </div>
  );
}
