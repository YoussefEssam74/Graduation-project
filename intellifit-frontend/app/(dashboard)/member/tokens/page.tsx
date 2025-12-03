"use client";

import {
  Zap,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Brain,
  Dumbbell,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function TokensPage() {
  const { user } = useAuthStore();
  const tokenBalance = user?.tokenBalance ?? 0;

  const packages = [
    {
      id: 1,
      name: "Starter Pack",
      tokens: 50,
      price: 99,
      bonus: 0,
      popular: false,
    },
    {
      id: 2,
      name: "Popular Pack",
      tokens: 120,
      price: 199,
      bonus: 20,
      popular: true,
    },
    {
      id: 3,
      name: "Pro Pack",
      tokens: 250,
      price: 349,
      bonus: 50,
      popular: false,
    },
  ];

  const transactions = [
    {
      id: 1,
      type: "purchase",
      amount: 120,
      description: "Purchased Popular Pack",
      date: "Dec 24, 2024 10:30 AM",
      balanceAfter: 250,
    },
    {
      id: 2,
      type: "spend",
      amount: -50,
      description: "Generated AI Workout Program",
      date: "Dec 23, 2024 3:15 PM",
      balanceAfter: 130,
    },
    {
      id: 3,
      type: "spend",
      amount: -10,
      description: "Booked Bench Press",
      date: "Dec 23, 2024 10:00 AM",
      balanceAfter: 180,
    },
    {
      id: 4,
      type: "spend",
      amount: -30,
      description: "Coach Session with Ahmed Hassan",
      date: "Dec 22, 2024 2:00 PM",
      balanceAfter: 190,
    },
    {
      id: 5,
      type: "spend",
      amount: -5,
      description: "AI Chat - 5 messages",
      date: "Dec 21, 2024 6:45 PM",
      balanceAfter: 220,
    },
    {
      id: 6,
      type: "purchase",
      amount: 50,
      description: "Purchased Starter Pack",
      date: "Dec 20, 2024 9:00 AM",
      balanceAfter: 225,
    },
    {
      id: 7,
      type: "bonus",
      amount: 25,
      description: "Welcome Bonus",
      date: "Dec 15, 2024 8:00 AM",
      balanceAfter: 175,
    },
  ];

  const usageBreakdown = [
    {
      category: "AI Program Generation",
      tokens: 150,
      percentage: 45,
      icon: Brain,
      color: "text-purple-500 dark:text-purple-400",
    },
    {
      category: "Equipment Bookings",
      tokens: 80,
      percentage: 24,
      icon: Dumbbell,
      color: "text-blue-500 dark:text-blue-400",
    },
    {
      category: "Coach Sessions",
      tokens: 60,
      percentage: 18,
      icon: Calendar,
      color: "text-green-500 dark:text-green-400",
    },
    {
      category: "AI Chat Messages",
      tokens: 43,
      percentage: 13,
      icon: MessageSquare,
      color: "text-orange-500 dark:text-orange-400",
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
      case "bonus":
        return <ArrowUpRight className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case "spend":
        return <ArrowDownRight className="h-5 w-5 text-red-500 dark:text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">
          <span className="text-gray-900 dark:text-gray-100">Token </span>
          <span className="text-primary-blue dark:text-[#18cef2]">Management</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your tokens and view transaction history
        </p>
      </div>

      {/* Token Balance Card */}
      <Card className="p-8 border-2 border-primary-blue dark:border-[#18cef2] bg-gradient-to-r from-primary-blue/10 to-blue-500/10 dark:from-[#18cef2]/20 dark:to-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8 text-primary-blue dark:text-[#18cef2]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Current Balance</h2>
            </div>
            <div className="text-6xl font-bold text-primary-blue dark:text-[#18cef2] mb-2">{tokenBalance}</div>
            <p className="text-gray-600 dark:text-gray-400">tokens available</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">This Month</div>
            <div className="flex items-center gap-2 text-2xl font-bold text-green-500 dark:text-green-400 mb-1">
              <TrendingUp className="h-6 w-6" />
              +120
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">tokens earned</div>
          </div>
        </div>
      </Card>

      {/* Token Packages */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          <span className="text-gray-900 dark:text-gray-100">Purchase </span>
          <span className="text-primary-blue dark:text-[#18cef2]">Token Packages</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-6 border ${
                pkg.popular
                  ? "border-2 border-primary-blue dark:border-[#18cef2] bg-gradient-to-b from-primary-blue/10 to-transparent dark:from-[#18cef2]/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              } backdrop-blur-sm relative transition-colors duration-300`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-blue dark:bg-[#18cef2] text-white dark:text-gray-900 px-4 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <div className="p-4 bg-primary-blue/10 dark:bg-[#18cef2]/20 rounded-full w-fit mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary-blue dark:text-[#18cef2]" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary-blue dark:text-[#18cef2]">{pkg.tokens}</span>
                  <span className="text-gray-600 dark:text-gray-400">tokens</span>
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-sm text-green-500 dark:text-green-400 font-medium mb-2">
                    +{pkg.bonus} Bonus Tokens!
                  </div>
                )}
                <div className="text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100">EGP {pkg.price}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(pkg.price / (pkg.tokens + pkg.bonus)).toFixed(2)} EGP per token
                </div>
              </div>
              <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase Now
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Breakdown */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 backdrop-blur-sm transition-colors duration-300">
        <h3 className="text-xl font-bold mb-6">
          <span className="text-gray-900 dark:text-gray-100">Token Usage </span>
          <span className="text-primary-blue dark:text-[#18cef2]">Breakdown</span>
        </h3>
        <div className="space-y-4">
          {usageBreakdown.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.percentage}%</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{item.tokens} tokens</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-blue dark:bg-[#18cef2] rounded-full h-2 transition-all"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-primary-blue/5 dark:bg-[#18cef2]/10 rounded-lg border border-primary-blue/20 dark:border-[#18cef2]/30">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Total Spent This Month</span>
            <span className="text-2xl font-bold text-primary-blue dark:text-[#18cef2]">333 tokens</span>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 backdrop-blur-sm transition-colors duration-300">
        <h3 className="text-xl font-bold mb-6">
          <span className="text-gray-900 dark:text-gray-100">Transaction </span>
          <span className="text-primary-blue dark:text-[#18cef2]">History</span>
        </h3>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-primary-blue/5 dark:bg-[#18cef2]/10 rounded-lg border border-primary-blue/20 dark:border-[#18cef2]/30 hover:bg-primary-blue/10 dark:hover:bg-[#18cef2]/20 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1 text-gray-900 dark:text-gray-100">{transaction.description}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>{transaction.date}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xl font-bold mb-1 ${
                    transaction.amount > 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Balance: {transaction.balanceAfter}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Token Costs Info */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 backdrop-blur-sm transition-colors duration-300">
        <h3 className="text-xl font-bold mb-4">
          <span className="text-gray-900 dark:text-gray-100">Token </span>
          <span className="text-primary-blue dark:text-[#18cef2]">Costs</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-3 bg-primary-blue/5 dark:bg-[#18cef2]/10 rounded-lg">
            <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Brain className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
              <span>AI Program Generation</span>
            </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">50 tokens</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary-blue/5 dark:bg-[#18cef2]/10 rounded-lg">
            <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <MessageSquare className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
              <span>AI Chat Message</span>
            </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">1 token</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary-blue/5 dark:bg-[#18cef2]/10 rounded-lg">
            <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Calendar className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
              <span>Coach Session</span>
            </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">25-35 tokens</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary-blue/5 dark:bg-[#18cef2]/10 rounded-lg">
            <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Dumbbell className="h-4 w-4 text-primary-blue dark:text-[#18cef2]" />
              <span>Equipment Booking (1hr)</span>
            </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">5-10 tokens</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
