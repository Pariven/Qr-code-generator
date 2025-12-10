"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, CreditCard, Loader2 } from "lucide-react"
import { PRICING_TIERS, formatNumber, calculateCreditsPerDollar, type PricingTier } from "@/lib/credits"
import { getStripe } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"

interface PricingCardsProps {
  onPurchaseComplete?: () => void
}

export default function PricingCards({ onPurchaseComplete }: PricingCardsProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSelectTier = async (tier: PricingTier) => {
    try {
      setLoadingTier(tier.id)

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId: tier.id,
          tierName: tier.name,
          price: tier.price,
          credits: tier.credits,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      const { error: stripeError } = await stripe!.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingTier(null)
    }
  }

  const bestValue = PRICING_TIERS[7] // Ultimate tier (500k credits)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 py-8">
        {PRICING_TIERS.map((tier) => {
          const creditsPerDollar = calculateCreditsPerDollar(tier)
          const isBestValue = tier.id === bestValue.id

          return (
            <Card 
              key={tier.id} 
              className={`relative flex flex-col ${isBestValue ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {isBestValue && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Zap className="w-3 h-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>
                  <div className="text-3xl font-bold text-foreground mt-2">
                    ${tier.price}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatNumber(tier.credits)} QR credits
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Generate up to <strong>{formatNumber(tier.credits)}</strong> QR codes
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Credits never expire</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">All output formats (PNG, SVG, JPG)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Bulk generation support</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      {creditsPerDollar.toFixed(0)} credits per $1
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  onClick={() => handleSelectTier(tier)}
                  className="w-full"
                  variant={isBestValue ? "default" : "outline"}
                  disabled={loadingTier !== null}
                >
                  {loadingTier === tier.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Purchase Credits'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </>
  )
}
