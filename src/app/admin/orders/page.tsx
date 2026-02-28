"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/utils/supabase/client"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { Pencil, Trash2, Check, X, Package, Truck, Clock, LogOut, CaseUpper } from "lucide-react"
import { AnyARecord } from "dns"  

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  dispatched: boolean;
  [key: string]: any;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [isAllowed, setIsAllowed] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "dispatched" | "pending">("pending")
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editedData, setEditedData] = useState<any>({})
  const [popup, setPopup] = useState<{ type: "delete" | "dispatch"; id: string | null } | null>(null)
  const [status, setStatus] = useState<string | null>(null)

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
    setStatus("Syncing with database...")
    const { data, error } = await supabaseClient
  .from("orders")
  .select("*")
  .range(0, 9999) // fetch up to 10,000 rows
  .order("created_at", { ascending: false })

    if (error) {
      setStatus("Failed to load orders.")
    } else {
      setOrders(data || [])
      const pending = (data || []).filter((o: Order) => !o.dispatched)
      setFilteredOrders(pending)
      setFilterStatus("pending")
      setStatus(null)
    }
    setLoading(false)
  }

  const confirmAction = (type: "delete" | "dispatch", id: string) => {
    setPopup({ type, id })
  }

  const closePopup = () => setPopup(null)

  const handleConfirm = async () => {
    if (!popup) return
    const { type, id } = popup

    if (type === "delete") {
      try {
        setStatus("Removing order...")
        const { error } = await supabaseClient.from("orders").delete().eq("id", id!)
        if (error) throw error
        await fetchOrders()
        setStatus("Order deleted.")
      } catch (err: any) {
        setStatus("Delete failed.")
      }
    }

    if (type === "dispatch") {
      setStatus("Processing PostEx Booking...")
      const order = orders.find((o) => o.id === id)
      if (!order) return

      try {
        const totalWeight = order.items?.reduce((sum: number, item: any) => sum + 0.3 * item.quantity, 0) || 0
        const payload = {
          orderRefNumber: '404',
          invoicePayment: order.total,
          orderDetail: order.items
            ?.map((i: any) => `${i.name} x${i.quantity} | ${i.color.toUpperCase()} `)
            .join(", ") + 
            (order.bike_specifications ? `| Bike: ${order.bike_specifications}` : ""),          customerName: order.name,
          customerPhone: order.phone,
          deliveryAddress: order.address,
          transactionNotes: "Allowed To Open",
          cityName: order.city || "Karachi",
          invoiceDivision: 1,
          items: order.items?.length || 1,
          orderType: "Normal",
          pickupAddressCode: "001",
          weight: totalWeight,
        }

        const res = await fetch("/api/postex/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok || data.statusCode !== "200") {
          setStatus(`Error: ${data.statusMessage || "PostEx Rejected"}`)
          closePopup()
          return
        }

        const trackingNumber = data.dist?.trackingNumber || "N/A"

        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, dispatched: true, tracking_number: trackingNumber } : o))
        setFilteredOrders((prev) => prev.map((o) => o.id === id ? { ...o, dispatched: true, tracking_number: trackingNumber } : o))

        await supabaseClient.from("orders").update({ dispatched: true, tracking_number: trackingNumber }).eq("id", id!)
        setStatus(`Success! Tracking: ${trackingNumber}`)
      } catch (err: any) {
        setStatus("Booking failed.")
      }
    }
    closePopup()
  }

  const saveEdit = async () => {
    try {
      const { error } = await supabaseClient.from("orders").update(editedData).eq("id", editId!)
      if (error) throw error
      await fetchOrders()
      setEditId(null)
      setStatus("Update successful.")
    } catch (err: any) {
      setStatus("Update failed.")
    }
  }

  const handleFilter = (type: "all" | "dispatched" | "pending") => {
    setFilterStatus(type)
    if (type === "all") setFilteredOrders(orders)
    if (type === "dispatched") setFilteredOrders(orders.filter((o) => o.dispatched))
    if (type === "pending") setFilteredOrders(orders.filter((o) => !o.dispatched))
  }

  if (loading) return <LoadingSpinner />
  if (!isAllowed) return null

  return (
    <div className="min-h-screen  text-zinc-100 font-sans selection:bg-orange-700/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
       

        {status && (
          <div className="mb-6 py-3 px-4 bg-orange-700/10 border border-orange-700/50 text-orange-500 text-sm rounded-lg text-center animate-pulse">
            {status}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Total", val: orders.length, type: "all", icon: Package, color: "zinc" },
            { label: "Booked", val: orders.filter(o => o.dispatched).length, type: "dispatched", icon: Truck, color: "white" },
            { label: "Pending", val: orders.filter(o => !o.dispatched).length, type: "pending", icon: Clock, color: "yellow" },
          ].map((stat) => (
            <button
              key={stat.type}
              onClick={() => handleFilter(stat.type as any)}
              className={`relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                filterStatus === stat.type 
                ? "border-orange-400 bg-orange-400 shadow-[0_0_20px_rgba(194,65,12,0.2)]" 
                : "border-zinc-800 bg-black hover:border-zinc-700"
              }`}
            >
              <stat.icon className={`w-10 h-10 mb-4 ${filterStatus === stat.type ? "text-white" : "text-zinc-700 group-hover:text-zinc-500"}`} />
              <h2 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">{stat.label}</h2>
              <p className="text-3xl font-black mt-1">{stat.val}</p>
              {filterStatus === stat.type && <div className="absolute top-0 right-0 p-2"><Check className="text-orange-700 w-5 h-5" /></div>}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
            <Package className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600">No records found in this category.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="group  border border-orange-700 rounded-2xl p-6 hover:border-orange-700/50 transition-all duration-300 shadow-xl">
                
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    {editId === order.id ? (
                      <input
                        className=" border border-orange-700 rounded px-2 py-1 w-full text-blue-500 outline-none"
                        value={editedData.name}
                        onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                      />
                    ) : (
                      <h3 className="text-xl font-bold text-blue-500 group-hover:text-orange-500 transition-colors">{order.name}</h3>
                    )}
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-tighter">ID: {order.id.slice(0, 12)}...</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${order.dispatched ? "bg-orange-700/20 text-orange-500" : "bg-red-700 text-white"}`}>
                    {order.dispatched ? "Booked" : "Pending"}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 text-sm border-t border-zinc-800 pt-4">
                  <div className="flex justify-between">
                    <span className="text-black">Phone:</span>
                    {editId === order.id ? 
                      <input className="bg-zinc-800 text-right text-blue-500" value={editedData.phone} onChange={(e) => setEditedData({...editedData, phone: e.target.value})} /> 
                      : <h2 className="text-blue-500 font-bold text-[20px] ">{order.phone}</h2>
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 mb-1">Shipping Address:</span>
                    {editId === order.id ? 
                      <textarea className="bg-zinc-800 text-orange-500 text-xs p-2 rounded" value={editedData.address} onChange={(e) => setEditedData({...editedData, address: e.target.value})} /> 
                      : <span className="text-black leading-snug">{order.address}, <span className="text-orange-700">{order.city}</span></span>
                    }
                  </div>
                </div>

                {/* Items */}
                <div className="mt-6 border  rounded-xl p-4">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase mb-3 tracking-widest">Manifest</p>
                  <ul className="space-y-2">
                    {order.items?.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between text-xs border-b border-zinc-800/50 pb-1">
                        <span className="text-black">{item.name} <span className="text-blue-500 font-bold">x{item.quantity} <span className="text-black"> {order.bike_specifications}</span></span> {item.color.toUpperCase()}</span>

                        <span className="text-black">  PKR {item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center mt-4 pt-2 border-t border-orange-700/30">
                    <span className="text-xs font-bold text-orange-700">TOTAL</span>
                    <span className="text-lg font-black text-blue-500">Rs. {order.total}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6">
                  {editId === order.id ? (
                    <>
                      <Button className="flex-1 bg-orange-700 hover:bg-orange-800 text-white" onClick={saveEdit}><Check className="w-4 h-4" /></Button>
                      <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-400" onClick={() => setEditId(null)}><X className="w-4 h-4" /></Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="bg-white  text-zinc-800 hover:text-orange-400" onClick={() => { setEditId(order.id); setEditedData(order); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        className={`flex-1 font-bold uppercase text-[10px] tracking-widest transition-all ${order.dispatched ? "bg-white text-zinc-500 cursor-not-allowed" : "bg-orange-400 hover:bg-orange-600 text-white"}`}
                        onClick={() => !order.dispatched && confirmAction("dispatch", order.id)}
                        disabled={order.dispatched}
                      >
                        {order.dispatched ? "Dispatched" : "Book Shipment"}
                      </Button>
                      <Button variant="destructive" className="bg-white hover:bg-red-900/40 text-red-500 border border-red-900/20" onClick={() => confirmAction("delete", order.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Popups */}
        {popup && (
          <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex justify-center items-center z-50 p-6">
            <div className="bg-zinc-900 border border-orange-700/50 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-orange-700/20 rounded-full flex items-center justify-center mx-auto mb-6">
                {popup.type === 'delete' ? <Trash2 className="text-orange-700 w-8 h-8" /> : <Truck className="text-orange-700 w-8 h-8" />}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Confirm Action</h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {popup.type === "delete" 
                  ? "Are you sure you want to permanently remove this order from the database? This cannot be undone." 
                  : "Proceed with PostEx booking? This will generate a tracking number and mark as dispatched."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-orange-700 hover:bg-orange-800 text-white font-bold" onClick={handleConfirm}>Confirm</Button>
                <Button variant="outline" className="border-zinc-800 text-zinc-400" onClick={closePopup}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}