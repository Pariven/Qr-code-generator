// Credit/Token Management System

export interface PricingTier {
  id: string
  name: string
  price: number
  credits: number
  popular?: boolean
}

export const PRICING_TIERS: PricingTier[] = [
  { id: "tier-1", name: "Starter", price: 5, credits: 1000 },
  { id: "tier-2", name: "Basic", price: 15, credits: 5000 },
  { id: "tier-3", name: "Standard", price: 25, credits: 10000 },
  { id: "tier-4", name: "Professional", price: 40, credits: 20000 },
  { id: "tier-5", name: "Business", price: 80, credits: 50000, popular: true },
  { id: "tier-6", name: "Enterprise", price: 120, credits: 100000 },
  { id: "tier-7", name: "Premium", price: 250, credits: 250000 },
  { id: "tier-8", name: "Ultimate", price: 400, credits: 500000 },
  { id: "tier-9", name: "Platinum", price: 700, credits: 1000000 },
  { id: "tier-10", name: "Diamond", price: 1600, credits: 2000000 },
]

export interface CreditBalance {
  total: number
  used: number
  remaining: number
  lastUpdated: string
}

export interface Transaction {
  id: string
  type: "purchase" | "usage"
  amount: number
  credits: number
  timestamp: string
  description: string
}

// Local storage keys
const STORAGE_KEYS = {
  BALANCE: "noir_qr_credit_balance",
  TRANSACTIONS: "noir_qr_transactions",
}

// Get current credit balance
export const getCreditBalance = (): CreditBalance => {
  if (typeof window === "undefined") {
    return { total: 0, used: 0, remaining: 0, lastUpdated: new Date().toISOString() }
  }

  const stored = localStorage.getItem(STORAGE_KEYS.BALANCE)
  if (!stored) {
    const initial: CreditBalance = {
      total: 100,
      used: 0,
      remaining: 100,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(initial))
    return initial
  }

  return JSON.parse(stored)
}

// Add credits (after purchase)
export const addCredits = (credits: number, price: number): CreditBalance => {
  const balance = getCreditBalance()
  const newBalance: CreditBalance = {
    total: balance.total + credits,
    used: balance.used,
    remaining: balance.remaining + credits,
    lastUpdated: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(newBalance))

  // Record transaction
  addTransaction({
    id: `txn_${Date.now()}`,
    type: "purchase",
    amount: price,
    credits: credits,
    timestamp: new Date().toISOString(),
    description: `Purchased ${credits.toLocaleString()} QR credits for $${price}`,
  })

  return newBalance
}

// Use credits (when generating QR codes)
export const useCredits = (count: number): { success: boolean; balance?: CreditBalance; error?: string } => {
  const balance = getCreditBalance()

  if (balance.remaining < count) {
    return {
      success: false,
      error: `Insufficient credits. You need ${count} credits but only have ${balance.remaining} remaining.`,
    }
  }

  const newBalance: CreditBalance = {
    total: balance.total,
    used: balance.used + count,
    remaining: balance.remaining - count,
    lastUpdated: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(newBalance))

  // Record transaction
  addTransaction({
    id: `txn_${Date.now()}`,
    type: "usage",
    amount: 0,
    credits: count,
    timestamp: new Date().toISOString(),
    description: `Generated ${count} QR code${count > 1 ? "s" : ""}`,
  })

  return { success: true, balance: newBalance }
}

// Get transaction history
export const getTransactions = (): Transaction[] => {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
  if (!stored) return []

  return JSON.parse(stored)
}

// Add transaction to history
const addTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions()
  transactions.unshift(transaction) // Add to beginning

  // Keep only last 100 transactions
  if (transactions.length > 100) {
    transactions.splice(100)
  }

  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
}

// Calculate best value (credits per dollar)
export const calculateCreditsPerDollar = (tier: PricingTier): number => {
  return tier.credits / tier.price
}

// Get best value tier
export const getBestValueTier = (): PricingTier => {
  return PRICING_TIERS.reduce((best, current) => {
    return calculateCreditsPerDollar(current) > calculateCreditsPerDollar(best) ? current : best
  })
}

// Format number with commas
export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// Reset balance (for testing/admin purposes)
export const resetBalance = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.BALANCE)
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
  }
}
