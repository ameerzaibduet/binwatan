"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import { useState } from "react"
import { ShoppingCart, Menu, ChevronDown, X, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import CartDrawer from "./CartDrawer"
import Image from "next/image"

export default function Navbar() {
  const pathname = usePathname()
  const { cart } = useCart()
  const { isCartOpen, openCart, closeCart } = useCartUI()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const categories = ["Parachute", "Rexine"]

  return (
    <header className="bg-[#1E1E1E] shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center relative">

        {/* Logo + text */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="Bin Watan"
            width={40}
            height={20}
            className="object-contain"
          />
          <span className="text-white font-bold text-lg tracking-wide">
            BIN <span className="text-[#F97316]">WATAN</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-4 relative">
          {/* Home Link */}
          <Link
            href="/"
            className="flex items-center gap-1 text-white bg-transparent hover:text-[#F97316] transition-colors text-sm font-medium"
          >
            <Home size={16} /> Home
          </Link>

          {/* Category Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCategoryOpen(true)}
            onMouseLeave={() => setCategoryOpen(false)}
          >
            <Button
              variant="ghost"
              className="flex items-center gap-1 text-white bg-transparent hover:bg-transparent hover:text-[#F97316] transition-colors"
            >
              Categories <ChevronDown size={16} />
            </Button>

            <AnimatePresence>
              {categoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full mt-1 bg-[#1E1E1E] border border-[#E5E7EB] p-2 rounded shadow-md w-36 z-50"
                >
                  <div className="flex flex-col gap-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/category/${encodeURIComponent(cat)}`}
                        className="text-white hover:text-[#F97316] text-sm font-medium px-2 py-1 rounded transition-colors"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <Button
            variant="ghost"
            onClick={openCart}
            className="relative text-white hover:bg-transparent hover:text-[#F97316]"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 text-xs bg-[#F97316] text-white w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2 text-white">
          {/* Cart */}
          <Button
            variant="ghost"
            onClick={openCart}
            className="relative text-white hover:bg-transparent hover:text-[#F97316]"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 text-xs bg-[#F97316] text-white w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Mobile drawer opener */}
          <Button
            variant="ghost"
            onClick={() => setMobileOpen(true)}
            className="text-white hover:bg-transparent"
          >
            <Menu size={20} />
          </Button>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setMobileOpen(false)}
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                className="fixed top-0 right-0 h-full w-64 bg-[#1E1E1E] shadow-lg z-50 flex flex-col p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white text-lg font-bold">Menu</span>
                  <Button
                    variant="ghost"
                    onClick={() => setMobileOpen(false)}
                    className="text-white hover:bg-transparent"
                  >
                    <X size={20} />
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Home Link */}
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-1 text-white text-base font-medium px-2 py-2 rounded hover:text-[#F97316] transition-colors"
                  >
                    <Home size={16} /> Home
                  </Link>

                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/category/${encodeURIComponent(cat)}`}
                      onClick={() => setMobileOpen(false)}
                      className="text-white text-base font-medium px-2 py-2 rounded hover:text-[#F97316] transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        open={isCartOpen}
        onOpenChange={(open) => (open ? openCart() : closeCart())}
      />
    </header>
  )
}
