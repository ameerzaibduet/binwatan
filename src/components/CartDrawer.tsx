"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { useCart } from "@/lib/use-cart"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Minus, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CartDrawer({ open, onOpenChange }: Props) {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])
  if (!hydrated) return null

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 transition-opacity" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-[400px] bg-white z-50 p-6 shadow-lg overflow-y-auto transition-transform">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-bold">Your Cart</Dialog.Title>
            <Dialog.Close asChild>
              <button>
                <X className="w-5 h-5 text-gray-500 hover:text-black" />
              </button>
            </Dialog.Close>
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id + item.color} className="flex items-center gap-4 border-b pb-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">PKR {item.price}</p>

                      {item.color && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Color:</span>
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-gray-500 capitalize">{item.color}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => decreaseQuantity(item.id, item.color)}
                          className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100",
                            item.quantity <= 1 && "opacity-50 cursor-not-allowed"
                          )}
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          <Minus className="w-4 h-4 text-gray-700" />
                        </button>

                        <span className="min-w-[20px] text-center">{item.quantity}</span>

                        <button
                          onClick={() => increaseQuantity(item.id, item.color)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                          title="Increase quantity"
                        >
                          <Plus className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    <button onClick={() => removeFromCart(item.id, item.color)}>
                      <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between font-semibold mb-4">
                  <span>Total</span>
                  <span>PKR {total}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false)
                    setTimeout(() => router.push("/checkout"), 50)
                  }}
                >
                  Go to Checkout
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
