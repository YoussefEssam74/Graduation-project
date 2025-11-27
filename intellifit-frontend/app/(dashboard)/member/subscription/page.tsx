'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/hooks/useAuth';

interface SubscriptionPlan {
  planID: number;
  planName: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  tokensIncluded: number;
  isPopular?: boolean;
}

// Calculate renewal date outside component
const MOCK_RENEWAL_DATE = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    planID: 1,
    planName: 'Basic',
    price: 29.99,
    durationDays: 30,
    description: 'Perfect for getting started',
    tokensIncluded: 100,
    features: [
      'Access to gym equipment',
      '100 tokens per month',
      'Basic workout tracking',
      'Mobile app access',
      'Email support',
    ],
  },
  {
    planID: 2,
    planName: 'Pro',
    price: 49.99,
    durationDays: 30,
    description: 'Most popular choice',
    tokensIncluded: 200,
    isPopular: true,
    features: [
      'Everything in Basic',
      '200 tokens per month',
      'AI Coach access',
      'Nutrition plans',
      'InBody measurements',
      'Priority booking',
      'Priority support',
    ],
  },
  {
    planID: 3,
    planName: 'Elite',
    price: 79.99,
    durationDays: 30,
    description: 'Ultimate fitness experience',
    tokensIncluded: 350,
    features: [
      'Everything in Pro',
      '350 tokens per month',
      'Personal coach sessions',
      'Custom meal plans',
      'Advanced analytics',
      'Unlimited InBody scans',
      'VIP support 24/7',
      'Guest passes (2/month)',
    ],
  },
];

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan] = useState<SubscriptionPlan | null>(MOCK_PLANS[1]); // Mock: User has Pro plan
  const [renewalDate] = useState<string>(MOCK_RENEWAL_DATE);

  useEffect(() => {
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleSubscribe = (planId: number) => {
    const plan = MOCK_PLANS.find((p) => p.planID === planId);
    alert(`Subscribe to ${plan?.planName} plan - Feature coming soon!`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b4fd4]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-2">Choose the perfect plan for your fitness journey</p>
      </div>

      {/* Current Subscription */}
      {currentPlan && (
        <Card className="border-[#0b4fd4] border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{currentPlan.planName}</h3>
                <p className="text-gray-600 mt-1">
                  ${currentPlan.price}/month • {currentPlan.tokensIncluded} tokens
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Renews on {new Date(renewalDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Token Balance</div>
                <div className="text-3xl font-bold text-[#0b4fd4]">
                  💎 {user?.tokenBalance || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {currentPlan ? 'Upgrade or Change Plan' : 'Available Plans'}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {MOCK_PLANS.map((plan) => {
            const isCurrent = currentPlan?.planID === plan.planID;
            
            return (
              <Card
                key={plan.planID}
                className={`relative ${
                  plan.isPopular ? 'border-[#a3e221] border-2 shadow-lg' : ''
                } ${isCurrent ? 'opacity-75' : ''}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#a3e221] text-gray-900 font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-[#0b4fd4] bg-opacity-10 flex items-center justify-center mb-4">
                    {plan.planID === 1 ? (
                      <Zap className="h-6 w-6 text-[#0b4fd4]" />
                    ) : plan.planID === 2 ? (
                      <CreditCard className="h-6 w-6 text-[#0b4fd4]" />
                    ) : (
                      <Crown className="h-6 w-6 text-[#0b4fd4]" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">{plan.planName}</CardTitle>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-[#a3e221] font-semibold mt-2">
                    💎 {plan.tokensIncluded} tokens included
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-[#a3e221] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan.planID)}
                    disabled={isCurrent}
                    className="w-full"
                    variant={isCurrent ? 'outline' : 'primary'}
                  >
                    {isCurrent ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Token Purchase */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Tokens?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Running low on tokens? Purchase additional tokens anytime without changing your plan.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:border-[#0b4fd4] transition-colors cursor-pointer">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 mb-1">💎 50</p>
                <p className="text-sm text-gray-600 mb-3">tokens</p>
                <p className="text-lg font-semibold text-[#0b4fd4]">$9.99</p>
              </div>
            </div>
            <div className="p-4 border-2 border-[#a3e221] rounded-lg hover:shadow-md transition-shadow cursor-pointer relative">
              <Badge className="absolute -top-2 right-2 bg-[#a3e221] text-gray-900 text-xs">
                Best Value
              </Badge>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 mb-1">💎 120</p>
                <p className="text-sm text-gray-600 mb-3">tokens</p>
                <p className="text-lg font-semibold text-[#0b4fd4]">$19.99</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:border-[#0b4fd4] transition-colors cursor-pointer">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 mb-1">💎 250</p>
                <p className="text-sm text-gray-600 mb-3">tokens</p>
                <p className="text-lg font-semibold text-[#0b4fd4]">$39.99</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
