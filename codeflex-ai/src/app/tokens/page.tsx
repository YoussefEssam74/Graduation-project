"use client";

import {
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Brain,
  Dumbbell,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function TokensPage() {

  // Use current user's token balance from auth
  const { user } = useAuth();
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
      color: "text-purple-500",
    },
    {
      category: "Equipment Bookings",
      tokens: 80,
      percentage: 24,
      icon: Dumbbell,
      color: "text-blue-500",
    },
    {
      category: "Coach Sessions",
      tokens: 60,
      percentage: 18,
      icon: Calendar,
      color: "text-green-500",
    },
    {
      category: "AI Chat Messages",
      tokens: 43,
      percentage: 13,
      icon: MessageSquare,
      color: "text-orange-500",
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
      case "bonus":
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case "spend":
        return <ArrowDownRight className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">
          <span className="text-foreground">Token </span>
          <span className="text-primary">Management</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your tokens and view transaction history
        </p>
      </div>

      {/* Token Balance Card */}
      <Card className="p-8 border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Current Balance</h2>
            </div>
            <div className="text-6xl font-bold text-primary mb-2">{tokenBalance}</div>
            <p className="text-muted-foreground">tokens available</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-2">This Month</div>
            <div className="flex items-center gap-2 text-2xl font-bold text-green-500 mb-1">
              <TrendingUp className="h-6 w-6" />
              +120
            </div>
            <div className="text-sm text-muted-foreground">tokens earned</div>
          </div>
        </div>
      </Card>

      {/* Token Packages */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          <span className="text-foreground">Purchase </span>
          <span className="text-primary">Token Packages</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`p-6 border ${
                pkg.popular
                  ? "border-2 border-primary bg-gradient-to-b from-primary/10 to-transparent"
                  : "border-border bg-card/50"
              } backdrop-blur-sm relative`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-primary">{pkg.tokens}</span>
                  <span className="text-muted-foreground">tokens</span>
                </div>
                {pkg.bonus > 0 && (
                  <div className="text-sm text-green-500 font-medium mb-2">
                    +{pkg.bonus} Bonus Tokens!
                  </div>
                )}
                <div className="text-3xl font-bold mb-1">EGP {pkg.price}</div>
                <div className="text-sm text-muted-foreground">
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
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6">
          <span className="text-foreground">Token Usage </span>
          <span className="text-primary">Breakdown</span>
        </h3>
        <div className="space-y-4">
          {usageBreakdown.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-card rounded-full border border-border">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  <span className="font-bold">{item.tokens} tokens</span>
                </div>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Spent This Month</span>
            <span className="text-2xl font-bold text-primary">333 tokens</span>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6">
          <span className="text-foreground">Transaction </span>
          <span className="text-primary">History</span>
        </h3>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-card rounded-full border border-border">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1">{transaction.description}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{transaction.date}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xl font-bold mb-1 ${
                    transaction.amount > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount}
                </div>
                <div className="text-xs text-muted-foreground">
                  Balance: {transaction.balanceAfter}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Token Costs Info */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4">
          <span className="text-foreground">Token </span>
          <span className="text-primary">Costs</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span>AI Program Generation</span>
            </span>
            <span className="font-bold">50 tokens</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>AI Chat Message</span>
            </span>
            <span className="font-bold">1 token</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Coach Session</span>
            </span>
            <span className="font-bold">25-35 tokens</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
            <span className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span>Equipment Booking (1hr)</span>
            </span>
            <span className="font-bold">5-10 tokens</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
