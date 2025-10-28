import "./globals.css"
import type { Metadata } from "next"
import Script from "next/script"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { CartProvider } from "@/context/CartContext"
import WhatsappButton from "@/components/ui/WhatsappButton"

export const metadata: Metadata = {
  title: "Bin Watan",
  description: "Premium Bike Seat Covers by Bin Watan",
  icons: {
    icon: "/binwatan.jpeg",
    shortcut: "/binwatan.jpeg",
    apple: "/binwatan.jpeg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Analytics (Official Script) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RV02FMCX7E"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RV02FMCX7E');
          `}
        </Script>
      </head>

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
