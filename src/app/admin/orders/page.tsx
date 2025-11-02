"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/utils/supabase/client"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Pencil, Trash2, Check, X } from "lucide-react"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [isAllowed, setIsAllowed] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<any>({})
  const [popup, setPopup] = useState<{ type: "delete" | "dispatch"; id: string | null } | null>(null)

  const router = useRouter()

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!isAdmin) {
      router.replace("/admin/login")
    } else {
      setIsAllowed(true)
      fetchOrders()
    }
  }, [])

  const fetchOrders = async () => {
    setStatus("Loading orders...")
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch orders:", error)
      setStatus("Failed to load orders.")
    } else {
      setOrders(data || [])
      setFilteredOrders(data || [])
      setStatus(null)
    }
    setLoading(false)
  }

  const confirmAction = (type: "delete" | "dispatch", id: string) => {
    setPopup({ type, id })
  }

  const closePopup = () => {
    setPopup(null)
  }

  const handleConfirm = async () => {
    if (!popup) return
    const { type, id } = popup

    if (type === "delete") {
      try {
        setStatus("Deleting order...")
        const { error } = await supabaseClient.from("orders").delete().eq("id", id!)
        if (error) throw error
        fetchOrders()
        setStatus("Order deleted successfully.")
      } catch (err: any) {
        console.error("Delete failed:", err)
        setStatus(`Delete failed: ${err.message || err}`)
      }
    }

    if (type === "dispatch") {
      setStatus("Booking order on PostEx...")

      const order = orders.find((o) => o.id === id)
      if (!order) return

      try {
        const payload = {
          orderRefNumber: "404",
          invoicePayment: order.total,
          orderDetail:
            order.items?.map((i: any) =>{let name = i.name

      // Replace product names as needed
      if (name === "Perashot Bike Cover") name = "Perashot 4P"
      if (name === "Req") name = "Req 4p"

      return `${name} ${i.color || ""} x${i.quantity}`.trim()
    })
    .join(", ") || "Order Items",
          customerName: order.name,
          customerPhone: order.phone,
          deliveryAddress: order.address,
          transactionNotes: "",
          cityName: order.city || "Karachi",
          invoiceDivision: 1,
          items: 1,
          orderType: "Normal",
          pickupAddressCode: "001",
          pickupAddress: "House # 44 5/f1 Orangi Town Karachi",
        }

        console.log("📦 Sending payload to PostEx:", payload)

        const res = await fetch("/api/postex/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        console.log("✅ PostEx API Response:", data)

        if (!res.ok || data.statusCode !== "200") {
          console.error("PostEx API error:", data)
          setStatus(`Booking failed: ${data.statusMessage || "Unknown error"}`)
          closePopup()
          return
        }

        // Extract tracking number safely
        const trackingNumber = data.dist?.trackingNumber || "N/A"

        // Update local state immediately so button changes color/text
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, dispatched: true, tracking_number: trackingNumber } : o
          )
        )

        // Update Supabase
        const { error } = await supabaseClient
          .from("orders")
          .update({ dispatched: true, tracking_number: trackingNumber })
          .eq("id", id!)
        if (error) throw error

        setStatus(`Order booked successfully! Tracking: ${trackingNumber}`)
      } catch (err: any) {
        console.error("Booking failed:", err)
        setStatus(`Booking failed: ${err.message || err}`)
      }
    }

    closePopup()
  }

  const startEdit = (order: any) => {
    setEditId(order.id)
    setEditedData(order)
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditedData({})
  }

  const saveEdit = async () => {
    try {
      const { error } = await supabaseClient.from("orders").update(editedData).eq("id", editId!)
      if (error) throw error
      fetchOrders()
      cancelEdit()
      setStatus("Order updated successfully.")
    } catch (err: any) {
      console.error("Update failed:", err)
      setStatus(`Update failed: ${err.message || err}`)
    }
  }

  const handleChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleLogout = () => {
    localStorage.removeItem("isAdmin")
    router.push("/admin/login")
  }

  if (loading) return <LoadingSpinner message="Loading orders..." />
  if (!isAllowed) return null

  const totalOrders = orders.length
  const dispatchedOrders = orders.filter((o) => o.dispatched).length
  const unbookedOrders = totalOrders - dispatchedOrders

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Admin - Orders</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {status && <p className="text-sm text-center mb-4 bg-gray-100 py-2 rounded">{status}</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 text-blue-800 p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Total Orders</h2>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-green-100 text-green-800 p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Booked Orders</h2>
          <p className="text-2xl font-bold">{dispatchedOrders}</p>
        </div>
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold">Unbooked Orders</h2>
          <p className="text-2xl font-bold">{unbookedOrders}</p>
        </div>
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-center">No orders found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-6 shadow-md bg-white relative hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center mb-2">
                {editId === order.id ? (
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={editedData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                ) : (
                  <h3 className="text-lg font-semibold">{order.name}</h3>
                )}
                {order.dispatched && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                    Booked
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-800 mb-4 space-y-1">
                <p>
                  <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  {editId === order.id ? (
                    <input
                      className="border rounded px-1 py-0.5"
                      value={editedData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  ) : (
                    order.phone
                  )}
                </p>
                <p>
                  <strong>Address:</strong>{" "}
                  {editId === order.id ? (
                    <input
                      className="border rounded px-1 py-0.5 w-full"
                      value={editedData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  ) : (
                    order.address
                  )}
                </p>
                <p>
                  <strong>City:</strong>{" "}
                  {editId === order.id ? (
                    <input
                      className="border rounded px-1 py-0.5"
                      value={editedData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  ) : (
                    order.city
                  )}
                </p>
              </div>

              {order.items?.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-gray-700 mb-4 space-y-1">
                  {order.items.map((item: any, index: number) => (
                    <li key={index}>
                      {item.name} × {item.quantity} — PKR {item.quantity * item.price}
                      {item.color && (
                        <span className="ml-2 text-xs text-gray-500">Color: {item.color}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-between items-center mt-4">
                <p className="font-bold text-lg">Total: PKR {order.total}</p>
                <div className="flex gap-2">
                  {editId === order.id ? (
                    <>
                      <Button size="sm" onClick={saveEdit} variant="default">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={cancelEdit} variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEdit(order)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className={order.dispatched ? "bg-green-500 text-white hover:bg-green-600" : ""}
                    onClick={() => !order.dispatched && confirmAction("dispatch", order.id)}
                    disabled={order.dispatched}
                  >
                    {order.dispatched ? "Booked" : "Mark as Booked"}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => confirmAction("delete", order.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Popup */}
      {popup && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-4">
              {popup.type === "delete"
                ? "Are you sure you want to delete this order?"
                : "Mark this order as booked (send to PostEx)?"}
            </h2>
            <div className="flex justify-center gap-4">
              <Button variant="destructive" onClick={handleConfirm}>
                Yes
              </Button>
              <Button variant="outline" onClick={closePopup}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
