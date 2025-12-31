// components/AdminMenu.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react"; // optional icons

export default function AdminMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    location.href = "/admin/login";
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 bg-gray-800 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white p-4 transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:min-h-screen`}
      >
        <h2 className="text-xl font-bold mb-6 hidden md:block">Admin Panel</h2>
        <ul className="space-y-4">
          <li>
            <Link href="/admin" className="hover:underline block" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/orders" className="hover:underline block" onClick={() => setIsOpen(false)}>
              Orders
            </Link>
          </li>
          <li>
            <Link href="/admin/products" className="hover:underline block" onClick={() => setIsOpen(false)}>
              Products
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="mt-4 text-red-400 hover:underline block"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Overlay for mobile when menu is open */}
      {isOpen && <div className="fixed inset-0 bg-black opacity-50 md:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
  );
}
