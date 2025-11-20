"use client"

import { useState } from "react"
import JSZip from "jszip"

interface QrResult {
  id: number
  data: string
  qrDataUrl: string | null
  success: boolean
}

interface QrResultsDisplayProps {
  qrCodes: QrResult[]
  onBack: () => void
  settings: any
}

export default function QrResultsDisplay({ qrCodes, onBack, settings }: QrResultsDisplayProps) {
  const [downloading, setDownloading] = useState(false)

  const successCount = qrCodes.filter((q) => q.success).length

  const handleDownloadAll = async () => {
    setDownloading(true)
    try {
      const zip = new JSZip()
      const folder = zip.folder("qr-codes")

      qrCodes.forEach((qr, index) => {
        if (qr.qrDataUrl) {
          const base64 = qr.qrDataUrl.split(",")[1]
          folder?.file(`qr-${index + 1}-${qr.data.slice(0, 20)}.png`, base64, { base64: true })
        }
      })

      const blob = await zip.generateAsync({ type: "blob" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qr-codes-${Date.now()}.zip`
      a.click()
    } catch (error) {
      console.error("[v0] Download error:", error)
      alert("Error downloading QR codes")
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadSingle = (qr: QrResult) => {
    if (qr.qrDataUrl) {
      const a = document.createElement("a")
      a.href = qr.qrDataUrl
      a.download = `qr-${qr.data.slice(0, 20)}.png`
      a.click()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border py-4 px-4 sm:px-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Generated QR Codes</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {successCount} / {qrCodes.length} successfully generated
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-card border border-border rounded-lg transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {successCount > 0 && (
          <div className="mb-6">
            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
            >
              {downloading ? "Preparing..." : "Download All as ZIP"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="flex flex-col">
              <div className="bg-card border border-border rounded-lg p-3 aspect-square flex items-center justify-center mb-2 hover:border-green-500 transition-colors">
                {qr.success && qr.qrDataUrl ? (
                  <img
                    src={qr.qrDataUrl || "/placeholder.svg"}
                    alt={`QR Code ${qr.id + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-xs text-center">
                    <div className="font-mono">Error</div>
                  </div>
                )}
              </div>
              {qr.success && (
                <button
                  onClick={() => handleDownloadSingle(qr)}
                  className="text-xs text-green-500 hover:text-green-600 font-medium truncate"
                >
                  Download
                </button>
              )}
              <p className="text-xs text-muted-foreground truncate mt-1">{qr.data.slice(0, 20)}</p>
            </div>
          ))}
        </div>

        {successCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No QR codes were successfully generated</p>
            <button onClick={onBack} className="text-green-500 hover:text-green-600 font-medium">
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
