'use client'

import { use } from 'react'
import { useState } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Products } from '@/lib/products'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/use-cart'
import { useCartUI } from '@/lib/use-cart-ui'
import clsx from 'clsx'

type Props = {
  params: Promise<{ id: string }>
}

export default function ProductDetailPage({ params }: Props) {
  // ✅ unwrap the params Promise using React.use()
  const { id } = use(params)

  const product = Products.find((p) => p.id === id)
  const router = useRouter()
  const { addToCart } = useCart()
  const { openCart, closeCart } = useCartUI()

  if (!product) return notFound()

  const [selectedColor, setSelectedColor] = useState(
    product.colors?.find((c) => c.default) || product.colors?.[0]
  )

  const handleAddToCart = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })
    openCart()
  }

  const handleBuyNow = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })
    closeCart()
    router.push('/checkout')
  }

  const relatedProducts = Products.filter(
    (p) => p.category === product.category && p.id !== product.id
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Image with Zoom */}
        <div className="relative overflow-hidden rounded-lg group shadow-lg" style={{ height: 400 }}>
          <Image
            src={selectedColor?.image || product.colors?.[0]?.image || '/placeholder.jpg'}
            alt={product.name}
            width={500}
            height={400}
            className="transition-transform duration-300 ease-in-out group-hover:scale-150 object-cover w-full h-full"
            style={{ transformOrigin: 'center center' }}
            onMouseMove={(e) => {
              const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - left) / width) * 100
              const y = ((e.clientY - top) / height) * 100
              e.currentTarget.style.transformOrigin = `${x}% ${y}%`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transformOrigin = 'center center'
            }}
          />
        </div>

        {/* Product Info */}
        <div>
          <h3 className="text-3xl font-bold mb-3">
            {product.name}{' '}
            <span className="text-2xl text-blue-600 mb-6">PKR {product.price}</span>
          </h3>

          {/* Description */}
          <ul className="mb-8 text-sm text-gray-800 grid grid-cols-2 gap-x-4 gap-y-3">
            {product.description.split('\n').map((line, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span>{line.trim()}</span>
              </li>
            ))}
          </ul>

          {/* Color Selection */}
          {product.colors?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Select Color:</p>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={clsx(
                      'relative border-2 rounded-md overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200',
                      selectedColor?.name === color.name ? 'border-black' : 'border-gray-300'
                    )}
                    title={color.name}
                  >
                    <Image
                      src={color.image}
                      alt={color.name}
                      width={48}
                      height={48}
                      className="object-cover w-12 h-12"
                    />
                    {selectedColor?.name === color.name && (
                      <div className="absolute top-1 right-1 bg-white text-black text-xs rounded-full px-1 font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              onClick={handleAddToCart}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-black text-white hover:bg-gray-800 rounded-md"
            >
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              className="w-full sm:w-1/2 py-3 text-base font-medium bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-6">Related Products</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link href={`/products/${item.id}`} key={item.id}>
                <div className="cursor-pointer border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                  <Image
                    src={item.colors?.[0]?.image || '/placeholder.jpg'}
                    alt={item.name}
                    width={300}
                    height={250}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                    <p className="text-blue-600 text-sm font-medium">PKR {item.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
