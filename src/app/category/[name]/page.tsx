"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Product } from "@/types/product"
import { Products } from "@/lib/products"
import ProductCard from "@/components/ProductCard"
import type { Variants } from "framer-motion"

export default function CategoryPage() {
  const params = useParams()
  const categoryName = decodeURIComponent(params.name as string)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    const data = Products.filter(
      (p) => p.category.toLowerCase() === categoryName.toLowerCase()
    )
    setFilteredProducts(data)
  }, [categoryName])

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12 },
    },
  }

  const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-16">

      {/* ⭐ Category Banner */}
      <div className="relative h-44 w-full mb-10 overflow-hidden rounded-b-3xl shadow-sm">

        {/* Background (auto picks product image if exists) */}
        <img
          src={filteredProducts[0]?.image || "/placeholder.jpg"}
          alt="bg"
          className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />

        {/* Category Title */}
        <div className="absolute bottom-5 left-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg capitalize">
            {categoryName}
          </h1>
          <p className="text-gray-200 mt-1 text-sm tracking-wide">
            Explore premium {categoryName} products
          </p>
        </div>
      </div>

      {/* ⭐ Products Section */}
      <div className="max-w-6xl mx-auto px-4">

        {filteredProducts.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={cardVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="text-center text-gray-500 mt-10 text-lg">
            No products found in this category.
          </p>
        )}
      </div>
    </main>
  )
}
