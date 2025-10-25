"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { BadgeCheck, Clock2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type OrderItem = {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  color?: string | null
}

type Order = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string
  city: string
  total: number
  dispatched: boolean
  created_at: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Fetch orders from Supabase dynamically on client-side
  const handleSubmitPhone = async () => {
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number")
      return
    }

    setLoading(true)
    localStorage.setItem("userPhone", phone)

    try {
      // Import Supabase client dynamically to avoid SSR build issues
      const { createClient } = await import("@supabase/supabase-js")

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("phone", phone)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching orders:", error.message)
      } else {
        setOrders((data as Order[]) || [])
        setSubmitted(true)
      }
    } catch (err) {
      console.error("Unexpected error fetching orders:", err)
    }

    setLoading(false)
  }

  // Auto-fetch if user phone is saved
  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone")
    if (savedPhone) {
      setPhone(savedPhone)
      handleSubmitPhone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 font-[Georgia,'Times New Roman',serif]">
        My Orders
      </h1>

      {/* Phone Input Section */}
      {!submitted && (
        <div className="space-y-4 mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">
            Enter your phone number to view your recent orders:
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Input
              placeholder="03XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full sm:w-72"
            />
            <Button
              onClick={handleSubmitPhone}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Fetching Orders..." : "View My Orders"}
            </Button>
          </div>
        </div>
      )}

      {/* No Orders Found */}
      {submitted && orders.length === 0 && (
        <p className="text-gray-500 text-center mt-10">
          No orders found for this number.
        </p>
      )}

      {/* Orders List */}
      {submitted && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="font-semibold text-gray-800">{order.name}</h2>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                {order.dispatched ? (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4" /> Dispatched
                  </span>
                ) : (
                  <span className="text-yellow-600 text-sm flex items-center gap-1">
                    <Clock2 className="w-4 h-4" /> Pending
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="text-sm text-gray-600 mb-3">
                <p>
                  <strong>Address:</strong> {order.address}, {order.city}
                </p>
                {order.email && (
                  <p>
                    <strong>Email:</strong> {order.email}
                  </p>
                )}
              </div>

              {/* Items */}
              <ul className="divide-y text-sm mb-3">
                {order.items.map((item, index) => (
                  <li key={index} className="flex gap-3 py-2 items-center">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={50}
                      height={50}
                      className="rounded-md border object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × PKR {item.price}
                        {item.color && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            • Color:{" "}
                            <span
                              className="inline-block w-3 h-3 rounded-full border"
                              style={{ backgroundColor: item.color }}
                            ></span>
                            {item.color}
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Total */}
              <div className="text-right font-bold text-gray-800">
                Total: PKR {order.total}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
