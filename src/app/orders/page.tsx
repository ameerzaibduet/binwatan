"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BadgeCheck,
  Clock2,
  Package,
  RotateCcw,
  Truck,
  RefreshCw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useCustomerOrders, type StoredCustomerOrder } from "@/lib/use-customer-orders"
import {
  CUSTOMER_STATUS_LABELS,
  getCustomerOrderStatus,
  normalizeOrderPhone,
} from "@/lib/order-status"
import { formatPrice } from "@/lib/format-price"
import clsx from "clsx"

function StatusBadge({ order }: { order: StoredCustomerOrder }) {
  const status = getCustomerOrderStatus(order)

  const styles: Record<string, string> = {
    placed: "bg-amber-50 text-amber-700 border-amber-200",
    booked: "bg-blue-50 text-blue-700 border-blue-200",
    "in-transit": "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    returned: "bg-red-50 text-red-700 border-red-200",
  }

  const icons: Record<string, typeof Clock2> = {
    placed: Clock2,
    booked: Package,
    "in-transit": Truck,
    delivered: BadgeCheck,
    returned: RotateCcw,
  }

  const Icon = icons[status] || Clock2

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
        styles[status]
      )}
    >
      <Icon className="size-3.5" />
      {CUSTOMER_STATUS_LABELS[status]}
    </span>
  )
}

export default function OrdersPage() {
  const { orders, phone, setPhone, syncOrders } = useCustomerOrders()
  const [inputPhone, setInputPhone] = useState(phone)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const refreshOrders = useCallback(
    async (lookupPhone?: string) => {
      const queryPhone = lookupPhone || phone || inputPhone
      if (!queryPhone) return

      setLoading(true)

      try {
        const normalized = normalizeOrderPhone(queryPhone)
        const last10 = normalized.slice(-10)

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .or(`phone.eq.${queryPhone},phone.ilike.%${last10}`)
          .order("created_at", { ascending: false })

        if (error) throw error

        const remote = ((data as StoredCustomerOrder[]) || []).map((order) => ({
          id: order.id,
          name: order.name,
          phone: order.phone,
          city: order.city,
          address: order.address,
          total: order.total,
          items: order.items || [],
          bike_specifications: order.bike_specifications,
          created_at: order.created_at,
          dispatched: order.dispatched,
          transaction_status: order.transaction_status ?? null,
          delivery_date: order.delivery_date ?? null,
          tracking_number: order.tracking_number ?? null,
        }))

        syncOrders(remote)
        setPhone(queryPhone)
      } catch (err) {
        console.error("Failed to refresh orders:", err)
      } finally {
        setLoading(false)
      }
    },
    [phone, inputPhone, syncOrders, setPhone]
  )

  useEffect(() => {
    setInputPhone(phone)
    setReady(true)
    if (phone) refreshOrders(phone)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLookup = async () => {
    if (!inputPhone || inputPhone.length < 10) {
      alert("Please enter a valid phone number")
      return
    }
    await refreshOrders(inputPhone)
  }

  const displayOrders = orders

  if (!ready) {
    return (
      <div className="py-10 text-center text-slate-500">Loading your orders...</div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fafaf9] to-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">My Orders</h1>
            <p className="mt-1 text-sm text-slate-500">
              Status updates automatically when your order is booked or delivered
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshOrders()}
            disabled={loading || !phone}
            className="shrink-0 gap-2"
          >
            <RefreshCw className={clsx("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm text-slate-600">
            Enter your phone number to load all orders on this device:
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="03XXXXXXXXX"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Button
              onClick={handleLookup}
              disabled={loading}
              className="h-12 rounded-xl bg-orange-500 px-8 font-bold hover:bg-orange-600"
            >
              {loading ? "Loading..." : "Load Orders"}
            </Button>
          </div>
        </div>

        {displayOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Package className="mx-auto size-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-600">No orders yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Place an order and it will appear here automatically
            </p>
            <Link href="/products" className="mt-6 inline-block">
              <Button className="rounded-xl bg-slate-900">Shop now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {displayOrders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                  <div>
                    <p className="font-bold text-slate-900">{order.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <StatusBadge order={order} />
                </div>

                <div className="space-y-3 px-5 py-4">
                  <p className="text-sm text-slate-600">
                    {order.address}, {order.city}
                  </p>

                  {order.tracking_number && (
                    <p className="text-sm">
                      <span className="font-semibold text-slate-800">Tracking:</span>{" "}
                      <span className="font-mono text-orange-600">
                        {order.tracking_number}
                      </span>
                    </p>
                  )}

                  <ul className="divide-y divide-slate-100">
                    {order.items?.map((item, index) => (
                      <li key={index} className="flex gap-3 py-3">
                        {item.image ? (
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-slate-100">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        ) : (
                          <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400">
                            <Package className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} × {formatPrice(item.price)}
                            {item.color ? ` · ${item.color}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between border-t border-slate-100 pt-3">
                    <span className="font-semibold text-slate-700">Total</span>
                    <span className="text-lg font-black text-orange-500">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
