"use client"

import { useParams } from "next/navigation"
import { Products } from "@/lib/products"
import ProductCard from "@/components/ProductCard"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id
  const product = Products.find((p) => p.id === productId)

  if (!product) return <p className="text-center mt-20">Product not found</p>

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <ProductCard product={product} />
    </div>
  )
}
