"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { 
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

export default function SignUpPage() {
  const { register } = useAuth();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<string>('');
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
      await register(email, password, name, selectedRole, phone, gender);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Role selection step
  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative w-full max-w-4xl">
          <div className="bg-background rounded-2xl shadow-2xl p-12 border border-border/50">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-primary/20 rounded-xl backdrop-blur-sm">
                  <ZapIcon className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">IntelliFit</h1>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Choose Your Role</h2>
              <p className="text-muted-foreground">Select how you want to access IntelliFit</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Member Role */}
              <button
                onClick={() => {
                  setSelectedRole('Member');
                  setStep('details');
                }}
                className="group relative p-6 bg-card border-2 border-border rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <UserCircleIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Member</h3>
                  <p className="text-sm text-muted-foreground">Access workouts, book sessions, and track your fitness progress</p>
                </div>
              </button>

              {/* Coach Role */}
              <button
                onClick={() => {
                  setSelectedRole('Coach');
                  setStep('details');
                }}
                className="group relative p-6 bg-card border-2 border-border rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Coach</h3>
                  <p className="text-sm text-muted-foreground">Manage clients, create workout plans, and track performance</p>
                </div>
              </button>

              {/* Reception Role */}
              <button
                onClick={() => {
                  setSelectedRole('Receptionist');
                  setStep('details');
                }}
                className="group relative p-6 bg-card border-2 border-border rounded-xl hover:border-purple-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <MailIcon className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Reception</h3>
                  <p className="text-sm text-muted-foreground">Handle check-ins, InBody tests, and equipment management</p>
                </div>
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </div>

          <div className="text-center mt-6 text-sm text-muted-foreground">
            © 2025 IntelliFit. Smart Gym Management System.
          </div>
        </div>
      </div>
    );
  }

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
          <div className="bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
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
            <button
              onClick={() => setStep('role')}
              className="mb-4 text-sm text-primary hover:underline flex items-center gap-1"
            >
              ← Change role
            </button>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Create Account as {selectedRole}</h2>
              <p className="text-muted-foreground">Fill in your details to get started</p>
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
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
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
