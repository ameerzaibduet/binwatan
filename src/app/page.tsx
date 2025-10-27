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
          Top Products
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
    </main>
  )
}
