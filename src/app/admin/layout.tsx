// app/admin/layout.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaPlus,
  FaDollarSign,
  FaChartBar,
} from "react-icons/fa"
import { Button } from "@/components/ui/button"

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: <FaTachometerAlt /> },
  { name: "Orders", href: "/admin/orders", icon: <FaBoxOpen /> },
  { name: "Add Product", href: "/admin/products", icon: <FaPlus /> },
  { name: "Finance", href: "/admin/finance", icon: <FaDollarSign /> },
  { name: "Stock", href: "/admin/stock", icon: <FaChartBar /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin")
    if (isAdmin !== "true") {
      router.replace("/admin-login")
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("isAdmin")
    router.push("/admin-login")
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition ${
                pathname === item.href ? "bg-gray-200 font-semibold" : ""
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        <Button variant="destructive" className="w-full mt-6" onClick={handleLogout}>
          Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
