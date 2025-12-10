import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bulk QR Generator - Create Up to 5000 QR Codes",
  description: "Generate, customize, and download up to 5000 QR codes instantly. PNG, SVG, JPG formats. Free and fast.",
  keywords: "QR code generator, bulk QR codes, download QR codes",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "Bulk QR Generator",
    description: "Generate up to 5000 QR codes and download them as ZIP",
    type: "website",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
