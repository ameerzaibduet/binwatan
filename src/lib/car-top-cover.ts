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
    const primary = p.colors.find((c) => c.default) || p.colors[0]
    return {
      name: primary?.name ?? p.name,
      coverImage: p.image,
      thumbnailImage: primary?.image ?? p.image,
      uncoveredImage: p.uncoveredImage,
      productId: p.id,
      price: p.price,
    }
  })
}

export function getCarTypeForProduct(product: Product): CarTypeOption | undefined {
  return getCarTopCoverTypes().find((t) => t.productId === product.id)
}

export function getProductForCarType(productId: string) {
  return Products.find((p) => p.id === productId)
}
