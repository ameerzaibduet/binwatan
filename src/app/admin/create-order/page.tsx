"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function CreateOrderPage() {
  const [form, setForm] = useState({
    orderRefNumber: "",
    invoicePayment: "",
    orderDetail: "",
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    transactionNotes: "",
    cityName: "",
    invoiceDivision: "1",
    items: "1",
    pickupAddressCode: "",
    storeAddressCode: "001", // Valid address code from PostEx
    orderType: "Normal",
  })

  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin")
    if (isAdmin !== "true") {
      router.push("/admin/login")
    }
  }, [router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      cityName: form.cityName,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      deliveryAddress: form.deliveryAddress,
      invoiceDivision: parseInt(form.invoiceDivision),
      invoicePayment: parseInt(form.invoicePayment),
      items: parseInt(form.items),
      orderDetail: form.orderDetail,
      orderRefNumber: form.orderRefNumber,
      orderType: form.orderType,
      transactionNotes: form.transactionNotes,
      pickupAddressCode: form.pickupAddressCode,
      storeAddressCode: form.storeAddressCode,
    }

    try {
      const res = await fetch("/api/postex-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        alert(`Order failed: ${result.statusMessage || "Unknown error"}`)
      } else {
        alert(`Order placed successfully! Tracking #: ${result.dist?.trackingNumber}`)
      }
    } catch (err) {
      console.error("Order placement error:", err)
      alert("Something went wrong!")
    }

    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">📦 Create Manual Order</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="orderRefNumber" placeholder="Order Ref Number" value={form.orderRefNumber} onChange={handleChange} required />
        <Input name="invoicePayment" type="number" placeholder="Transaction Amount" value={form.invoicePayment} onChange={handleChange} required />
        <Input name="customerName" placeholder="Customer Name" value={form.customerName} onChange={handleChange} required />
        <Input name="customerPhone" placeholder="Customer Phone (03xxxxxxxxx)" value={form.customerPhone} onChange={handleChange} required />
        <Textarea name="deliveryAddress" placeholder="Delivery Address" value={form.deliveryAddress} onChange={handleChange} required />
        <Input name="cityName" placeholder="City Name" value={form.cityName} onChange={handleChange} required />
        <Textarea name="orderDetail" placeholder="Order Detail (optional)" value={form.orderDetail} onChange={handleChange} />
        <Textarea name="transactionNotes" placeholder="Transaction Notes (optional)" value={form.transactionNotes} onChange={handleChange} />
        <Input name="invoiceDivision" type="number" placeholder="Invoice Division" value={form.invoiceDivision} onChange={handleChange} required />
        <Input name="items" type="number" placeholder="Number of Items" value={form.items} onChange={handleChange} required />
        <Input name="pickupAddressCode" placeholder="Pickup Address Code (optional)" value={form.pickupAddressCode} onChange={handleChange} />
        <Input name="storeAddressCode" placeholder="Store Address Code" value={form.storeAddressCode} onChange={handleChange} required />
        <Input name="orderType" placeholder="Order Type (Normal, Reverse, Replacement)" value={form.orderType} onChange={handleChange} required />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Placing Order..." : "Place Order"}
        </Button>
      </form>
    </div>
  )
}
