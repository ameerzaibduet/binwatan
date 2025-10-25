"use client"

import { useEffect, useState } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import weekday from "dayjs/plugin/weekday"

dayjs.extend(isoWeek)
dayjs.extend(weekday)

type ChartEntry = { label: string; count: number }
type SalesEntry = { label: string; sales: number }

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly">("daily")

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabaseClient
        .from("orders")
        .select("id, created_at, dispatched, total")

      if (error) {
        console.error("Failed to fetch orders:", error)
      } else {
        setOrders(data || [])
      }
      setLoading(false)
    }

    fetchOrders()
  }, [])

  const totalOrders = orders.length
  const dispatched = orders.filter((o) => o.dispatched).length
  const pending = totalOrders - dispatched
  const totalSales = orders
    .filter((o) => o.dispatched)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  const chartData: ChartEntry[] = orders.reduce((acc: ChartEntry[], order) => {
    let label = ""
    if (groupBy === "daily") label = dayjs(order.created_at).format("YYYY-MM-DD")
    else if (groupBy === "weekly") label = `Week ${dayjs(order.created_at).isoWeek()}`
    else if (groupBy === "monthly") label = dayjs(order.created_at).format("YYYY-MM")

    const found = acc.find((entry) => entry.label === label)
    if (found) found.count += 1
    else acc.push({ label, count: 1 })

    return acc
  }, []).sort((a, b) => a.label.localeCompare(b.label))

  const salesData: SalesEntry[] = orders.reduce((acc: SalesEntry[], order) => {
    if (!order.dispatched) return acc

    let label = ""
    if (groupBy === "daily") label = dayjs(order.created_at).format("YYYY-MM-DD")
    else if (groupBy === "weekly") label = `Week ${dayjs(order.created_at).isoWeek()}`
    else if (groupBy === "monthly") label = dayjs(order.created_at).format("YYYY-MM")

    const found = acc.find((entry) => entry.label === label)
    if (found) found.sales += order.total || 0
    else acc.push({ label, sales: order.total || 0 })

    return acc
  }, []).sort((a, b) => a.label.localeCompare(b.label))

  if (loading) return <div className="p-6 text-gray-500">Loading orders...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">📊 Admin Dashboard</h1>
        <div className="inline-flex items-center border border-gray-300 rounded-md overflow-hidden shadow-sm">
          {["daily", "weekly", "monthly"].map((option) => (
            <button
              key={option}
              onClick={() => setGroupBy(option as any)}
              className={`px-4 py-2 text-sm font-medium transition ${
                groupBy === option
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white border-l-4 border-blue-500 p-4 shadow rounded min-w-[250px]">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-2xl font-semibold text-blue-600">{totalOrders}</p>
        </div>
        <div className="bg-white border-l-4 border-green-500 p-4 shadow rounded min-w-[250px]">
          <p className="text-gray-500 text-sm">Dispatched Orders</p>
          <p className="text-2xl font-semibold text-green-600">{dispatched}</p>
        </div>
        <div className="bg-white border-l-4 border-yellow-500 p-4 shadow rounded min-w-[250px]">
          <p className="text-gray-500 text-sm">Pending Orders</p>
          <p className="text-2xl font-semibold text-yellow-600">{pending}</p>
        </div>
        <div className="bg-white border-l-4 border-purple-500 p-4 shadow rounded min-w-[250px]">
          <p className="text-gray-500 text-sm">Total Sales</p>
          <p className="text-2xl font-semibold text-purple-600">
            PKR {totalSales.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Order Trend Chart */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-10 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4 capitalize">{groupBy} Order Trends</h2>
        <div className="w-full h-64 sm:h-96 min-w-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4 capitalize">{groupBy} Sales Trends</h2>
        <div className="w-full h-64 sm:h-96 min-w-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
