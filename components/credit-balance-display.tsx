"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Coins, TrendingUp, ShoppingCart, History, UserPlus } from "lucide-react"
import { formatNumber, type CreditBalance, type Transaction } from "@/lib/credits"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface CreditBalanceDisplayProps {
  onBuyCredits?: () => void
  refresh?: number // Trigger for refreshing balance
}

export default function CreditBalanceDisplay({ onBuyCredits, refresh }: CreditBalanceDisplayProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [balance, setBalance] = useState<CreditBalance>({
    total: 0,
    used: 0,
    remaining: 0,
    lastUpdated: new Date().toISOString(),
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    // Load balance and transactions from database
    const loadData = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = Date.now()
        
        // Check authentication first
        const sessionResponse = await fetch(`/api/auth/session?t=${timestamp}`, {
          cache: 'no-store'
        })
        const sessionData = await sessionResponse.json()
        setIsAuthenticated(sessionData.isLoggedIn)

        if (!sessionData.isLoggedIn) {
          return
        }

        const balanceResponse = await fetch(`/api/credits/balance?t=${timestamp}`, {
          cache: 'no-store'
        })
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          setBalance(balanceData)
        }

        const transactionsResponse = await fetch(`/api/credits/transactions?t=${timestamp}`, {
          cache: 'no-store'
        })
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactions(transactionsData.map((t: any) => ({
            id: t.id.toString(),
            type: t.type,
            amount: parseFloat(t.amount),
            credits: t.credits,
            timestamp: t.created_at,
            description: t.description,
          })))
        }
      } catch (error) {
        console.error("Failed to load credit data:", error)
      }
    }

    loadData()

    // Set up interval to check for updates
    const interval = setInterval(loadData, 5000)

    return () => clearInterval(interval)
  }, [refresh])

  const usagePercentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0
  
  // Calculate free vs purchased credits
  const freeCredits = Math.min(balance.total, 100)
  const purchasedCredits = Math.max(0, balance.total - 100)
  const freeCreditsRemaining = Math.max(0, Math.min(freeCredits - balance.used, freeCredits))
  const purchasedCreditsRemaining = Math.max(0, balance.remaining - freeCreditsRemaining)

  // Show signup prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Get 100 Free QR Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-6">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Coins className="w-10 h-10 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">
                100 FREE
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                QR Code Credits
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Sign up in 30 seconds</p>
                <p>✓ No credit card required</p>
                <p>✓ Credits never expire</p>
              </div>
            </div>

            <Button 
              onClick={() => router.push("/register")} 
              className="w-full"
              size="lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up Free
            </Button>

            <div className="text-center">
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? <span className="text-primary">Sign In</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-medium">Why sign up?</p>
              <ul className="space-y-1 ml-4">
                <li>• Generate up to 100 QR codes free</li>
                <li>• Save your credits across devices</li>
                <li>• Access to bulk generation</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            QR Credit Balance
          </CardTitle>
          {balance.used < 100 && (
            <p className="text-xs text-muted-foreground mt-1">
              🎉 Free Tier: {100 - balance.used} free QR codes remaining
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-primary">
              {formatNumber(balance.remaining)}
            </div>
            <div className="text-sm text-muted-foreground">
              / {formatNumber(balance.total)} credits
            </div>
          </div>

          {/* Credit Breakdown */}
          {balance.total > 0 && (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Free: <span className="font-medium text-foreground">{formatNumber(freeCreditsRemaining)}</span></span>
                </div>
                {purchasedCredits > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">Purchased: <span className="font-medium text-foreground">{formatNumber(purchasedCreditsRemaining)}</span></span>
                  </div>
                )}
              </div>

              {/* Multi-color Progress Bar */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-green-500 transition-all"
                  style={{ width: `${(freeCreditsRemaining / balance.total) * 100}%` }}
                ></div>
                <div 
                  className="absolute top-0 h-full bg-blue-500 transition-all"
                  style={{ 
                    left: `${(freeCreditsRemaining / balance.total) * 100}%`,
                    width: `${(purchasedCreditsRemaining / balance.total) * 100}%`
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{balance.remaining > 0 ? `${formatNumber(balance.remaining)} available` : 'No credits remaining'}</span>
                <span>{formatNumber(balance.used)} used</span>
              </div>
            </div>
          )}

          {balance.remaining === 0 && (
            <Badge variant="destructive" className="w-full justify-center py-2">
              No Credits Available
            </Badge>
          )}

          {balance.remaining > 0 && balance.remaining < 100 && (
            <Badge variant="outline" className="w-full justify-center py-2 border-yellow-500 text-yellow-600">
              Low Balance - Consider Buying More
            </Badge>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={onBuyCredits} 
              className="flex-1"
              variant={balance.remaining === 0 ? "default" : "outline"}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>

            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Transaction History</DialogTitle>
                  <DialogDescription>
                    View all your credit purchases and usage
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction, index) => (
                        <div key={transaction.id}>
                          <div className="flex items-start justify-between py-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {transaction.type === "purchase" ? (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Coins className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="font-medium text-sm">
                                  {transaction.description}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(transaction.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-semibold ${transaction.type === "purchase" ? "text-green-600" : "text-gray-600"}`}>
                                {transaction.type === "purchase" ? "+" : "-"}
                                {formatNumber(transaction.credits)}
                              </div>
                              {transaction.type === "purchase" && (
                                <div className="text-xs text-muted-foreground">
                                  ${transaction.amount}
                                </div>
                              )}
                            </div>
                          </div>
                          {index < transactions.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {balance.total > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Purchased</div>
            <div className="text-xl font-bold">{formatNumber(balance.total)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">QR Codes Generated</div>
            <div className="text-xl font-bold">{formatNumber(balance.used)}</div>
          </Card>
        </div>
      )}
    </div>
  )
}
