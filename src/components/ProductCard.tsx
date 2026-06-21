"use client"

import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import { colorMap } from "@/lib/color-map"
import { isRainSuitProduct } from "@/lib/rain-suit"
import { formatPrice } from "@/lib/format-price"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Product } from "@/types/product"
import { Eye, ShoppingBag, Truck } from "lucide-react"
import type { MouseEvent } from "react"
import { buildTikTokProductParams, trackTikTokEvent } from "@/lib/tiktok"

type Props = {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart()
  const { openCart } = useCartUI()
  const router = useRouter()

  const defaultColor =
    product.colors.find((c) => c.default)?.name || product.colors[0]?.name || ""
  const isRainSuit = isRainSuitProduct(product)
  const defaultSize = isRainSuit ? "Medium" : undefined

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation()
    addToCart({
      ...product,
      quantity: 1,
      color: defaultColor,
      ...(defaultSize && { size: defaultSize }),
    })
    trackTikTokEvent("AddToCart", buildTikTokProductParams(product))
    openCart()
  }

  const handleBuyNow = (e: MouseEvent) => {
    e.stopPropagation()
    addToCart({
      ...product,
      quantity: 1,
      color: defaultColor,
      ...(defaultSize && { size: defaultSize }),
    })
    trackTikTokEvent("InitiateCheckout", buildTikTokProductParams(product))
    router.push("/checkout")
  }

  const handleViewProduct = () => {
    router.push(`/products/${product.id}`)
  }

  const visibleColors = product.colors.slice(0, 5)
  const extraColorCount = Math.max(product.colors.length - visibleColors.length, 0)
  const isCarCover = Boolean(product.uncoveredImage && product.carDetails)
  const cardImage = product.cardImage || product.image

  return (
    <div
      onClick={handleViewProduct}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
    >
      <div
        className={
          isCarCover
            ? "relative w-full overflow-hidden bg-[#f4f4f2]"
            : "relative aspect-[4/5] w-full overflow-hidden bg-[#f4f4f2]"
        }
      >
        {isCarCover ? (
          <Image
            src={cardImage}
            alt={product.name}
            width={1200}
            height={900}
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur">
          {product.category}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleViewProduct()
          }}
          aria-label={`View ${product.name}`}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-slate-900 opacity-100 shadow-sm backdrop-blur transition-all duration-300 hover:bg-slate-950 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Eye className="size-4" />
        </button>

        {!isCarCover && (
          <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                size="sm"
                className="h-10 flex-1 rounded-full bg-white text-sm font-semibold text-slate-950 hover:bg-white/90"
              >
                <ShoppingBag className="size-4" />
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                size="sm"
                variant="outline"
                className="h-10 flex-1 rounded-full border-white/80 bg-transparent text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                Buy Now
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-slate-950">
              {product.name}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Truck className="size-3.5" />
              Free delivery
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Price
            </p>
            <p className="text-base font-bold tabular-nums text-orange-500">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center -space-x-1">
            {visibleColors.map((color) => (
              <span
                key={`${product.id}-${color.name}`}
                title={color.name}
                className="size-5 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                style={{ backgroundColor: colorMap[color.name] || "#e5e7eb" }}
              />
            ))}
            {extraColorCount > 0 && (
              <span className="ml-2 text-xs font-semibold text-slate-500">
                +{extraColorCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-slate-500">
            {product.colors.length} colors
          </span>
        </div>

        <div className={isCarCover ? "mt-5 grid grid-cols-2 gap-2" : "mt-5 grid grid-cols-2 gap-2 sm:hidden"}>
          <Button
            onClick={handleAddToCart}
            className="h-11 w-full rounded-full bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ShoppingBag className="size-4" />
            Add to Cart
          </Button>
          <Button
            onClick={handleBuyNow}
            variant="outline"
            className="h-11 w-full rounded-full border-slate-950 px-3 text-sm font-semibold text-slate-950 hover:bg-orange-50 hover:text-orange-600"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
}
