"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { v4 as uuid } from "uuid"
import { PackagePlus, History, Warehouse, PlusCircle, MinusCircle } from "lucide-react"

const initialProducts = [
  { id: "1", name: "Black Shirt", stock: 50 },
  { id: "2", name: "White Hoodie", stock: 30 },
  { id: "3", name: "Sports Shoes", stock: 20 },
]

export default function StockManagementPage() {
  const [products, setProducts] = useState(initialProducts)
  const [history, setHistory] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState("1")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [type, setType] = useState<"add" | "remove">("add")
  const [newProductName, setNewProductName] = useState("")

  const selectedProduct = products.find((p) => p.id === selectedId)

  const updateStock = () => {
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) return alert("Invalid quantity")

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              stock: type === "add" ? p.stock + qty : Math.max(0, p.stock - qty),
            }
          : p
      )
    )

    setHistory([
      {
        id: uuid(),
        product: selectedProduct?.name,
        type,
        quantity: qty,
        date: new Date(),
        note,
      },
      ...history,
    ])

    setQuantity("")
    setNote("")
  }

  const addNewProduct = () => {
    if (!newProductName.trim()) return alert("Enter a product name")

    const newProduct = {
      id: uuid(),
      name: newProductName.trim(),
      stock: 0,
    }

    setProducts([newProduct, ...products])
    setNewProductName("")
    setSelectedId(newProduct.id)
  }

  return (
    <div className="p-6 space-y-10 max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold text-blue-700 flex items-center gap-3">
        <Warehouse className="w-8 h-8" /> Stock Manager
      </h1>

      {/* Add New Product */}
      <div className="bg-gradient-to-r from-indigo-100 to-white rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-2xl font-semibold text-indigo-700 flex items-center gap-2">
          <PackagePlus className="w-5 h-5" /> Add New Product
        </h2>
        <div className="flex items-end gap-4">
          <div className="w-full max-w-sm">
            <label className="text-sm font-medium text-gray-600">Product Name</label>
            <Input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="e.g. Blue Jeans"
            />
          </div>
          <Button onClick={addNewProduct} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Add Product
          </Button>
        </div>
      </div>

      {/* Stock Form */}
      <div className="bg-gradient-to-r from-purple-100 to-white rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-2xl font-semibold text-purple-700 flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> Update Stock
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Product</label>
            <select
              className="w-full border p-2 rounded"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Quantity</label>
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 10" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Type</label>
            <select
              className="w-full border p-2 rounded"
              value={type}
              onChange={(e) => setType(e.target.value as "add" | "remove")}
            >
              <option value="add">Add</option>
              <option value="remove">Remove</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Note</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          </div>
        </div>
        <Button onClick={updateStock} className="bg-purple-600 hover:bg-purple-700 text-white">
          Update Stock
        </Button>
      </div>

      {/* Current Stock */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📦 Current Stock</h2>
        <table className="w-full border text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-2 font-medium text-gray-700">Product</th>
              <th className="p-2 font-medium text-gray-700">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-2 text-gray-800">{p.name}</td>
                <td className="p-2 text-gray-800">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" /> Stock Change History
        </h2>
        <table className="w-full border text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-2 font-medium text-gray-700">Product</th>
              <th className="p-2 font-medium text-gray-700">Type</th>
              <th className="p-2 font-medium text-gray-700">Qty</th>
              <th className="p-2 font-medium text-gray-700">Note</th>
              <th className="p-2 font-medium text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-t hover:bg-gray-50">
                <td className="p-2 text-gray-800">{h.product}</td>
                <td className={`p-2 capitalize font-medium ${h.type === "add" ? "text-green-600" : "text-red-600"}`}>
                  {h.type === "add" ? <PlusCircle className="inline w-4 h-4 mr-1" /> : <MinusCircle className="inline w-4 h-4 mr-1" />} {h.type}
                </td>
                <td className="p-2 text-gray-800">{h.quantity}</td>
                <td className="p-2 text-gray-800">{h.note || "-"}</td>
                <td className="p-2 text-gray-800">{format(h.date, "PPP p")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}