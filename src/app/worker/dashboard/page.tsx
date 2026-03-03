"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function WorkerDashboard() {
  const [worker, setWorker] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [filter, setFilter] = useState("30") // default 30 days
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const { data: user } = await supabaseClient.auth.getUser()

      if (!user.user) return

      const { data: workerData } = await supabaseClient
        .from("workers")
        .select("*")
        .eq("id", user.user.id)
        .single()

      setWorker(workerData)

      // Date filtering
      const days = Number(filter)
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)

      const { data: progress } = await supabaseClient
        .from("worker_progress")
        .select("*")
        .eq("worker_id", user.user.id)
        .gte("created_at", fromDate.toISOString())
        .order("created_at", { ascending: true })

      setRecords(progress || [])
      setLoading(false)
    }

    loadData()
  }, [filter])

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    window.location.href = "/login"
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // Calculations
  const totalEarned = records.reduce((sum, r) => sum + Number(r.total || 0), 0)
  const totalTaken = records.reduce((sum, r) => sum + Number(r.amount_taken || 0), 0)
  const pending = totalEarned - totalTaken
  const products = records.reduce((sum, r) => sum + Number(r.products_stitched || 0), 0)

  // Chart data
  const chartData = records.map((r) => ({
    date: new Date(r.created_at).toLocaleDateString(),
    earned: Number(r.total),
    taken: Number(r.amount_taken),
  }))

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Bar */}
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{worker?.name}</h1>
          <p className="text-sm text-gray-300">{worker?.mobile}</p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-orange-400 text-black px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto">

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-sm text-gray-600">Pending Payment</h3>
              <p className="text-xl font-bold">₹ {pending}</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-sm text-gray-600">Products Stitched</h3>
              <p className="text-xl font-bold">{products}</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-sm text-gray-600">Amount Earned</h3>
              <p className="text-xl font-bold">₹ {totalEarned}</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="text-sm text-gray-600">Amount Taken</h3>
              <p className="text-xl font-bold">₹ {totalTaken}</p>
            </div>

          </div>

          {/* Filters */}
          <div className="mb-4">
            <label className="text-sm font-medium">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="ml-2 border rounded-lg px-3 py-1"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="365">1 Year</option>
            </select>
          </div>

          {/* Graph */}
          <div className="bg-white p-4 rounded-xl shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Analytics
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="earned" stroke="#000" />
                  <Line type="monotone" dataKey="taken" stroke="#f97316" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}