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
  FaSignOutAlt,
} from "react-icons/fa"
import { Button } from "@/components/ui/button"
import CourierProviderSelector from "@/components/admin/CourierProviderSelector"

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: <FaTachometerAlt /> },
  { name: "Orders", href: "/admin/orders", icon: <FaBoxOpen /> },
  { name: "Manual Dashboard", href: "/admin/stock", icon: <FaChartBar /> },
  { name: "Create Order", href: "/admin/create", icon: <FaPlus /> },

  { name: "Finance", href: "/admin/finance", icon: <FaDollarSign /> },
  
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin")
    if (isAdmin !== "true") {
      router.replace("/admin-login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isAdmin")
    router.push("/admin-login")
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Mobile Top Navigation (Icons Only) */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b flex items-center justify-between px-4 py-3 shadow-sm">
        <nav className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xl p-2 rounded-md transition-colors ${
                pathname === item.href ? "text-orange-400 bg-orange-50" : "text-gray-500"
              }`}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="text-red-500 p-2">
          <FaSignOutAlt size={20} />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 sticky top-0 h-screen">
        <div className="mb-8 px-4">
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Admin Panel</h2>
          <p className="text-xs text-gray-400 mt-1 uppercase font-semibold">Management</p>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-orange-400 text-white shadow-lg shadow-orange-200" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className={`text-lg ${isActive ? "text-white" : "text-gray-400 group-hover:text-orange-400"}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="pt-6 mt-6 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl" 
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full">
        {pathname !== "/admin-login" && (
          <div className="mb-8">
            <CourierProviderSelector />
          </div>
        )}
        {children}
      </main>
    </div>
  )
}