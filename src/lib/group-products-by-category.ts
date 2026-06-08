import { Product } from "@/types/product"

export type ProductCategoryGroup = {
  category: string
  products: Product[]
  isCurrentCategory: boolean
}

export function groupRelatedProductsByCategory(
  allProducts: Product[],
  currentProduct: Product
): ProductCategoryGroup[] {
  const others = allProducts.filter((p) => p.id !== currentProduct.id)
  const currentCategory = currentProduct.category.toLowerCase()

  const sameCategory = others.filter(
    (p) => p.category.toLowerCase() === currentCategory
  )

  const otherCategoryNames = Array.from(
    new Set(
      others
        .filter((p) => p.category.toLowerCase() !== currentCategory)
        .map((p) => p.category)
    )
  )

  const groups: ProductCategoryGroup[] = []

  if (sameCategory.length > 0) {
    groups.push({
      category: currentProduct.category,
      products: sameCategory,
      isCurrentCategory: true,
    })
  }

  for (const category of otherCategoryNames) {
    const products = others.filter((p) => p.category === category)
    if (products.length > 0) {
      groups.push({ category, products, isCurrentCategory: false })
    }
  }

  return groups
}
