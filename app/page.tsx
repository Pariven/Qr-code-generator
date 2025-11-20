"use client"

import { useState } from "react"
import Header from "@/components/header"
import IntroSection from "@/components/intro-section"
import QrInputArea from "@/components/qr-input-area"
import AutoCreateNumeric from "@/components/auto-create-numeric"
import ConfigurableOptions from "@/components/configurable-options"
import QrResultsDisplay from "@/components/qr-results-display"
import Footer from "@/components/footer"

export default function Home() {
  const [qrCodes, setQrCodes] = useState<string[]>([])
  const [previewQr, setPreviewQr] = useState<string>("")
  const [showResults, setShowResults] = useState(false)
  const [generatedQrs, setGeneratedQrs] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandOptions, setExpandOptions] = useState(false)
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

  const handleAutoCreateNumeric = (generatedCodes: string[]) => {
    setQrCodes(generatedCodes)
  }

  const handleGenerate = async () => {
    if (qrCodes.length === 0) {
      alert("Please enter at least one value to generate QR codes")
      return
    }

    if (qrCodes.length > 5000) {
      alert("Maximum 5000 QR codes allowed. Please reduce your input.")
      return
    }

    setIsGenerating(true)
    try {
      const QRCode = (await import("qrcode")).default

      const generated = await Promise.all(
        qrCodes.map(async (data, index) => {
          try {
            const qrDataUrl = await QRCode.toDataURL(data, {
              errorCorrectionLevel: settings.errorCorrection[0].toUpperCase(),
              width: 200,
              color: {
                dark: settings.fgColor,
                light: settings.transparentBg ? "#00000000" : "#ffffff",
              },
            })
            return { id: index, data, qrDataUrl, success: true }
          } catch (error) {
            console.error("[v0] Error generating QR code:", error)
            return { id: index, data, qrDataUrl: null, success: false }
          }
        }),
      )

      setGeneratedQrs(generated)
      setShowResults(true)
    } catch (error) {
      console.error("[v0] Generation error:", error)
      alert("Error generating QR codes. Please try again.")
    } finally {
      setIsGenerating(false)
    }
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="space-y-8">
            {/* QR Input Section - Full Width */}
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
                <p className="text-sm font-semibold text-muted-foreground mb-1">Speed</p>
                <p className="text-2xl font-bold text-foreground">Instant</p>
                <p className="text-xs text-muted-foreground mt-2">No sign-up needed</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
