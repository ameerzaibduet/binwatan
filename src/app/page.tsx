"use client"

import Hero from "@/components/Hero"
import ProductCard from "@/components/ProductCard"
import { useEffect, useState } from "react"
import { Product } from "@/types/product"
import { Products } from "@/lib/products"
import CategoryCard from "@/components/CategoryCard"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const data = Products
    setProducts(data)
    const uniqueCategories = [...new Set(data.map((p) => p.category))]
    setCategories(uniqueCategories)
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <section className="pb-10 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between px-4 md:px-8 gap-10 py-10">
          
          {/* Left Side - Shop by Category + Details */}
          <div className="flex-1 bg-gray-900/95 text-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-800">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-[Georgia,'Times New Roman',serif]">
              Shop by <span className="text-red-500">Category</span>
            </h2>

            <p className="text-gray-300 mb-6 leading-relaxed text-base md:text-lg">
              Discover <span className="font-semibold text-white">Bin Watan</span> — your trusted brand for
              high-quality <span className="text-red-400 font-semibold">bike seat covers</span>.
              We offer <span className="text-red-400 font-semibold">waterproof rexine</span>,
              <span className="text-red-400 font-semibold"> parachute</span>, and other premium materials 
              designed to protect your bike from rain, dust, and sunlight.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold shadow-md hover:scale-105 transition-transform duration-200"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Hero Banner */}
          <div className="flex-1">
            <Hero />
          </div>
        </div>
      </section>

      {/* Product List */}
      <section className="max-w-6xl mx-auto py-10 px-4">
        <h2
          className="
            text-3xl font-semibold font-[Georgia,'Times New Roman',serif]
            text-gray-800 tracking-normal pb-2 mb-6 border-b border-gray-300
          "
        >
          Featured Products
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  )
}
