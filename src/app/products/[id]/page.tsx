"use client"

import { use, useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Products } from "@/lib/products"
import { isCarTopCoverProduct } from "@/lib/car-top-cover"
import { isRainSuitProduct, RAIN_SUIT_SIZES } from "@/lib/rain-suit"
import { formatPrice } from "@/lib/format-price"
import ProductCategoryRow from "@/components/ProductCategoryRow"
import ProductColorPicker from "@/components/ProductColorPicker"
import { groupRelatedProductsByCategory } from "@/lib/group-products-by-category"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import { buildTikTokProductParams, trackTikTokEvent } from "@/lib/tiktok"
import clsx from "clsx"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, Minus, ShoppingBag } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

const bikeTypes = ["70cc", "110cc", "125cc", "150cc"]

function getCompactBenefits(description: string) {
  const seen = new Set<string>()
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params)
  const product = Products.find((p) => p.id === id)
  const router = useRouter()
  const { addToCart } = useCart()
  const { openCart, closeCart } = useCartUI()

  const isCarTopCover = product ? isCarTopCoverProduct(product) : false
  const isRainSuit = product ? isRainSuitProduct(product) : false

  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.find((c) => c.default) || product?.colors?.[0]
  )
  const [selectedCoverColor, setSelectedCoverColor] = useState(
    product?.colors?.find((c) => c.default)?.name || product?.colors?.[0]?.name || "black"
  )
  const [selectedCC, setSelectedCC] = useState("70cc")
  const [selectedSize, setSelectedSize] = useState<string>(RAIN_SUIT_SIZES[1])

  if (!product) return notFound()

  const activeCoverColor =
    product.colors.find((c) => c.name === selectedCoverColor) ||
    product.colors.find((c) => c.default) ||
    product.colors[0]

  const mainImage = isCarTopCover
    ? activeCoverColor?.displayImage || activeCoverColor?.image || product.image
    : selectedColor?.image || product.image

  const selectionLabel = isCarTopCover
    ? activeCoverColor?.name ?? selectedCoverColor
    : selectedColor?.name

  const benefits = getCompactBenefits(product.description)

  useEffect(() => {
    trackTikTokEvent("ViewContent", buildTikTokProductParams(product))
  }, [product])

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      quantity: 1,
      color: selectionLabel,
      ...(isRainSuit && { size: selectedSize }),
    })
    trackTikTokEvent("AddToCart", buildTikTokProductParams(product))
    openCart()
  }

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      quantity: 1,
      color: selectionLabel,
      ...(isRainSuit && { size: selectedSize }),
    })
    trackTikTokEvent("InitiateCheckout", buildTikTokProductParams(product))
    closeCart()
    router.push("/checkout")
  }

  const relatedProductGroups = groupRelatedProductsByCategory(Products, product)

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fafaf9] to-white text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/products"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-orange-600"
        >
          <ArrowLeft className="size-4" />
          Back to products
        </Link>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mainImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full bg-[#f4f4f2]"
                >
                  <Image
                    src={mainImage}
                    alt={product.name}
                    width={1200}
                    height={900}
                    className="h-auto w-full object-contain"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {!isCarTopCover && (
                <div className="border-t border-slate-100 p-4 sm:p-5">
                  <ProductColorPicker
                    label="Color"
                    colors={product.colors}
                    selected={selectedColor?.name ?? ""}
                    onSelect={(name) => {
                      const color = product.colors.find((c) => c.name === name)
                      if (color) setSelectedColor(color)
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
              {product.category}
            </p>

            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-black tabular-nums text-orange-500 sm:text-4xl">
                {formatPrice(product.price)}
              </p>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Free delivery
              </span>
            </div>

            {isCarTopCover && (
              <div className="mt-4">
                <ProductColorPicker
                  label="Cover color"
                  colors={product.colors}
                  selected={selectedCoverColor}
                  onSelect={setSelectedCoverColor}
                />
              </div>
            )}

            {isRainSuit && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-900">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RAIN_SUIT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={clsx(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                        selectedSize === size
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Button
                onClick={handleBuyNow}
                className="h-14 flex-1 rounded-2xl bg-orange-500 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 sm:order-2"
              >
                Buy Now
              </Button>
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="h-14 flex-1 rounded-2xl border-2 border-slate-900 text-base font-bold text-slate-900 hover:bg-slate-50 sm:order-1"
              >
                <ShoppingBag className="mr-2 size-5" />
                Add to Cart
              </Button>
            </div>

            <ul className="mt-5 flex flex-wrap gap-2">
              {benefits.map((line, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  <Check className="size-3.5 shrink-0 text-orange-500" />
                  {line}
                </li>
              ))}
            </ul>

            {!isCarTopCover && !isRainSuit && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-900">Bike engine size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {bikeTypes.map((cc) => (
                    <button
                      key={cc}
                      type="button"
                      onClick={() => setSelectedCC(cc)}
                      className={clsx(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                        selectedCC === cc
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
                      )}
                    >
                      {cc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedProductGroups.length > 0 && (
          <section className="mt-16 border-t border-slate-200/80 pt-14 sm:mt-20">
            <div className="mb-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <Minus className="w-8 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
                  You may also like
                </span>
                <Minus className="w-8 text-orange-400" />
              </div>
              <h2 className="mt-4 font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">
                Explore More
              </h2>
            </div>

            {relatedProductGroups.map((group) => (
              <ProductCategoryRow
                key={group.category}
                category={group.category}
                products={group.products}
                isCurrentCategory={group.isCurrentCategory}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
