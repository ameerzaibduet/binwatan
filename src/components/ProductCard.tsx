"use client"

import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Product } from "@/types/product"
import { Truck } from "lucide-react" // ✅ import proper icon

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
      className="cursor-pointer border rounded-lg overflow-hidden shadow hover:shadow-md transition"
    >
      <Image
        src={product.image}
        alt={product.name}
        width={400}
        height={300}
        className="w-full h-60 object-cover"
      />
      <div className="p-4">
        <h2 className="text-lg font-semibold">{product.name}</h2>
      
        <p className="text-blue-600 font-bold">PKR {product.price}</p>

        {/* ✅ Free Delivery Badge with Icon */}
        <div className="flex items-center text-green-600 text-sm font-medium mt-2">
          <Truck className="w-4 h-4 mr-1" />
          Free Delivery
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button onClick={handleAddToCart} className="w-full sm:w-1/2 px-6 py-3 text-base font-medium">
            Add to Cart
          </Button>
          <Button onClick={handleBuyNow} variant="outline" className="w-full sm:w-1/2 px-6 py-3 text-base font-medium">
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
}
