"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Product } from "@/types/product"
import { Products } from "@/lib/products"
import ProductCard from "@/components/ProductCard"

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

  const cardVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 capitalize">
          {categoryName} Products
        </h1>

        {filteredProducts.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
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
          <p className="text-center text-gray-500 mt-10">
            No products found for this category.
          </p>
        )}
      </div>
    </main>
  )
}
