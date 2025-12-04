"use client";

import { useState, useEffect } from "react";
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
  CheckCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { tokenTransactionsApi, type TokenTransactionDto } from "@/lib/api";

export default function TokensPage() {
  const { showToast } = useToast();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [transactions, setTransactions] = useState<TokenTransactionDto[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [tokensEarnedThisMonth, setTokensEarnedThisMonth] = useState(0);
  const [tokensSpentThisMonth, setTokensSpentThisMonth] = useState(0);

  // Use current user's token balance from auth
  const { user, adjustTokens, refreshUser } = useAuth();
  const tokenBalance = user?.tokenBalance ?? 0;

  // Fetch transactions on load
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.userId) return;
      
      try {
        setIsLoadingTransactions(true);
        const response = await tokenTransactionsApi.getUserTransactions(user.userId);
        
        if (response.success && response.data) {
          setTransactions(response.data);
          
          // Calculate this month's statistics
          const now = new Date();
          const thisMonth = now.getMonth();
          const thisYear = now.getFullYear();
          
          let earned = 0;
          let spent = 0;
          
          response.data.forEach(tx => {
            const txDate = new Date(tx.createdAt);
            if (txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear) {
              if (tx.amount > 0) {
                earned += tx.amount;
              } else {
                spent += Math.abs(tx.amount);
              }
            }
          });
          
          setTokensEarnedThisMonth(earned);
          setTokensSpentThisMonth(spent);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };
    
    fetchTransactions();
  }, [user?.userId]);

  const handlePurchaseClick = (pkg: { id: number; name: string; tokens: number; bonus: number; price: number }) => {
    if (!user) {
      showToast("Please log in to purchase tokens.", "warning");
      return;
    }
    setSelectedPackage(pkg);
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPackage || !user) return;

    setIsPurchasing(true);
    
    try {
      const totalTokens = selectedPackage.tokens + selectedPackage.bonus;
      
      // Create the transaction in the database
      const response = await tokenTransactionsApi.createTransaction({
        amount: totalTokens,
        transactionType: "Purchase",
        description: `Purchased ${selectedPackage.name} - ${totalTokens} tokens for EGP ${selectedPackage.price}`,
        referenceType: "TokenPackage",
        referenceId: selectedPackage.id,
      });
      
      if (response.success && response.data) {
        // Update local token balance
        adjustTokens(totalTokens);
        
        // Add the new transaction to the list
        setTransactions(prev => [response.data!, ...prev]);
        
        // Update monthly stats
        setTokensEarnedThisMonth(prev => prev + totalTokens);
        
        // Refresh user data to get updated balance from server
        if (refreshUser) {
          await refreshUser();
        }
        
        showToast(`Successfully purchased ${totalTokens} tokens!`, "success");
      } else {
        showToast(response.error || "Failed to complete purchase", "error");
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      showToast("An error occurred during purchase", "error");
    } finally {
      setPurchaseDialogOpen(false);
      setSelectedPackage(null);
      setIsPurchasing(false);
    }
  };

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

  // Calculate usage breakdown from actual transactions
  const calculateUsageBreakdown = () => {
    const breakdown: Record<string, { tokens: number; icon: any; color: string }> = {
      "AI Program Generation": { tokens: 0, icon: Brain, color: "text-purple-500" },
      "Equipment Bookings": { tokens: 0, icon: Dumbbell, color: "text-blue-500" },
      "Coach Sessions": { tokens: 0, icon: Calendar, color: "text-green-500" },
      "AI Chat Messages": { tokens: 0, icon: MessageSquare, color: "text-orange-500" },
    };
    
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only count spending
        const desc = tx.description.toLowerCase();
        if (desc.includes('ai') && (desc.includes('program') || desc.includes('workout'))) {
          breakdown["AI Program Generation"].tokens += Math.abs(tx.amount);
        } else if (desc.includes('equipment') || desc.includes('bench') || desc.includes('treadmill')) {
          breakdown["Equipment Bookings"].tokens += Math.abs(tx.amount);
        } else if (desc.includes('coach') || desc.includes('session')) {
          breakdown["Coach Sessions"].tokens += Math.abs(tx.amount);
        } else if (desc.includes('chat') || desc.includes('message')) {
          breakdown["AI Chat Messages"].tokens += Math.abs(tx.amount);
        }
      }
    });
    
    const totalSpent = Object.values(breakdown).reduce((sum, item) => sum + item.tokens, 0);
    
    return Object.entries(breakdown).map(([category, data]) => ({
      category,
      tokens: data.tokens,
      percentage: totalSpent > 0 ? Math.round((data.tokens / totalSpent) * 100) : 0,
      icon: data.icon,
      color: data.color,
    }));
  };

  const usageBreakdown = calculateUsageBreakdown();
  const totalSpentFromBreakdown = usageBreakdown.reduce((sum, item) => sum + item.tokens, 0);

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "purchase":
      case "bonus":
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case "spend":
      case "spending":
        return <ArrowDownRight className="h-5 w-5 text-red-500" />;
      default:
        return type.toLowerCase().includes("purchase") || type.toLowerCase().includes("bonus")
          ? <ArrowUpRight className="h-5 w-5 text-green-500" />
          : <ArrowDownRight className="h-5 w-5 text-red-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
              +{tokensEarnedThisMonth}
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
              <Button className="w-full" variant={pkg.popular ? "default" : "outline"} onClick={() => handlePurchaseClick(pkg)}>
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
            <span className="text-2xl font-bold text-primary">{tokensSpentThisMonth} tokens</span>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6">
          <span className="text-foreground">Transaction </span>
          <span className="text-primary">History</span>
        </h3>
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Purchase tokens to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.transactionId}
                className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-card rounded-full border border-border">
                    {getTransactionIcon(transaction.transactionType)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{transaction.description}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(transaction.createdAt)}</span>
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
        )}
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

      {/* Purchase Confirmation Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>
              Review your token package purchase
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="py-4 space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-3">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{selectedPackage.name}</h3>
                <div className="text-3xl font-bold text-primary">
                  {selectedPackage.tokens} tokens
                </div>
                {selectedPackage.bonus > 0 && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    +{selectedPackage.bonus} Bonus Tokens!
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Base Tokens</span>
                  <span className="font-medium">{selectedPackage.tokens}</span>
                </div>
                {selectedPackage.bonus > 0 && (
                  <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <span className="text-green-700 dark:text-green-300">Bonus Tokens</span>
                    <span className="font-medium text-green-700 dark:text-green-300">+{selectedPackage.bonus}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{selectedPackage.tokens + selectedPackage.bonus} tokens</span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold">EGP {selectedPackage.price}</div>
                <div className="text-sm text-muted-foreground">
                  ({(selectedPackage.price / (selectedPackage.tokens + selectedPackage.bonus)).toFixed(2)} EGP per token)
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This is a demo — no actual payment will be processed
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)} disabled={isPurchasing}>
              Cancel
            </Button>
            <Button onClick={confirmPurchase} disabled={isPurchasing}>
              {isPurchasing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
