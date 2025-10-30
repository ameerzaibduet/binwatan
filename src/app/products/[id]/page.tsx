"use client"

import { use } from "react"
import { useState } from "react"
import { notFound, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Products } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import clsx from "clsx"

type Props = {
  params: Promise<{ id: string }>
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params)
  const product = Products.find((p) => p.id === id)
  const router = useRouter()
  const { addToCart } = useCart()
  const { openCart, closeCart } = useCartUI()

  if (!product) return notFound()

  const [selectedColor, setSelectedColor] = useState(
    product.colors?.find((c) => c.default) || product.colors?.[0]
  )
  const [selectedCC, setSelectedCC] = useState("70cc")

  const handleAddToCart = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name, bikeType: selectedCC })
    openCart()
  }

  const handleBuyNow = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name, bikeType: selectedCC })
    closeCart()
    router.push("/checkout")
  }

  const relatedProducts = Products.filter(
    (p) => p.category === product.category && p.id !== product.id
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left Side — Product Image + Color Gallery */}
        <div>
          {/* Zoomable Main Image */}
          <div
            className="relative overflow-hidden rounded-lg group shadow-lg"
            style={{ height: 400 }}
          >
            <Image
              src={selectedColor?.image || product.colors?.[0]?.image || "/placeholder.jpg"}
              alt={product.name}
              width={500}
              height={400}
              className="transition-transform duration-300 ease-in-out group-hover:scale-150 object-cover w-full h-full"
              style={{ transformOrigin: "center center" }}
              onMouseMove={(e) => {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - left) / width) * 100
                const y = ((e.clientY - top) / height) * 100
                e.currentTarget.style.transformOrigin = `${x}% ${y}%`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transformOrigin = "center center"
              }}
            />
          </div>

          {/* Color Gallery with Arrows */}
          {product.colors?.length > 0 && (
            <div className="mt-5 relative">
              <p className="text-sm font-medium mb-2">Available Covers:</p>

              <div className="relative">
                {/* Left Gradient + Arrow */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
                <button
                  onClick={() => {
                    const container = document.getElementById("color-gallery")
                    if (container) container.scrollBy({ left: -200, behavior: "smooth" })
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border rounded-full shadow-md w-8 h-8 flex items-center justify-center z-20 hover:bg-gray-100"
                >
                  ‹
                </button>

                {/* Scrollable Color Gallery */}
                <div
                  id="color-gallery"
                  className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                >
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={clsx(
                        "relative flex-shrink-0 border-2 rounded-lg overflow-hidden cursor-pointer transition-transform duration-200",
                        selectedColor?.name === color.name
                          ? "border-black scale-105"
                          : "border-gray-300"
                      )}
                      title={color.name}
                    >
                      <Image
                        src={color.image}
                        alt={color.name}
                        width={140}
                        height={140}
                        className="object-cover w-32 h-32 sm:w-36 sm:h-36"
                      />
                      {selectedColor?.name === color.name && (
                        <div className="absolute top-2 right-2 bg-white text-black text-xs rounded-full px-1 font-bold">
                          ✓
                        </div>
                      )}
                      <span className="block text-center text-sm mt-1 font-medium">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right Gradient + Arrow */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
                <button
                  onClick={() => {
                    const container = document.getElementById("color-gallery")
                    if (container) container.scrollBy({ left: 200, behavior: "smooth" })
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border rounded-full shadow-md w-8 h-8 flex items-center justify-center z-20 hover:bg-gray-100"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side — Product Info */}
        <div>
          <h3 className="text-3xl font-bold mb-3">
            {product.name}{" "}
            <span className="text-2xl text-blue-600 mb-6">PKR {product.price}</span>
          </h3>

          {/* Description */}
          <ul className="mb-8 text-sm text-gray-800 grid grid-cols-2 gap-x-4 gap-y-3">
            {product.description.split("\n").map((line, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span>{line.trim()}</span>
              </li>
            ))}
          </ul>

          {/* Availability for 70cc / 125cc */}
          <div className="mb-6">
            <p className="font-medium mb-2">Available For:</p>
            <div className="flex gap-4">
              {["70cc", "125cc"].map((cc) => (
                <button
                  key={cc}
                  onClick={() => setSelectedCC(cc)}
                  className={clsx(
                    "px-5 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                    selectedCC === cc
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300 hover:border-black"
                  )}
                >
                  {cc}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Info */}
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              Selected Color:{" "}
              <span className="font-semibold">{selectedColor.name}</span>
            </p>
            <p className="text-sm text-gray-700">
              Bike Type: <span className="font-semibold">{selectedCC}</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              onClick={handleAddToCart}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-black text-white hover:bg-gray-800 rounded-md"
            >
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-6">Related Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link href={`/products/${item.id}`} key={item.id}>
                <div className="cursor-pointer border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                  <Image
                    src={item.colors?.[0]?.image || "/placeholder.jpg"}
                    alt={item.name}
                    width={300}
                    height={250}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                    <p className="text-blue-600 text-sm font-medium">PKR {item.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
