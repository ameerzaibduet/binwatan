"use client"

import { use } from "react"
import { useState, useEffect, useRef } from "react"
import { notFound, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Products } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import clsx from "clsx"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

// TikTok Pixel Helper Function
const ttqTrack = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && (window as any).ttq) {
    ;(window as any).ttq.track(eventName, params)
  }
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params)
  const product = Products.find((p) => p.id === id)
  const router = useRouter()
  const { addToCart } = useCart()
  const { openCart, closeCart } = useCartUI()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.find((c) => c.default) || product?.colors?.[0]
  )
  const [selectedCC, setSelectedCC] = useState("70cc")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  if (!product) return notFound()

  // Fire ViewContent on page load
  useEffect(() => {
    ttqTrack("ViewContent", {
      content_id: product.id,
      content_type: "product",
      content_name: product.name,
      price: product.price,
      currency: "PKR",
    })
  }, [product])

  const handleAddToCart = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })

    // TikTok AddToCart event
    ttqTrack("AddToCart", {
      content_id: product.id,
      content_type: "product",
      quantity: 1,
      price: product.price,
      currency: "PKR",
    })

    openCart()
  }

  const handleBuyNow = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })

    // TikTok InitiateCheckout event
    ttqTrack("InitiateCheckout", {
      content_id: product.id,
      content_type: "product",
      value: product.price,
      currency: "PKR",
    })

    closeCart()
    router.push("/checkout")
  }

  const scrollGallery = (direction: "left" | "right") => {
    const container = scrollRef.current
    if (!container) return
    const scrollAmount = 280
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  const updateScrollButtons = () => {
    const container = scrollRef.current
    if (!container) return
    setCanScrollLeft(container.scrollLeft > 10)
    setCanScrollRight(
      container.scrollLeft + container.clientWidth < container.scrollWidth - 10
    )
  }

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    updateScrollButtons()
    container.addEventListener("scroll", updateScrollButtons)
    window.addEventListener("resize", updateScrollButtons)
    return () => {
      container.removeEventListener("scroll", updateScrollButtons)
      window.removeEventListener("resize", updateScrollButtons)
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* LEFT: Hero Image */}
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedColor?.image}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={selectedColor?.image || "/placeholder.png"}
                  alt={product.name}
                  width={600}
                  height={500}
                  className="w-full h-auto object-contain rounded-2xl"
                />
              </motion.div>
            </AnimatePresence>

            {/* Thumbnail carousel */}
            <div className="flex gap-4 overflow-x-auto mt-4 pb-2 scrollbar-hide">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`flex-shrink-0 rounded-xl border-2 ${
                    selectedColor?.name === color.name
                      ? "border-blue-600"
                      : "border-gray-200"
                  }`}
                >
                  <Image
                    src={color.image}
                    alt={color.name}
                    width={80}
                    height={80}
                    className="object-cover w-20 h-20 rounded-xl"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="p-6 rounded-3xl shadow-xl border bg-transparent">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h3>
          <p className="text-2xl font-semibold text-orange-400 mb-6">PKR {product.price}</p>

          {/* Description */}
          <ul className="mb-8 text-sm text-gray-700 grid grid-cols-2 gap-y-3">
            {product.description.split("\n").map((line, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{line.trim()}</span>
              </li>
            ))}
          </ul>

          {/* Bike Type Selector */}
          <div className="mb-6">
            <p className="font-medium mb-2">Select Bike Type:</p>
            <div className="flex gap-3 flex-wrap">
              {["70cc", "110cc", "125cc", "150cc"].map((cc) => (
                <button
                  key={cc}
                  onClick={() => setSelectedCC(cc)}
                  className={clsx(
                    "px-5 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                    selectedCC === cc
                      ? "bg-orange-400 text-white border-Black-600 shadow-md"
                      : "bg-white text-gray-900 border-gray-300 hover:border-blue-400"
                  )}
                >
                  {cc}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Info */}
          <div className="mb-6 text-sm text-gray-700">
            <p>Color: <span className="font-semibold text-blue-600">{selectedColor?.name}</span></p>
            <p>Bike Type: <span className="font-semibold text-blue-600">{selectedCC}</span></p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              onClick={handleAddToCart}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-gray-900 text-white hover:bg-gray-800 rounded-lg shadow-lg"
            >
              Add to Cart
            </Button>

            <Button
              onClick={handleBuyNow}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-orange-400 hover:bg-orange-800 text-white rounded-lg shadow-lg"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold mb-6 text-gray-900">All Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 gap-6">
          {Products.map((item) => (
            <Link href={`/products/${item.id}`} key={item.id}>
              <div className="cursor-pointer overflow-hidden rounded-3xl shadow-md hover:shadow-xl transition-all">
                <Image
                  src={item.colors?.[0]?.image}
                  alt={item.name}
                  width={300}
                  height={250}
                  className="w-full h-auto object-cover"
                />
                <div className="p-3 bg-transparent">
                  <h4 className="font-semibold text-sm mb-1 text-gray-900">{item.name}</h4>
                  <p className="text-orange-400 text-sm font-semibold">PKR {item.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
