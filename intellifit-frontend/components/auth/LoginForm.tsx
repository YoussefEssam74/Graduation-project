'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { UserRole, User, Gender } from '@/types';
import { useAuthStore } from '@/hooks/useAuth';

// Mock users for static authentication
const MOCK_USERS = [
  { id: 1, email: 'member@intellifit.com', password: 'password', role: UserRole.Member, name: 'John Doe', age: 28, gender: 'Male', fitnessGoal: 'Weight Loss', tokenBalance: 150 },
  { id: 2, email: 'coach@intellifit.com', password: 'password', role: UserRole.Coach, name: 'Jane Smith', age: 32, gender: 'Female', fitnessGoal: 'Strength Training', tokenBalance: 200 },
  { id: 3, email: 'reception@intellifit.com', password: 'password', role: UserRole.Reception, name: 'Bob Johnson', age: 25, gender: 'Male', fitnessGoal: 'General Fitness', tokenBalance: 100 },
];

export default function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.Member);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Find matching user in mock data
      const user = MOCK_USERS.find(
        u => u.email === email && u.password === password && u.role === selectedRole
      );

      if (!user) {
        setError('Invalid email, password, or role');
        setIsLoading(false);
        return;
      }

      // Create mock token
      const mockToken = 'mock-jwt-token-' + Date.now();

      // Set auth state - create proper User object
      const mockUser: User = {
        userId: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender === 'Male' ? Gender.Male : Gender.Female,
        fitnessGoal: user.fitnessGoal,
        tokenBalance: user.tokenBalance,
        role: user.role,
        createdAt: new Date().toISOString(),
      };
      setAuth(mockUser, mockToken);

      // Redirect based on role
      const roleRoutes = {
        [UserRole.Member]: '/member',
        [UserRole.Coach]: '/coach',
        [UserRole.Reception]: '/reception',
        [UserRole.Admin]: '/admin',
      };
      
      router.push(roleRoutes[selectedRole]);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { value: UserRole.Member, label: 'Member' },
    { value: UserRole.Coach, label: 'Coach' },
    { value: UserRole.Reception, label: 'Reception' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
      </div>

      {/* Role Selector - Inline */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => setSelectedRole(role.value)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
              selectedRole === role.value
                ? 'bg-[#0b4fd4] text-white shadow-sm'
                : 'bg-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-gray-300" />
            <span className="text-gray-600">Remember me</span>
          </label>
          <a href="#" className="text-[#0b4fd4] hover:underline">
            Forgot password?
          </a>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-[#ef4444]">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-[#0b4fd4] hover:underline">
          Sign up
        </a>
      </div>

      {/* Helper text for testing */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-gray-600">
        <p className="font-medium mb-1">Test Credentials:</p>
        <p>Member: member@intellifit.com / password</p>
        <p>Coach: coach@intellifit.com / password</p>
        <p>Reception: reception@intellifit.com / password</p>
      </div>
    </div>
  );
}
