'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { UserRole } from '@/types';
import { useAuthStore } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/services';

export default function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      // Call the real backend API
      const response = await authApi.login(email, password);

      // Backend returns AuthResponse { user, token, expiresAt }
      if (response && response.user && response.token) {
        // Store auth info
        setAuth(response.user, response.token);

        // Redirect based on role
        const roleRoutes: Record<string, string> = {
          'Member': '/member',
          'Coach': '/coach',
          'Reception': '/reception',
          'Receptionist': '/reception',
          'Admin': '/admin',
        };
        
        const route = roleRoutes[response.user.role] || '/member';
        router.push(route);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      // Extract error message from backend response
      let errorMessage = 'Invalid email or password';
      
      if (err.response?.data) {
        // Backend returns error as plain text in some cases
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.title) {
          errorMessage = err.response.data.title;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
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
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
        <p className="font-semibold text-blue-900 mb-2">✓ Working Test Account:</p>
        <div className="space-y-1 text-blue-700">
          <p><span className="font-medium">Email:</span> apitest.user@example.com</p>
          <p><span className="font-medium">Password:</span> Test@1234</p>
          <p className="text-blue-600 text-[10px] mt-2">Note: Password is case-sensitive</p>
        </div>
      </div>
    </div>
  );
}
