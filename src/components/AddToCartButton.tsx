"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { Product } from "@/types/product"

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()

  return (
    <Button
      onClick={() => addToCart(product)}
      className="
        w-full sm:w-auto
        px-6 py-3
        text-base font-medium
        bg-blue-600 text-white
        hover:bg-blue-700
        focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition duration-200
      "
    >
      Add to Cart
    </Button>
  )
}
