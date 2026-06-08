"use client"

import { use, useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import Image from "next/image"
import { Products } from "@/lib/products"
import {
  getCarTopCoverTypes,
  getCarTypeForProduct,
  isCarTopCoverProduct,
  type CarTypeOption,
} from "@/lib/car-top-cover"
import { formatPrice } from "@/lib/format-price"
import { colorMap } from "@/lib/color-map"
import ProductCategoryRow from "@/components/ProductCategoryRow"
import { groupRelatedProductsByCategory } from "@/lib/group-products-by-category"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import clsx from "clsx"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Minus, ShieldCheck, Truck } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

const ttqTrack = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== "undefined" && (window as unknown as { ttq?: { track: (e: string, p: Record<string, unknown>) => void } }).ttq) {
    ;(window as unknown as { ttq: { track: (e: string, p: Record<string, unknown>) => void } }).ttq.track(eventName, params)
  }
}

const bikeTypes = ["70cc", "110cc", "125cc", "150cc"]

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params)
  const product = Products.find((p) => p.id === id)
  const router = useRouter()
  const { addToCart } = useCart()
  const { openCart, closeCart } = useCartUI()

  const isCarTopCover = product ? isCarTopCoverProduct(product) : false
  const carTypeOptions = isCarTopCover ? getCarTopCoverTypes() : []

  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.find((c) => c.default) || product?.colors?.[0]
  )
  const [selectedCarType, setSelectedCarType] = useState<CarTypeOption | null>(() => {
    if (!product || !isCarTopCoverProduct(product)) return null
    return getCarTypeForProduct(product) ?? getCarTopCoverTypes()[0] ?? null
  })
  const [selectedCC, setSelectedCC] = useState("70cc")

  if (!product) return notFound()

  const mainImage = isCarTopCover
    ? selectedCarType?.coverImage || product.image
    : selectedColor?.image || product.image

  const selectionLabel = isCarTopCover
    ? selectedCarType?.name
    : selectedColor?.name

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
    addToCart({ ...product, quantity: 1, color: selectionLabel })
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
    addToCart({ ...product, quantity: 1, color: selectionLabel })
    ttqTrack("InitiateCheckout", {
      content_id: product.id,
      content_type: "product",
      value: product.price,
      currency: "PKR",
    })
    closeCart()
    router.push("/checkout")
  }

  const relatedProductGroups = groupRelatedProductsByCategory(Products, product)

  return (
    <main className="min-h-screen bg-[#fbfbfa] text-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="relative w-full overflow-hidden bg-[#f4f4f2]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mainImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image
                      src={mainImage}
                      alt={isCarTopCover ? `${selectedCarType?.name} cover` : product.name}
                      width={1200}
                      height={900}
                      className="block h-auto w-full object-cover"
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {isCarTopCover && selectedCarType && (
                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm backdrop-blur">
                    {selectedCarType.name}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-4 sm:p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  {isCarTopCover ? "Select car type" : "Select color"}
                </p>

                {isCarTopCover ? (
                  <div className="flex gap-4 overflow-x-auto pb-1 category-scroll">
                    {carTypeOptions.map((carType) => {
                      const isSelected = selectedCarType?.productId === carType.productId
                      return (
                        <button
                          key={carType.productId}
                          type="button"
                          onClick={() => setSelectedCarType(carType)}
                          className={clsx(
                            "flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl p-2 transition-all sm:w-28",
                            isSelected
                              ? "bg-orange-50 ring-2 ring-orange-400"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-100">
                            <Image
                              src={carType.thumbnailImage}
                              alt={carType.name}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </div>
                          <span className="text-center text-xs font-semibold capitalize text-slate-800">
                            {carType.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1 category-scroll">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.name === color.name
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={clsx(
                            "group/color flex shrink-0 flex-col items-center gap-2 rounded-xl p-1.5 transition-all",
                            isSelected
                              ? "bg-orange-50 ring-2 ring-orange-400"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <div className="relative size-16 overflow-hidden rounded-lg border border-slate-100 sm:size-20">
                            <Image
                              src={color.image}
                              alt={color.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <span
                            className="size-4 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                            style={{ backgroundColor: colorMap[color.name] || "#e5e7eb" }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
              {product.category}
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-slate-950 sm:text-5xl">
              {isCarTopCover && selectedCarType
                ? `${selectedCarType.name} Top Cover`
                : product.name}
            </h1>

            <p className="mt-5 text-3xl font-bold tabular-nums text-orange-500">
              {formatPrice(product.price)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: Truck, label: "Free delivery" },
                { icon: ShieldCheck, label: "Waterproof build" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <item.icon className="size-4 text-orange-400" />
                  {item.label}
                </span>
              ))}
            </div>

            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {product.description.split("\n").map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Check className="mt-0.5 size-4 shrink-0 text-orange-500" />
                  <span>{line.trim()}</span>
                </li>
              ))}
            </ul>

            {!isCarTopCover && (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <p className="text-sm font-semibold text-slate-950">Bike type</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bikeTypes.map((cc) => (
                    <button
                      key={cc}
                      type="button"
                      onClick={() => setSelectedCC(cc)}
                      className={clsx(
                        "rounded-full border px-5 py-2 text-sm font-medium transition-all duration-200",
                        selectedCC === cc
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
                      )}
                    >
                      {cc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
              {isCarTopCover ? (
                <p>
                  Car type:{" "}
                  <span className="font-semibold capitalize text-slate-950">
                    {selectedCarType?.name}
                  </span>
                </p>
              ) : (
                <>
                  <p>
                    Color:{" "}
                    <span className="font-semibold capitalize text-slate-950">
                      {selectedColor?.name}
                    </span>
                  </p>
                  <p className="mt-1">
                    Bike type:{" "}
                    <span className="font-semibold text-slate-950">{selectedCC}</span>
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleAddToCart}
                className="h-12 flex-1 rounded-full bg-slate-950 text-base font-semibold text-white hover:bg-slate-800"
              >
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                className="h-12 flex-1 rounded-full bg-orange-500 text-base font-semibold text-white hover:bg-orange-600"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>

        {relatedProductGroups.length > 0 && (
          <section className="mt-20 border-t border-slate-200/80 pt-16">
            <div className="mb-12 flex flex-col items-center text-center">
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
