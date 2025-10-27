"use client"

import Hero from "@/components/Hero"
import ProductCard from "@/components/ProductCard"
import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import { Product } from "@/types/product"
import { Products } from "@/lib/products"
import Link from "next/link"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const loadProducts = () => {
    const data = Products
    setProducts(data)
    const uniqueCategories = [...new Set(data.map((p) => p.category))]
    setCategories(uniqueCategories)
  }

  useEffect(() => {
    loadProducts()

    const handlePopState = () => {
      if (window.location.pathname === "/") loadProducts()
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 relative">
      {/* ✅ Hero Section with Category Buttons Overlay */}
      <section className="relative bg-white">
        <Hero />

        {/* ✅ Full-width Category Bar Over Banner */}
        <div className="absolute top-0 left-0 w-full flex justify-center z-20">
          <div
            className="
              w-full bg-black/30 backdrop-blur-sm py-3
              flex justify-center
              border-b border-white/20
            "
          >
            <div
              className="
                flex flex-wrap justify-center gap-3 sm:gap-4 
                max-w-6xl px-6
              "
            >
              {categories.map((cat) => (
                <motion.div
                  key={cat}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`/category/${encodeURIComponent(cat)}`}
                    className="
                      px-5 py-2 sm:py-2.5
                      bg-gradient-to-r from-red-600 to-red-800
                      text-white font-medium text-sm sm:text-base
                      rounded-full shadow-md
                      hover:from-red-700 hover:to-red-900 
                      transition-all duration-300
                    "
                  >
                    {cat}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Product List */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2
          className="
            text-2xl sm:text-3xl font-semibold 
            font-[Georgia,'Times New Roman',serif]
            text-gray-800 tracking-normal 
            pb-2 mb-6 border-b border-gray-300
          "
        >
          Featured Products
        </h2>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {products.length > 0 ? (
            products.map((product) => (
              <motion.div key={product.id} variants={cardVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-full">
              No products found.
            </p>
          )}
        </motion.div>
      </section>

      {/* ✅ WhatsApp Floating Button */}
      <a
        href="https://wa.me/923483016937"
        target="_blank"
        rel="noopener noreferrer"
        className="
          fixed bottom-5 right-5 
          bg-green-500 text-white p-3 
          rounded-full shadow-lg 
          hover:scale-110 transition-transform duration-300 
          animate-bounce z-50
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-6 h-6"
        >
          <path d="M20.52 3.48A11.91 11.91 0 0012 0C5.37 0 .02 5.35.02 12a11.9 11.9 0 001.63 6L0 24l6.28-1.63A11.92 11.92 0 0012 24c6.63 0 12-5.35 12-12a11.91 11.91 0 00-3.48-8.52zM12 22a9.92 9.92 0 01-5.06-1.36l-.36-.21-3.72.96.99-3.63-.23-.37A9.94 9.94 0 012.05 12C2.05 6.49 6.49 2.05 12 2.05A9.95 9.95 0 0121.95 12c0 5.51-4.44 9.95-9.95 9.95zm5.2-7.75c-.29-.14-1.72-.85-1.98-.95s-.46-.14-.66.14-.76.95-.94 1.15-.35.21-.64.07a8.17 8.17 0 01-2.4-1.48 9.08 9.08 0 01-1.67-2.06c-.18-.32 0-.49.13-.64.14-.14.32-.35.46-.53s.21-.29.32-.49a.57.57 0 00-.03-.53c-.07-.14-.66-1.6-.9-2.2s-.48-.51-.66-.52h-.56a1.08 1.08 0 00-.77.36c-.26.27-1 1-1 2.42s1.03 2.8 1.17 3c.14.18 2.04 3.1 4.94 4.35.69.3 1.23.48 1.65.61a3.94 3.94 0 001.8.11c.55-.08 1.72-.7 1.97-1.37s.25-1.25.18-1.37-.26-.21-.55-.35z" />
        </svg>
      </a>
    </main>
  )
}
