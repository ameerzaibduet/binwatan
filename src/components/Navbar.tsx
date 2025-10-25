"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCart } from "@/lib/use-cart"
import { useAuth } from "@/lib/use-auth"
import { useCartUI } from "@/lib/use-cart-ui"
import { useState } from "react"
import {
  ShoppingCart,
  Menu,
  Home,
  ListOrdered,
  LogOut,
  UserCheck,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Popover from "@radix-ui/react-popover"
import CartDrawer from "./CartDrawer"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { cart } = useCart()
  const { isLoggedIn } = useAuth()
  const { isCartOpen, openCart, closeCart } = useCartUI()
  const [search, setSearch] = useState("")
  const [popoverOpen, setPopoverOpen] = useState(false)

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/products?search=${search}`)
    }
  }

  const navItems = [
    { name: "Home", href: "/", icon: <Home size={18} /> },
    { name: "Orders", href: "/orders", icon: <ListOrdered size={18} /> },
  ]

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-nowrap md:flex-wrap justify-between items-center gap-4 overflow-x-auto">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight shrink-0">
          <Image
            alt="Khan."
            src="/images/binwatan.jpeg"
            width={80}
            height={20}
            className="object-contain"
          />
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-grow max-w-[180px] sm:max-w-md min-w-0">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-1 text-sm font-medium ${
                pathname === item.href
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}

          {isLoggedIn ? (
            <Link
              href="/logout"
              className={`flex items-center gap-1 text-sm font-medium ${
                pathname === "/logout"
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-black"
              }`}
            >
              <LogOut size={18} />
              Logout
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`flex items-center gap-1 text-sm font-medium ${
                  pathname === "/login"
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                <UserCheck size={18} />
                Login
              </Link>
              <Link
                href="/register"
                className={`flex items-center gap-1 text-sm font-medium ${
                  pathname === "/register"
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                <UserPlus size={18} />
                Signup
              </Link>
            </>
          )}

          <Button variant="ghost" onClick={openCart} className="relative">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </nav>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-3 shrink-0">
          <Button variant="ghost" onClick={openCart} className="relative">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>

          <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger asChild>
              <Button variant="ghost">
                <Menu />
              </Button>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content className="bg-white border p-4 rounded shadow-md w-40 z-50">
                <div className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setPopoverOpen(false)}
                      className={`flex items-center gap-1 text-sm font-medium ${
                        pathname === item.href
                          ? "text-blue-600"
                          : "text-gray-700 hover:text-black"
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}

                  {isLoggedIn ? (
                    <Link
                      href="/logout"
                      onClick={() => setPopoverOpen(false)}
                      className={`flex items-center gap-1 text-sm font-medium ${
                        pathname === "/logout"
                          ? "text-blue-600"
                          : "text-gray-700 hover:text-black"
                      }`}
                    >
                      <LogOut size={18} />
                      Logout
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setPopoverOpen(false)}
                        className={`flex items-center gap-1 text-sm font-medium ${
                          pathname === "/login"
                            ? "text-blue-600"
                            : "text-gray-700 hover:text-black"
                        }`}
                      >
                        <UserCheck size={18} />
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setPopoverOpen(false)}
                        className={`flex items-center gap-1 text-sm font-medium ${
                          pathname === "/register"
                            ? "text-blue-600"
                            : "text-gray-700 hover:text-black"
                        }`}
                      >
                        <UserPlus size={18} />
                        Signup
                      </Link>
                    </>
                  )}
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
