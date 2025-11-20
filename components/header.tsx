"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b border-border/40 sticky top-0 bg-background/98 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-sm flex items-center justify-center">
              <span className="text-white text-sm font-bold">QR</span>
            </div>
            <span className="text-lg font-semibold text-foreground">QR Generator</span>
          </div>
          {/* Navigation */}
          <nav className="flex items-center gap-6 sm:gap-8 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
              Home
            </Link>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
              FAQ
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
