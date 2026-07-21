export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "QR Noir Tech",
  "url": "https://www.qrnoirtech.com",
  "logo": "https://www.qrnoirtech.com/icon.svg",
  "description": "Free QR Code Generator - Create unlimited custom QR codes with logos, colors and designs. Bulk generate up to 50,000 QR codes for business, marketing and events.",
  "sameAs": [
    "https://www.facebook.com/qrnoirtech",
    "https://twitter.com/qrnoirtech",
    "https://www.linkedin.com/company/qrnoirtech"
  ]
}

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "QR Noir Tech - Free QR Code Generator",
  "url": "https://www.qrnoirtech.com",
  "description": "Create unlimited free QR codes instantly. Bulk generate up to 50,000 custom QR codes with logos, colors and designs. Download in PNG, SVG, JPG formats. Track scans, edit anytime. Perfect for business cards, marketing campaigns, events, and product packaging.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Bulk QR code generation up to 50,000 codes",
    "Custom QR code design with logos and colors",
    "Multiple download formats: PNG, SVG, JPG",
    "Trackable QR codes with scan analytics",
    "Dynamic QR codes - edit content anytime",
    "Credits valid for 1 year (lifetime for $400+ purchases)",
    "Free 100 QR codes on signup",
    "Commercial use allowed",
    "High resolution print quality",
    "URL, vCard, WiFi, Email, SMS QR codes"
  ],
  "softwareVersion": "1.0",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "4500",
    "bestRating": "5",
    "worstRating": "1"
  }
}

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is the QR code generator really free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Our QR code generator is 100% free. You get 100 free QR credits when you sign up, and all generated QR codes work forever with no expiration or scan limits. You can purchase additional credits for bulk generation."
      }
    },
    {
      "@type": "Question",
      "name": "How many QR codes can I generate at once?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can bulk generate up to 50,000 QR codes in a single batch. This makes it perfect for large marketing campaigns, events, product packaging, or business needs."
      }
    },
    {
      "@type": "Question",
      "name": "Can I customize QR codes with my logo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! You can fully customize your QR codes with custom colors, add your company logo, adjust error correction levels, and choose different output formats (PNG, SVG, JPG)."
      }
    },
    {
      "@type": "Question",
      "name": "Do the QR codes expire?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No, QR codes generated with QR Noir Tech never expire and work forever. There are no scanning limits or time restrictions."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use the QR codes for commercial purposes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely! All QR codes created with our generator are free for commercial use. Use them for business cards, marketing materials, product packaging, advertisements, and more."
      }
    },
    {
      "@type": "Question",
      "name": "What formats can I download QR codes in?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can download QR codes in PNG, SVG, and JPG formats with high resolution suitable for both digital and print use."
      }
    }
  ]
}

export const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.qrnoirtech.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "QR Code Generator",
      "item": "https://www.qrnoirtech.com"
    }
  ]
}
