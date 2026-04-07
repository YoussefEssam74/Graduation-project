'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import { MemberAccessMode } from '@/types';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function MemberAccessChoicePage() {
  const router = useRouter();
  const { setMemberAccessMode, user } = useAuthStore();

  const handleSelect = (mode: MemberAccessMode) => {
    setMemberAccessMode(mode);

    if (mode === MemberAccessMode.EquipmentOnly) {
      router.push('/member/bookings');
      return;
    }

    router.push('/member');
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Member Experience</h1>
        <p className="mt-2 text-gray-600">
          Welcome {user?.name}. Select how you want to use IntelliFit before entering your dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-[#0b4fd4]">Workout + Nutrition Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Use the full member journey with workout plans, nutrition guidance, and all member tools.
            </p>
            <Button className="w-full" onClick={() => handleSelect(MemberAccessMode.FullPlan)}>
              Choose Full Plan Experience
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-[#0b4fd4]">Equipment Booking Only</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Skip workout and nutrition plans and use IntelliFit only for booking gym equipment.
            </p>
            <Button
              variant="outline"
              className="w-full border-[#0b4fd4] text-[#0b4fd4] hover:bg-blue-50"
              onClick={() => handleSelect(MemberAccessMode.EquipmentOnly)}
            >
              Choose Equipment-Only Experience
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
