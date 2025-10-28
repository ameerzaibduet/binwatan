"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import { useState, useEffect } from "react"
import { ShoppingCart, Menu, Home, ListOrdered } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Popover from "@radix-ui/react-popover"
import CartDrawer from "./CartDrawer"
import Image from "next/image"
import { Products } from "@/lib/products"

export default function Navbar() {
  const pathname = usePathname()
  const { cart } = useCart()
  const { isCartOpen, openCart, closeCart } = useCartUI()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    const data = Products
    const uniqueCategories = [...new Set(data.map((p) => p.category))]
    setCategories(uniqueCategories)
  }, [])

  const navItems = [
    { name: "Home", href: "/", icon: <Home size={16} /> },
    { name: "My Orders", href: "/orders", icon: <ListOrdered size={16} /> },
  ]

  return (
    <header className="bg-gradient-to-r from-black to-red-800 shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-nowrap md:flex-wrap justify-between items-center gap-4 overflow-x-auto">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight shrink-0">
          <Image
            alt="Bin Watan"
            src="/images/binwatan.png"
            width={70}
            height={20}
            className="object-contain rounded-md"
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-5 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "text-white border-b border-white pb-0.5"
                  : "text-gray-200 hover:text-white"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}

          {/* Category Links */}
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/category/${encodeURIComponent(cat)}`}
              className={`text-sm font-medium border border-gray-400/30 text-gray-200 hover:text-white hover:border-white/50 px-2.5 py-1 rounded-full transition-all ${
                pathname === `/category/${cat}` ? "bg-white text-black" : ""
              }`}
            >
              {cat}
            </Link>
          ))}

          {/* Cart */}
          <Button
            variant="ghost"
            onClick={openCart}
            className="relative text-white hover:text-gray-200"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 text-xs bg-red-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2 shrink-0 text-white">
          <Button
            variant="ghost"
            onClick={openCart}
            className="relative text-white hover:text-gray-200"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 text-xs bg-red-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>

          <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger asChild>
              <Button variant="ghost" className="text-white hover:text-gray-200">
                <Menu size={20} />
              </Button>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content className="bg-white border p-4 rounded shadow-md w-48 z-50">
                <div className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setPopoverOpen(false)}
                      className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black"
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                  <hr />
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/category/${encodeURIComponent(cat)}`}
                      onClick={() => setPopoverOpen(false)}
                      className="text-sm font-medium text-gray-700 hover:text-black"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>

      <CartDrawer
        open={isCartOpen}
        onOpenChange={(open) => (open ? openCart() : closeCart())}
      />
    </header>
  )
}
