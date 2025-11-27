'use client';

import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { User, Briefcase, UserCheck } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
}

const roles = [
  {
    role: UserRole.Member,
    label: 'Member',
    icon: User,
    description: 'Access workouts, book sessions, track progress',
    color: 'border-blue-500 bg-blue-50 text-blue-700'
  },
  {
    role: UserRole.Coach,
    label: 'Coach',
    icon: Briefcase,
    description: 'Manage clients, create plans, track performance',
    color: 'border-lime-500 bg-lime-50 text-lime-700'
  },
  {
    role: UserRole.Reception,
    label: 'Reception',
    icon: UserCheck,
    description: 'Check-ins, InBody tests, equipment management',
    color: 'border-purple-500 bg-purple-50 text-purple-700'
  },
];

export default function RoleSelector({ selectedRole, onRoleSelect }: RoleSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Select Your Role</h2>
        <p className="text-sm text-gray-600 mt-1">Choose how you want to access IntelliFit</p>
      </div>
      
      <div className="grid gap-4">
        {roles.map(({ role, label, icon: Icon, description, color }) => (
          <button
            key={role}
            onClick={() => onRoleSelect(role)}
            className={cn(
              'flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all',
              selectedRole === role
                ? color
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className={cn(
              'rounded-full p-3',
              selectedRole === role ? 'bg-white/50' : 'bg-gray-100'
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
