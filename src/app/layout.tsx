"use client"

import "./globals.css"
import type { Metadata } from "next"
import { useEffect } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { CartProvider } from "@/context/CartContext"
import WhatsappButton from "@/components/ui/WhatsappButton"

// ✅ Fix TypeScript error for window.dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}

export const metadata: Metadata = {
  title: "Bin Watan",
  description: "Premium Bike Seat Covers by Bin Watan",
  icons: {
    icon: "/binwatan.jpeg",
    shortcut: "/binwatan.jpeg",
    apple: "/binwatan.jpeg",
  },
}

// ✅ Your actual GA4 ID
const GA_MEASUREMENT_ID = "G-RV02FMCX7E"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // --- Google Analytics setup ---
    const script = document.createElement("script")
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    script.async = true
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }

    gtag("js", new Date())
    gtag("config", GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
    })

    // --- Optional: CountAPI for visitor count ---
    fetch(`https://api.countapi.xyz/hit/binwatan.com${window.location.pathname}`).catch(() => {})
  }, [])

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
            <WhatsappButton />
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
