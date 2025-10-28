"use client"

import Hero from "@/components/Hero"
import ProductCard from "@/components/ProductCard"
import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import { Product } from "@/types/product"
import { Products } from "@/lib/products"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])

  const loadProducts = () => {
    const data = Products
    setProducts(data)
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
      {/* ✅ Hero Section */}
      <section className="relative bg-white">
        <Hero />
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
            products.map((product, index) => (
              <motion.div
                key={product.id}
                variants={cardVariants}
                initial={index < 4 ? "visible" : "hidden"} // ✅ Show first row by default
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
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
