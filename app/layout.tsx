import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { organizationSchema, webApplicationSchema, faqSchema, breadcrumbSchema } from "./schema"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Free QR Code Generator - Create Custom QR Codes with Logo | Bulk Generator",
  description: "Create unlimited free QR codes instantly! Bulk generate up to 50,000 QR codes with custom colors, logos & designs. Download in PNG, SVG, JPG. No expiration, track scans, edit anytime. Perfect for business, marketing & events.",
  keywords: "free QR code generator, bulk QR code generator, custom QR code with logo, QR code maker, create QR code free, trackable QR codes, dynamic QR codes, QR code design, business QR codes, download QR code PNG SVG, QR code for URL, vCard QR code, WiFi QR code, batch QR generator, print QR codes, commercial QR codes",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "Free QR Code Generator - Create Custom QR Codes with Logo",
    description: "Create unlimited free QR codes with custom designs, logos & colors. Bulk generate up to 50,000 QR codes. Download PNG, SVG, JPG. Track scans & edit anytime.",
    type: "website",
    siteName: "QR Noir Tech",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator - Bulk Create Custom QR Codes",
    description: "Generate unlimited free QR codes with logos & custom designs. Perfect for business, marketing & events.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://www.qrnoirtech.com",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </head>
      <body className={`${geist.className} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
