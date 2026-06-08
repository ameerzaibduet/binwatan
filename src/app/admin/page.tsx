"use client"

import { useEffect, useState, useMemo } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from "recharts"
import dayjs from "dayjs"
import weekOfYear from "dayjs/plugin/weekOfYear"
import { syncAllWebOrders } from "@/lib/courier/sync-all"

dayjs.extend(weekOfYear)

/* ================= KPI CARD ================= */

function KPICard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border-l-4 border-orange-400 p-4 min-h-[100px] flex flex-col justify-between">
      <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wide">
        {title}
      </p>
      <h2 className="text-xl md:text-2xl font-bold text-black mt-2 break-words">
        {value}
      </h2>
    </div>
  )
}

export default function DashboardPage() {

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [daysFilter, setDaysFilter] = useState(30)
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily")
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  /* ================= FETCH ALL ORDERS ================= */

  useEffect(() => {
    const fetchOrders = async () => {

      let allOrders: any[] = []
      let from = 0
      const limit = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabaseClient
          .from("orders")
          .select("id, created_at, dispatched, total, delivery_date")
          .range(from, from + limit - 1)

        if (error) break

        if (data && data.length > 0) {
          allOrders = [...allOrders, ...data]
          from += limit
        } else {
          hasMore = false
        }
      }

      setOrders(allOrders)
      setLoading(false)
    }

    fetchOrders()
  }, [])

  /* ================= SYNC API CALL ================= */

  const syncWebOrders = async () => {
    setSyncStatus("Syncing active web parcels (PostEx + NextStep)...")

    try {
      const data = await syncAllWebOrders()

      if (data.success) {
        setSyncStatus(data.message || "Sync completed!")
      } else {
        setSyncStatus("Sync failed!")
      }
    } catch {
      setSyncStatus("Error syncing!")
    }

    setTimeout(() => setSyncStatus(null), 5000)
  }

  /* ================= FILTER ================= */

  const filteredOrders = useMemo(() => {
    const fromDate = dayjs().subtract(daysFilter, "day")
    return orders.filter(o => dayjs(o.created_at).isAfter(fromDate))
  }, [orders, daysFilter])

  /* ================= KPIs ================= */

  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const dispatchedOrders = filteredOrders.filter(o => o.dispatched === true).length
  const deliveredOrders = filteredOrders.filter(o => o.delivery_date).length
  const pendingOrders = totalOrders - deliveredOrders

  /* ================= GROUP ANALYTICS (SORTED & FIXED) ================= */

  const analytics = useMemo(() => {

    const grouped: Record<string, any> = {}

    filteredOrders.forEach(o => {

      let label = ""

      if (groupBy === "daily") {
        label = dayjs(o.created_at).format("DD MMM")
      } else if (groupBy === "weekly") {
        label = `W${dayjs(o.created_at).week()}`
      } else if (groupBy === "monthly") {
        label = dayjs(o.created_at).format("MMM YYYY")
      } else {
        label = dayjs(o.created_at).format("YYYY")
      }

      const time = dayjs(o.created_at).valueOf()

      if (!grouped[label]) {
        grouped[label] = { revenue: 0, orders: 0, delivered: 0, time }
      }

      grouped[label].revenue += Number(o.total || 0)
      grouped[label].orders += 1
      if (o.delivery_date) grouped[label].delivered += 1
    })

    return Object.entries(grouped)
      .map(([label, data]: any) => ({
        label,
        revenue: data.revenue || 0,
        orders: data.orders || 0,
        delivered: data.delivered || 0,
        time: data.time || 0
      }))
      .sort((a, b) => a.time - b.time) // DATE SORT FIX

  }, [filteredOrders, groupBy])

  const statusData = [
    { name: "Delivered", value: deliveredOrders },
    { name: "Pending", value: pendingOrders }
  ]

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 space-y-8">

      {/* HEADER + SYNC BUTTON */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Web Orders Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            PostEx + NextStep · sync skips delivered, returned, and orders older than 2 months
          </p>
        </div>

        <button
          onClick={syncWebOrders}
          className="bg-orange-400 text-black px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-orange-500"
        >
          Sync Active Parcels
        </button>
      </div>

      {syncStatus && (
        <div className="text-center text-sm text-orange-600">{syncStatus}</div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Orders" value={totalOrders} />
        <KPICard title="Revenue" value={`Rs ${totalRevenue.toLocaleString()}`} />
        <KPICard title="Dispatched" value={dispatchedOrders} />
        <KPICard title="Delivered" value={deliveredOrders} />
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3">
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDaysFilter(d)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              daysFilter === d
                ? "bg-orange-400 text-black shadow-md"
                : "bg-black text-white hover:bg-orange-400 hover:text-black"
            }`}
          >
            {d === 365 ? "1 Year" : `${d} Days`}
          </button>
        ))}
      </div>

      {/* GROUPING */}
      <div className="flex flex-wrap gap-3">
        {["daily", "weekly", "monthly", "yearly"].map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              groupBy === g
                ? "bg-orange-400 text-black shadow-md"
                : "bg-black text-white hover:bg-orange-400 hover:text-black"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* LINE GRAPH (REVENUE, ORDERS, DELIVERED) */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-lg font-bold mb-4 text-black">
          Revenue, Orders & Delivered Trend
        </h3>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={analytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#fb923c"
              strokeWidth={3}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="orders"
              stroke="#000000"
              strokeWidth={2}
              dot={{ r: 3 }}
            />

            <Line
              type="monotone"
              dataKey="delivered"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BAR CHART */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-lg font-bold mb-4 text-black">Orders Trend</h3>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={analytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="orders"
              fill="#000000"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* STATUS PIE CHART */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-lg font-bold mb-4 text-black">
          Delivery Status
        </h3>

        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              innerRadius={50}
              label
            >
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}