"use client"

import { useEffect, useState } from "react"
import ProductCard from "@/components/ProductCard"
import CategoryCard from "@/components/CategoryCard"
import { Product } from "@/types/product"
import { Products } from "@/lib/products"

export default function TotalProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const data = Products
    setProducts(data)

    const uniqueCategories = [...new Set(data.map((p) => p.category))]
    setCategories(uniqueCategories)
  }, [])

  return (
    <>


      {/* Categories Section */}
      <section className="max-w-6xl mx-auto py-6 px-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <CategoryCard key={category} category={category} />
          ))}
        </div>
      </section>

      
      {/* Products Section */}
      <section className="max-w-6xl mx-auto py-6 px-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">All Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

    
    </>
  )
}
