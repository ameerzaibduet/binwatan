import { Products } from "@/lib/products"
import { Product } from "@/types/product"

export const RAIN_SUIT_SIZES = ["Small", "Medium", "Large"] as const

export type RainSuitSize = (typeof RAIN_SUIT_SIZES)[number]

export function isRainSuitProduct(product: Product) {
  return product.category.toLowerCase() === "rain suites"
}

export function cartContainsRainSuit(cart: { id: string }[]) {
  return cart.some((item) => {
    const product = Products.find((p) => p.id === item.id)
    return product && isRainSuitProduct(product)
  })
}
