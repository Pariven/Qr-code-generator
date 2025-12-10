"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import IntroSection from "@/components/intro-section"
import QrInputArea from "@/components/qr-input-area"
import AutoCreateNumeric from "@/components/auto-create-numeric"
import ConfigurableOptions from "@/components/configurable-options"
import QrResultsDisplay from "@/components/qr-results-display"
import Footer from "@/components/footer"
import CreditBalanceDisplay from "@/components/credit-balance-display"
import PricingCards from "@/components/pricing-cards"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [qrCodes, setQrCodes] = useState<string[]>([])
  const [previewQr, setPreviewQr] = useState<string>("")
  const [showResults, setShowResults] = useState(false)
  const [generatedQrs, setGeneratedQrs] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandOptions, setExpandOptions] = useState(false)
  const [activeTab, setActiveTab] = useState<"generator" | "pricing">("generator")
  const [refreshBalance, setRefreshBalance] = useState(0)
  const [settings, setSettings] = useState({
    errorCorrection: "Medium",
    pixelsPerBlock: 10,
    borderBlocks: 2,
    separator: "\n",
    addDataString: false,
    treatAsCSV: false,
    addFilename: false,
    fontSize: "Medium",
    rotate: "None",
    fgColor: "#000000",
    transparentBg: false,
    outputFormat: "PNG",
  })

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      
      setIsAuthenticated(data.isLoggedIn)
    } catch (error) {
      console.error("Auth check error:", error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoCreateNumeric = (generatedCodes: string[]) => {
    setQrCodes(generatedCodes)
  }

  const handleGenerate = async () => {
    if (qrCodes.length === 0) {
      alert("Please enter at least one value to generate QR codes")
      return
    }

    if (qrCodes.length > 2000000) {
      alert("Maximum 2,000,000 QR codes allowed. Please reduce your input.")
      return
    }

    // Check if user is authenticated before generating
    if (!isAuthenticated) {
      const shouldLogin = confirm(
        "Sign up to get 100 FREE QR credits!\n\nCreate an account to generate QR codes.\n\nClick OK to sign up now."
      )
      if (shouldLogin) {
        router.push("/register")
      }
      return
    }

    // Check if user has enough credits from database
    try {
      const balanceResponse = await fetch("/api/credits/balance")
      const balance = await balanceResponse.json()

      const totalUsageAfter = balance.used + qrCodes.length
      
      // Free tier: Up to 100 QR codes total
      if (totalUsageAfter > 100 && balance.remaining < qrCodes.length) {
        const buyMore = confirm(
          `Free tier limit reached!\n\nYou've used ${balance.used} QR codes from your free 100 credits.\nYou need ${qrCodes.length} more credits but only have ${balance.remaining} remaining.\n\nWould you like to purchase more credits?`
        )
        if (buyMore) {
          setActiveTab("pricing")
        }
        return
      }
    } catch (error) {
      console.error("Credit check error:", error)
      alert("Failed to check credits. Please try again.")
      return
    }

    setIsGenerating(true)
    try {
      const QRCode = (await import("qrcode")).default

      const generated = await Promise.all(
        qrCodes.map(async (data, index) => {
          try {
            // Map error correction level to QRCode library format
            const errorCorrectionMap: { [key: string]: 'L' | 'M' | 'Q' | 'H' } = {
              'Low': 'L',
              'Medium': 'M',
              'Quartile': 'Q',
              'High': 'H'
            }
            const errorLevel = errorCorrectionMap[settings.errorCorrection] || 'M'
            
            let qrDataUrl: string
            
            // Calculate width based on pixels per block (each block/module is this many pixels)
            const width = settings.pixelsPerBlock * 25 // approximate QR code module count
            const margin = settings.borderBlocks
            
            if (settings.outputFormat === "SVG") {
              // For SVG, use toString method
              qrDataUrl = await QRCode.toString(data, {
                errorCorrectionLevel: errorLevel,
                type: 'svg',
                width: width,
                margin: margin,
                color: {
                  dark: settings.fgColor,
                  light: settings.transparentBg ? "#00000000" : "#ffffff",
                },
              })
              // Convert SVG string to data URL
              qrDataUrl = 'data:image/svg+xml;base64,' + btoa(qrDataUrl)
            } else {
              // For PNG and JPG, use toDataURL
              const mimeType = settings.outputFormat === "JPG" ? "image/jpeg" : "image/png"
              qrDataUrl = await QRCode.toDataURL(data, {
                errorCorrectionLevel: errorLevel,
                width: width,
                margin: margin,
                type: mimeType,
                rendererOpts: {
                  quality: settings.outputFormat === "JPG" ? 0.92 : undefined,
                },
                color: {
                  dark: settings.fgColor,
                  light: settings.transparentBg ? "#00000000" : "#ffffff",
                },
              })
            }
            
            return { id: index, data, qrDataUrl, success: true }
          } catch (error) {
            console.error("[v0] Error generating QR code:", error)
            return { id: index, data, qrDataUrl: null, success: false }
          }
        }),
      )

      // Deduct credits from database after successful generation
      try {
        const useCreditsResponse = await fetch("/api/credits/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: qrCodes.length }),
        })

        if (!useCreditsResponse.ok) {
          const error = await useCreditsResponse.json()
          alert(error.error || "Failed to deduct credits")
          return
        }
      } catch (error) {
        console.error("Credit deduction error:", error)
        alert("Failed to deduct credits. Please try again.")
        return
      }

      setGeneratedQrs(generated)
      setShowResults(true)
      setRefreshBalance(prev => prev + 1) // Trigger balance refresh
    } catch (error) {
      console.error("[v0] Generation error:", error)
      alert("Error generating QR codes. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePurchaseComplete = () => {
    setRefreshBalance(prev => prev + 1)
    setActiveTab("generator")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (showResults) {
    return <QrResultsDisplay qrCodes={generatedQrs} onBack={() => setShowResults(false)} settings={settings} />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        {/* Hero/Intro Section */}
        <div className="bg-gradient-to-b from-background to-muted/20 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <IntroSection />
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "generator" | "pricing")}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="generator">QR Generator</TabsTrigger>
              <TabsTrigger value="pricing">Buy Credits</TabsTrigger>
            </TabsList>

            <TabsContent value="generator">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Generator */}
                <div className="lg:col-span-2 space-y-8">
                  {/* QR Input Section */}
                  <div className="bg-card border border-border/50 rounded-lg p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground">Enter Your Data</h2>
                    </div>
                    <QrInputArea qrCodes={qrCodes} setQrCodes={setQrCodes} setPreviewQr={setPreviewQr} />
                  </div>

                  {/* Auto-Create Numeric Codes Section */}
                  <div className="bg-card border border-border/50 rounded-lg p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground">Auto-Create Numeric Codes</h2>
                    </div>
                    <AutoCreateNumeric onGenerate={handleAutoCreateNumeric} />
                  </div>

                  {/* Options Section - Collapsible */}
                  <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => setExpandOptions(!expandOptions)}
                      className="w-full px-6 sm:px-8 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-xs font-bold">3</span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Customize Settings</h2>
                      </div>
                      <span
                        className={`text-muted-foreground transition-transform duration-200 ${expandOptions ? "rotate-180" : ""}`}
                      >
                        ▼
                      </span>
                    </button>
                    {expandOptions && (
                      <div className="border-t border-border/50 px-6 sm:px-8 py-6 bg-muted/20">
                        <ConfigurableOptions settings={settings} updateSetting={updateSetting} />
                      </div>
                    )}
                  </div>

                  {/* Generate Button - Large and Prominent */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || qrCodes.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground text-white font-semibold py-4 sm:py-5 px-6 rounded-lg transition-all duration-200 text-base sm:text-lg shadow-md hover:shadow-lg disabled:shadow-none"
                  >
                    {isGenerating
                      ? "Generating..."
                      : `Generate ${qrCodes.length > 0 ? qrCodes.length : 1} QR Code${qrCodes.length !== 1 ? "s" : ""}`}
                  </button>

                  {/* Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card border border-border/50 rounded-lg p-4 sm:p-5">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Limit</p>
                      <p className="text-2xl font-bold text-foreground">5,000</p>
                      <p className="text-xs text-muted-foreground mt-2">Codes per batch</p>
                    </div>
                    <div className="bg-card border border-border/50 rounded-lg p-4 sm:p-5">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Formats</p>
                      <p className="text-2xl font-bold text-foreground">3</p>
                      <p className="text-xs text-muted-foreground mt-2">PNG, SVG, JPG</p>
                    </div>
                    <div className="bg-card border border-border/50 rounded-lg p-4 sm:p-5">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Credits</p>
                      <p className="text-2xl font-bold text-foreground">Never Expire</p>
                      <p className="text-xs text-muted-foreground mt-2">Buy once, use forever</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Credit Balance */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <CreditBalanceDisplay 
                      onBuyCredits={() => setActiveTab("pricing")}
                      refresh={refreshBalance}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              <div className="space-y-8">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl font-bold mb-4">Purchase QR Credits</h2>
                  <p className="text-muted-foreground text-lg">
                    Buy credits once and use them forever. No expiration, no monthly fees.
                    Each credit = 1 QR code generation.
                  </p>
                </div>
                
                <PricingCards onPurchaseComplete={handlePurchaseComplete} />
                
                <div className="bg-card border border-border/50 rounded-lg p-6 max-w-3xl mx-auto">
                  <h3 className="font-semibold text-lg mb-4">Why Noir Intelligence QR?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✓ Credits never expire - use them at your own pace</li>
                    <li>✓ Generate up to 5,000 QR codes at once</li>
                    <li>✓ Multiple output formats: PNG, SVG, JPG</li>
                    <li>✓ Customizable error correction, colors, and sizes</li>
                    <li>✓ Bulk download with ZIP support</li>
                    <li>✓ No monthly subscriptions or hidden fees</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
