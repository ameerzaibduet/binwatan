import "./globals.css"
import type { Metadata } from "next"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { CartProvider } from "@/context/CartContext"
import WhatsappButton from "@/components/ui/WhatsappButton"
export const metadata: Metadata = {
  title: "Bin Watan",
  description: "Premium Bike Seat Covers by Bin Watan",
  icons: {
    icon: "/binwatan.jpeg", // ✅ must be inside /public
    shortcut: "/binwatan.jpeg", // ✅ for older browsers
    apple: "/binwatan.jpeg", // ✅ for iPhones/iPads
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          <Navbar />
          <main className="flex-grow">{children} <WhatsappButton/> </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
