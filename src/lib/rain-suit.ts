import { Products } from "@/lib/products"
import { Product } from "@/types/product"

export const RAIN_SUIT_SIZES = ["Small", "Medium", "Large"] as const

export type RainSuitSize = (typeof RAIN_SUIT_SIZES)[number]

export function isRainSuitProduct(product: Product) {
  const category = product.category.toLowerCase().trim()

  return (
    category === "rain suites" ||
    category === "Rain Coat"
  )
}

export function cartContainsRainSuit(cart: { id: string }[]) {
  return cart.some((item) => {
    const product = Products.find((p) => p.id === item.id)
    return product ? isRainSuitProduct(product) : false
  })
}