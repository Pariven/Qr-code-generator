"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { addCredits, formatNumber } from "@/lib/credits"

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id')

      if (!sessionId) {
        setError('Invalid payment session')
        setIsVerifying(false)
        return
      }

      try {
        // Call the new payment verification endpoint
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()

        if (data.success) {
          setIsVerifying(false)
        } else {
          setError(data.error || 'Payment verification failed')
          setIsVerifying(false)
        }
      } catch (err) {
        console.error('Verification error:', err)
        setError('Failed to verify payment')
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verifying Payment...</h2>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we confirm your purchase
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const credits = searchParams.get('credits')
  const price = searchParams.get('price')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-green-600">
              +{formatNumber(parseInt(credits || '0'))}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              credits added to your account
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Amount paid: ${price}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">What's next?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Your credits have been added</li>
              <li>✓ Credits never expire</li>
              <li>✓ Start generating QR codes now</li>
            </ul>
          </div>

          <Button onClick={() => router.push('/')} className="w-full">
            Start Generating QR Codes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Loading...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
