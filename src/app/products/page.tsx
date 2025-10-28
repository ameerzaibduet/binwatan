"use client"

import { useParams } from "next/navigation"
import { Products } from "@/lib/products"
import ProductCard from "@/components/ProductCard"
import { motion } from "framer-motion"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id
  const product = Products.find((p) => p.id === productId)

  if (!product) return <p className="text-center mt-20">Product not found</p>

  // ✅ Filter other products in the same category
  const relatedProducts = Products.filter(
    (p) => p.category === product.category && p.id !== product.id
  )

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* ✅ Main Product */}
      <div className="mb-16">
        <ProductCard product={product} />
      </div>

      {/* ✅ Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2
            className="
              text-2xl sm:text-3xl font-semibold 
              font-[Georgia,'Times New Roman',serif]
              text-gray-800 tracking-normal 
              pb-2 mb-6 border-b border-gray-300
            "
          >
            Related Products
          </h2>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}
