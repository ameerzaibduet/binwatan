"use client"

import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Product } from "@/types/product"
import { Truck } from "lucide-react"

type Props = {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart()
  const { openCart } = useCartUI()
  const router = useRouter()

  const defaultColor =
    product.colors.find((c) => (c as any).default)?.name || product.colors[0]?.name || ""

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({ ...product, quantity: 1, color: defaultColor })
    openCart()
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({ ...product, quantity: 1, color: defaultColor })
    router.push("/checkout")
  }

  const handleViewProduct = () => {
    router.push(`/products/${product.id}`)
  }

  return (
    <div
      onClick={handleViewProduct}
      className="
        cursor-pointer
        bg-white
        rounded-3xl
        overflow-hidden
        transition-shadow duration-300
        flex flex-col
        group
      "
    >
      {/* Image without shadow */}
      <div className="relative w-full h-80 overflow-hidden rounded-t-3xl">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="
            object-cover w-full h-full
            transition-transform duration-500
            group-hover:scale-105
          "
        />
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h2>
        <p className="text-gray-900 font-bold text-lg mt-1">PKR {product.price}</p>

        {/* Free Delivery Badge */}
        <div className="flex items-center text-orange-400 text-sm font-medium mt-2">
          <Truck className="w-4 h-4 mr-1" />
          Free Delivery
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            onClick={handleAddToCart}
            className="
              w-full sm:w-1/2
              px-6 py-3
              text-base font-semibold
              bg-black hover:bg-gray-800
              text-white
              
              transition-all
            "
          >
            Add to Cart
          </Button>
          <Button
            onClick={handleBuyNow}
            variant="outline"
            className="
              w-full sm:w-1/2
              px-6 py-3
              text-base font-semibold
              border-black text-black
              hover:bg-black/10
              
              transition-all
            "
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
}
