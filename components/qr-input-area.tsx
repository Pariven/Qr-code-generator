"use client"

import type React from "react"
import { useState } from "react"

interface QrInputAreaProps {
  qrCodes: string[]
  setQrCodes: (codes: string[]) => void
  setPreviewQr: (qr: string) => void
}

export default function QrInputArea({ qrCodes, setQrCodes, setPreviewQr }: QrInputAreaProps) {
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)

    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 5000)

    setQrCodes(lines)
    if (lines.length > 0) {
      setPreviewQr(lines[0])
    }
  }

  const handleFileDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const files = e.dataTransfer.files

    if (files.length > 0) {
      const file = files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        const content = event.target?.result as string
        setInputValue(content)

        const lines = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .slice(0, 5000)

        setQrCodes(lines)
        if (lines.length > 0) {
          setPreviewQr(lines[0])
        }
      }

      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="qr-input" className="text-foreground font-semibold mb-2 block">
          QR Code Data
        </label>
        <p className="text-muted-foreground text-sm mb-4">
          Enter one URL/text per line or drag a CSV file. Maximum 5,000 codes.
        </p>
      </div>

      <textarea
        id="qr-input"
        value={inputValue}
        onChange={handleInputChange}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        placeholder="https://example.com&#10;Another URL&#10;More data..."
        className="w-full h-56 sm:h-64 p-5 border-2 border-border rounded-lg text-sm resize-none bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium">{qrCodes.length} / 5,000 codes</span>
        {qrCodes.length >= 5000 && <span className="text-destructive font-medium">Maximum reached</span>}
      </div>
    </div>
  )
}
