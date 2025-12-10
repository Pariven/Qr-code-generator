"use client"

import { useState } from "react"

interface AutoCreateNumericProps {
  onGenerate: (codes: string[]) => void
}

export default function AutoCreateNumeric({ onGenerate }: AutoCreateNumericProps) {
  const [start, setStart] = useState(1)
  const [end, setEnd] = useState(10)
  const [step, setStep] = useState(1)
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [padZeros, setPadZeros] = useState(false)

  const generateNumericList = () => {
    const codes: string[] = []
    const endValue = Math.min(end, 2000000)

    // Calculate padding width
    const maxLength = endValue.toString().length

    for (let i = start; i <= endValue; i += step) {
      let numStr = i.toString()
      if (padZeros) {
        numStr = numStr.padStart(maxLength, "0")
      }
      codes.push(`${prefix}${numStr}${suffix}`)
    }

    onGenerate(codes)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Column 1 - Choose Numbers */}
        <div className="space-y-3">
          <h3 className="text-foreground font-medium text-sm">Choose Numbers</h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Start</label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">End (max 2,000,000)</label>
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(Math.min(Number(e.target.value), 2000000))}
                max={2000000}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Step</label>
              <input
                type="number"
                value={step}
                onChange={(e) => setStep(Math.max(1, Number(e.target.value)))}
                min={1}
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Column 2 - Add Text */}
        <div className="space-y-3">
          <h3 className="text-foreground font-medium text-sm">Add Text</h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g., ITEM-"
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium mb-1 block">Suffix</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g., -2024"
                className="w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={padZeros}
                onChange={(e) => setPadZeros(e.target.checked)}
                className="w-4 h-4 border border-input rounded accent-primary"
              />
              <span className="text-foreground text-xs">Pad numbers with zeros</span>
            </label>
          </div>
        </div>

        {/* Column 3 - Generate */}
        <div className="flex flex-col justify-end">
          <button
            onClick={generateNumericList}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded text-sm transition-colors"
          >
            Generate List
          </button>
        </div>
      </div>
    </div>
  )
}
