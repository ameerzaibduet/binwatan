// components/AdminMenu.tsx
import Link from "next/link"

export default function AdminMenu() {
  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <ul className="space-y-4">
        <li>
          <Link href="/admin" className="hover:underline">Dashboard</Link>
        </li>
        <li>
          <Link href="/admin/orders" className="hover:underline">Orders</Link>
        </li>
        <li>
          <Link href="/admin/products" className="hover:underline">Products</Link>
        </li>
        <li>
          <button
            onClick={() => {
              localStorage.removeItem("isAdmin")
              location.href = "/admin/login"
            }}
            className="mt-4 text-red-400 hover:underline"
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  )
}
