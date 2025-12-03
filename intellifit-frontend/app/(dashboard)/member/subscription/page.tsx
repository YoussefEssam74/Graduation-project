'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuth';
import { subscriptionApi } from '@/lib/api/services';
import { CreditCard, Check, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentId, setPaymentId] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const plansRes = await subscriptionApi.getPlans();
        if (plansRes?.success && plansRes.data) setPlans(plansRes.data);

        const hasActive = await subscriptionApi.hasActiveSubscription(user.userId);
        if (hasActive?.success && hasActive.data) {
          // if user has active subscription, pick the first active plan from all plans (simple placeholder)
          setCurrentPlan(plansRes?.data?.[1] ?? null);
        }
      } catch (err) {
        console.error('Failed to load subscription data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubscribe = async (planId: number) => {
    if (!user?.userId) return alert('Please log in');
    if (!paymentId) return alert('Enter a payment ID for testing');

    try {
      const payload = { userId: user.userId, planId, paymentId: Number(paymentId) };
      const res = await subscriptionApi.createSubscription(payload);
      if (res?.success) {
        const plan = plans.find((p) => p.planID === planId) ?? null;
        setCurrentPlan(plan);
        alert('Subscription created successfully');
      } else {
        alert(res?.message || 'Failed to create subscription');
      }
    } catch (err) {
      console.error('Create subscription error', err);
      alert('Failed to create subscription');
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Subscription Plans</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Choose the perfect plan for your fitness journey</p>
      </div>

      {/* Current Subscription */}
      {currentPlan && (
        <Card className="border-[#0b4fd4] dark:border-[#18cef2] border-2">
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
        <div className="mb-4 flex gap-3 items-center">
          <input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="Payment ID (for testing)" className="px-3 py-2 border rounded-lg" />
          <div className="text-sm text-gray-600">Enter a payment id to create a subscription (test flow)</div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
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
                    {(plan.features || []).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-[#a3e221] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
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
