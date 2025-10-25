"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { BadgeCheck, Clock2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  items: {
    id: string
    name: string
    price: number
    quantity: number
    image: string
    color?: string | null
  }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitPhone = async () => {
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number")
      return
    }

    setLoading(true)
    localStorage.setItem("userPhone", phone)

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
    } else {
      setOrders(data as Order[])
      setSubmitted(true)
    }

    setLoading(false)
  }

  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone")
    if (savedPhone) {
      setPhone(savedPhone)
      handleSubmitPhone()
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {!submitted && (
        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600">Enter your phone number to view your orders:</p>
          <Input
            placeholder="03XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full max-w-sm"
          />
          <Button onClick={handleSubmitPhone} disabled={loading}>
            {loading ? "Fetching Orders..." : "View My Orders"}
          </Button>
        </div>
      )}

      {submitted && orders.length === 0 && (
        <p className="text-gray-500">No orders found for this number.</p>
      )}

      {submitted && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded-lg bg-white shadow-sm"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="font-semibold">{order.name}</h2>
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

              <div className="text-sm text-gray-600 mb-2">
                <p><strong>Address:</strong> {order.address}, {order.city}</p>
                {order.email && <p><strong>Email:</strong> {order.email}</p>}
              </div>

              <ul className="divide-y text-sm mb-3">
                {order.items.map((item, index) => (
                  <li key={index} className="flex gap-3 py-2">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="rounded border"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
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

              <div className="text-right font-bold">Total: PKR {order.total}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
