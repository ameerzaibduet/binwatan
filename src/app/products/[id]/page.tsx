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

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params)
  const product = Products.find((p) => p.id === id)
  const router = useRouter()
  const { addToCart } = useCart()
  const { openCart, closeCart } = useCartUI()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!product) return notFound()

  const [selectedColor, setSelectedColor] = useState(
    product.colors?.find((c) => c.default) || product.colors?.[0]
  )
  const [selectedCC, setSelectedCC] = useState("70cc")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const handleAddToCart = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })
    openCart()
  }

  const handleBuyNow = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })
    closeCart()
    router.push("/checkout")
  }

  const relatedProducts = Products.filter(
    (p) => p.category === product.category && p.id !== product.id
  )

  // scroll left/right logic
  const scrollGallery = (direction: "left" | "right") => {
    const container = scrollRef.current
    if (!container) return
    const scrollAmount = 250
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  // show/hide arrows depending on scroll position
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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* LEFT: Main Image + Color Gallery */}
        <div className="space-y-5">
          {/* Main Image */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedColor?.image}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
              >
                <Image
                  src={selectedColor?.image || product.colors?.[0]?.image || "/placeholder.jpg"}
                  alt={product.name}
                  width={600}
                  height={500}
                  className="w-full h-[400px] md:h-[450px] object-cover rounded-2xl"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Horizontal Scroll Thumbnail Gallery */}
          {product.colors?.length > 0 && (
            <div className="mt-6 relative">
              <h4 className="text-sm font-semibold mb-3 tracking-wide text-gray-700 uppercase">
                Available Covers
              </h4>

              {/* Arrows */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollGallery("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md rounded-full shadow-md p-2 hover:scale-110 transition z-10"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              {canScrollRight && (
                <button
                  onClick={() => scrollGallery("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md rounded-full shadow-md p-2 hover:scale-110 transition z-10"
                >
                  <ChevronRight size={22} />
                </button>
              )}

              {/* Scrollable container */}
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-3 scroll-smooth scrollbar-hide"
              >
                {product.colors.map((color) => (
                  <motion.button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={clsx(
                      "relative flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 focus:outline-none",
                      selectedColor?.name === color.name
                        ? "border-black shadow-lg scale-105"
                        : "border-gray-200 hover:scale-105 hover:border-gray-400"
                    )}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src={color.image}
                      alt={color.name}
                      width={110}
                      height={110}
                      className="object-cover w-28 h-28 md:w-32 md:h-32 rounded-2xl"
                    />
                    <span className="absolute bottom-1 left-1 right-1 bg-white/90 text-center text-xs font-semibold py-[3px] rounded-md shadow-sm">
                      {color.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Product Info */}
        <div>
          <h3 className="text-3xl font-bold mb-3">
            {product.name}{" "}
            <span className="text-2xl text-blue-600">PKR {product.price}</span>
          </h3>

          {/* Description */}
          <ul className="mb-8 text-sm text-gray-800 grid grid-cols-2 gap-x-4 gap-y-3">
            {product.description.split("\n").map((line, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-green-600"
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
                <span>{line.trim()}</span>
              </li>
            ))}
          </ul>

          {/* Bike Type */}
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
              Selected Color: <span className="font-semibold">{selectedColor?.name}</span>
            </p>
            <p className="text-sm text-gray-700">
              Bike Type: <span className="font-semibold">{selectedCC}</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              onClick={handleAddToCart}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-black text-white hover:bg-gray-800 rounded-lg"
            >
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg"
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
                <div className="cursor-pointer border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition">
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
