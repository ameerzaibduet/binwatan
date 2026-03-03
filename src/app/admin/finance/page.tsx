"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/utils/supabase/client"

export default function AdminDashboard() {
  const router = useRouter()

  const [workers, setWorkers] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [selectedWorker, setSelectedWorker] = useState("")
  const [products, setProducts] = useState("")
  const [rate, setRate] = useState("")
  const [amountTaken, setAmountTaken] = useState("")
  const [editing, setEditing] = useState<any>(null)
  const [message, setMessage] = useState("")

  // Load workers (only role=worker)
  useEffect(() => {
    const loadWorkers = async () => {
      const { data } = await supabaseClient
        .from("workers")
        .select("id, name")
        .eq("role", "worker")

      setWorkers(data || [])
    }

    loadWorkers()
  }, [])

  // Load history
  useEffect(() => {
    const loadRecords = async () => {
      const { data } = await supabaseClient
        .from("worker_progress")
        .select(`
          id,
          products_stitched,
          rate_per_cover,
          amount_taken,
          total,
          workers (name)
        `)
        .order("created_at", { ascending: false })

      setRecords(data || [])
    }

    loadRecords()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    const total = Number(products) * Number(rate)

    if (editing) {
      await supabaseClient
        .from("worker_progress")
        .update({
          worker_id: selectedWorker,
          products_stitched: Number(products),
          rate_per_cover: Number(rate),
          amount_taken: Number(amountTaken),
          total,
        })
        .eq("id", editing.id)

      setMessage("Record updated ✅")
      setEditing(null)
    } else {
      await supabaseClient
        .from("worker_progress")
        .insert({
          worker_id: selectedWorker,
          products_stitched: Number(products),
          rate_per_cover: Number(rate),
          amount_taken: Number(amountTaken),
          total,
        })

      setMessage("Record added successfully ✅")
    }

    setProducts("")
    setRate("")
    setAmountTaken("")

    // reload history
    const { data } = await supabaseClient
      .from("worker_progress")
      .select(`
        id,
        products_stitched,
        rate_per_cover,
        amount_taken,
        total,
        workers (name)
      `)
      .order("created_at", { ascending: false })

    setRecords(data || [])
  }

  const handleEdit = (record: any) => {
    setEditing(record)
    setSelectedWorker(record.worker_id)
    setProducts(record.products_stitched)
    setRate(record.rate_per_cover)
    setAmountTaken(record.amount_taken)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete record?")) return

    await supabaseClient
      .from("worker_progress")
      .delete()
      .eq("id", id)

    const { data } = await supabaseClient
      .from("worker_progress")
      .select(`
        id,
        products_stitched,
        rate_per_cover,
        amount_taken,
        total,
        workers (name)
      `)

    setRecords(data || [])
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">
            Admin Dashboard
          </h1>

          <button
            onClick={() => router.push("/admin/create-user")}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-orange-400 hover:text-black transition"
          >
            Create User
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? "Edit Record" : "Add Daily Record"}
          </h2>

          {message && (
            <div className="mb-4 text-sm text-green-600">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">

            {/* Worker Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Select Worker
              </label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select Worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Products Stitched
              </label>
              <input
                type="number"
                required
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Rate per Cover
              </label>
              <input
                type="number"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Amount Taken */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount Taken
              </label>
              <input
                type="number"
                required
                value={amountTaken}
                onChange={(e) => setAmountTaken(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Total (Auto) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Total (Auto)
              </label>
              <input
                type="text"
                readOnly
                value={Number(products || 0) * Number(rate || 0)}
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>

            <button
              type="submit"
              className="md:col-span-2 bg-black text-white py-2 rounded-lg hover:bg-orange-400 hover:text-black transition"
            >
              {editing ? "Update Record" : "Save Record"}
            </button>

          </form>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Worker</th>
                  <th className="p-2 text-left">Products</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="p-2">{record.workers?.name}</td>
                    <td className="p-2">{record.products_stitched}</td>
                    <td className="p-2">{record.rate_per_cover}</td>
                    <td className="p-2">{record.amount_taken}</td>
                    <td className="p-2">{record.total}</td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  )
}