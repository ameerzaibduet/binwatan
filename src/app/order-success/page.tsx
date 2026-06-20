"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowDown, CheckCircle, Package, ChevronRight } from "lucide-react"
import { formatPrice } from "@/lib/format-price"
import type { StoredCustomerOrder } from "@/lib/use-customer-orders"

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<StoredCustomerOrder | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("lastPlacedOrder")
    if (!raw) return
    try {
      setOrder(JSON.parse(raw) as StoredCustomerOrder)
    } catch {
      setOrder(null)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-white px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="text-center">
            <CheckCircle className="mx-auto size-16 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-black text-slate-900">Order placed!</h1>
            <p className="mt-2 text-sm text-slate-600">
              Thank you. We have received your order and will contact you soon.
            </p>
          </div>

          {order ? (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Order details
                </p>
                <span className="font-mono text-[10px] text-slate-400">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <ul className="space-y-3">
                {order.items.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="flex gap-3">
                    {item.image ? (
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-white text-slate-400">
                        <Package className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {formatPrice(item.price)}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-800">Name:</span> {order.name}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Phone:</span> {order.phone}
                </p>
                <p>
                  <span className="font-medium text-slate-800">Address:</span> {order.address},{" "}
                  {order.city}
                </p>
                <p className="pt-1 text-base font-black text-orange-500">
                  Total: {formatPrice(order.total)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-slate-500">
              Your order was placed successfully.
            </p>
          )}

          <div className="mt-8 rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
            <p className="text-center text-sm font-bold text-orange-800">
              Track your order anytime
            </p>

            <div className="mt-4 flex flex-col items-center gap-2 text-center">
              <ArrowDown className="size-5 animate-bounce text-orange-500" />
              <p className="text-xs leading-relaxed text-orange-900/80">
                Open the menu at the top and tap{" "}
                <span className="font-bold text-orange-600">My Orders</span> to see status
                updates when your parcel is booked or delivered.
              </p>
              <div className="mt-2 flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                Menu
                <ChevronRight className="size-3.5" />
                My Orders
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/orders" className="flex-1">
              <Button className="h-12 w-full rounded-2xl bg-orange-500 font-bold hover:bg-orange-600">
                View My Orders
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                className="h-12 w-full rounded-2xl border-2 font-bold"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
