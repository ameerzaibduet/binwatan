import { Products } from "@/lib/products"
import { Product } from "@/types/product"

export type CarTypeOption = {
  name: string
  coverImage: string
  thumbnailImage: string
  uncoveredImage?: string
  productId: string
  price: number
}

export function isCarTopCoverProduct(product: Product) {
  return product.category.toLowerCase() === "car top cover"
}

export function getCarTopCoverTypes(): CarTypeOption[] {
  return Products.filter((p) => isCarTopCoverProduct(p)).map((p) => {
    const blackCover = p.colors.find((c) => c.name === "black") || p.colors[0]
    return {
      name: p.carDetails?.carName ?? p.name.replace(" Top Cover", ""),
      coverImage: blackCover?.displayImage ?? blackCover?.image ?? p.image,
      thumbnailImage: blackCover?.image ?? p.image,
      uncoveredImage: p.uncoveredImage,
      productId: p.id,
      price: p.price,
    }
  })
}

export function cartContainsTopCover(cart: { id: string }[]) {
  return cart.some((item) => {
    const product = Products.find((p) => p.id === item.id)
    return product && isCarTopCoverProduct(product)
  })
}

export function getCarTypeForProduct(product: Product): CarTypeOption | undefined {
  return getCarTopCoverTypes().find((t) => t.productId === product.id)
}

export function getProductForCarType(productId: string) {
  return Products.find((p) => p.id === productId)
}
