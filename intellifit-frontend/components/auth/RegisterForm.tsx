'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import RoleSelector from './RoleSelector';
import { UserRole, RegisterRequest } from '@/types';
import { useAuthStore } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/services';

export default function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<'role' | 'credentials'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('credentials');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare register request matching backend RegisterRequestDto
      const registerData: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender ? parseInt(formData.gender) : undefined,
        role: selectedRole
      };

      // Call the real backend API
      const response = await authApi.register(registerData);

      // Backend returns AuthResponse { user, token, expiresAt }
      if (response && response.user && response.token) {
        // Store auth info
        setAuth(response.user, response.token);

        // Redirect based on role
        const roleRoutes: Record<string, string> = {
          'Member': '/member',
          'Coach': '/coach',
          'Reception': '/reception',
          'Admin': '/admin',
        };
        
        const route = roleRoutes[response.user.role] || '/member';
        router.push(route);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Join IntelliFit</h2>
          <p className="text-sm text-gray-600 mt-1">Select your role to get started</p>
        </div>
        <RoleSelector
          selectedRole={selectedRole}
          onRoleSelect={handleRoleSelect}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to role selection */}
      <button
        onClick={() => setStep('role')}
        className="text-sm text-[#0b4fd4] hover:underline"
      >
        ← Change role
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Sign Up as {selectedRole}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Create your account to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Phone (Optional)"
          type="tel"
          name="phone"
          placeholder="+1234567890"
          value={formData.phone}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date of Birth (Optional)"
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender (Optional)
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b4fd4] focus:border-transparent"
            >
              <option value="">Select</option>
              <option value="0">Male</option>
              <option value="1">Female</option>
            </select>
          </div>
        </div>

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

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
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-[#0b4fd4] hover:underline">
          Log in
        </a>
      </div>
    </div>
  );
}
