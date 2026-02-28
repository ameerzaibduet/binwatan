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
          .select("id, created_at, dispatched, total")
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

  /* ================= FILTER ================= */

  const filteredOrders = useMemo(() => {
    const fromDate = dayjs().subtract(daysFilter, "day")
    return orders.filter(o => dayjs(o.created_at).isAfter(fromDate))
  }, [orders, daysFilter])

  /* ================= KPIs ================= */

  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const dispatchedOrders = filteredOrders.filter(o => o.dispatched === true).length
  const unbookedOrders = filteredOrders.filter(o => !o.dispatched).length

  /* ================= GROUP ANALYTICS ================= */

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

      if (!grouped[label]) {
        grouped[label] = { revenue: 0, orders: 0 }
      }

      grouped[label].revenue += Number(o.total || 0)
      grouped[label].orders += 1
    })

    return Object.entries(grouped).map(([label, data]) => ({
      label,
      revenue: data.revenue,
      orders: data.orders
    }))

  }, [filteredOrders, groupBy])

  const statusData = [
    { name: "Dispatched", value: dispatchedOrders },
    { name: "Unbooked", value: unbookedOrders }
  ]

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-black">
          Dashboard Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Performance insights
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Orders" value={totalOrders} />
        <KPICard title="Revenue" value={`Rs ${totalRevenue.toLocaleString()}`} />
        <KPICard title="Dispatched" value={dispatchedOrders} />
        <KPICard title="Unbooked" value={unbookedOrders} />
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

      {/* REVENUE CHART */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-lg font-bold mb-4 text-black">Revenue Trend</h3>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] md:min-w-0">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#fb923c"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ORDERS BAR CHART */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-lg font-bold mb-4 text-black">Orders Trend</h3>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] md:min-w-0">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  dataKey="orders"
                  fill="#000000"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h3 className="text-lg font-bold mb-4 text-black">
          Status Breakdown
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
              <Cell fill="#fb923c" />
              <Cell fill="#000000" />
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}