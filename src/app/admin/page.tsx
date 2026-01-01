"use client"

import { useEffect, useState, useMemo } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell, ComposedChart, Line,
  PieChart, Pie
} from "recharts"
import { 
  ShoppingBag, CheckCircle, Clock, Banknote, 
  Package, TrendingUp, Download, Bell,
  ArrowRight, Target, Zap, Filter, Layers, Activity
} from "lucide-react"
import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import weekday from "dayjs/plugin/weekday"

dayjs.extend(isoWeek)
dayjs.extend(weekday)

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly">("daily")
  const [daysFilter, setDaysFilter] = useState(30)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabaseClient
        .from("orders")
        .select("id, created_at, dispatched, total")
      if (!error) setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  // 1. ADVANCED DATA PROCESSING
  const processedData = useMemo(() => {
    const cutoff = dayjs().subtract(daysFilter, 'day')
    const filtered = orders.filter(o => dayjs(o.created_at).isAfter(cutoff))
    
    const chartMap: any = {}
    const hourlyMap = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }))

    filtered.forEach(o => {
      // Grouping Logic
      let label = ""
      if (groupBy === "daily") label = dayjs(o.created_at).format("DD MMM")
      else if (groupBy === "weekly") label = `Wk ${dayjs(o.created_at).isoWeek()}`
      else if (groupBy === "monthly") label = dayjs(o.created_at).format("MMM YYYY")

      if (!chartMap[label]) {
        chartMap[label] = { label, sales: 0, count: 0, timestamp: dayjs(o.created_at).unix() }
      }
      chartMap[label].count += 1
      if (o.dispatched) chartMap[label].sales += (o.total || 0)

      // Hourly Heatmap Logic
      const h = dayjs(o.created_at).hour()
      hourlyMap[h].count += 1
    })

    const trendData = Object.values(chartMap).sort((a: any, b: any) => a.timestamp - b.timestamp)
    
    const totalOrders = filtered.length
    const dispatched = filtered.filter(o => o.dispatched).length
    const revenue = filtered.filter(o => o.dispatched).reduce((sum, o) => sum + (o.total || 0), 0)

    return {
      trendData,
      hourlyMap,
      stats: {
        totalOrders,
        dispatched,
        pending: totalOrders - dispatched,
        revenue,
        successRate: totalOrders > 0 ? Math.round((dispatched / totalOrders) * 100) : 0,
        pieData: [
          { name: 'Dispatched', value: dispatched, fill: '#10b981' },
          { name: 'Pending', value: totalOrders - dispatched, fill: '#f97316' }
        ]
      }
    }
  }, [orders, groupBy, daysFilter])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mb-4" />
      <span className="font-black text-slate-400 tracking-widest text-xs uppercase">Syncing HQ Intelligence...</span>
    </div>
  )

  const { stats, trendData, hourlyMap } = processedData

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-10 text-slate-900">
      <div className="max-w-[1500px] mx-auto space-y-8">
        
        {/* TOP COMMAND BAR */}
        <header className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter uppercase italic">BinWatan <span className="text-orange-500">HQ</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Global Operations Terminal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              {["daily", "weekly", "monthly"].map((opt) => (
                <button key={opt} onClick={() => setGroupBy(opt as any)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${groupBy === opt ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  {opt}
                </button>
              ))}
            </div>

            {/* Lookback Filter */}
            <div className="h-10 w-[1px] bg-slate-200 hidden lg:block" />
            <select 
              value={daysFilter} 
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase px-6 py-3 focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value={7}>Past 7 Days</option>
              <option value={30}>Past 30 Days</option>
              <option value={90}>Past Quarter</option>
            </select>
          </div>
        </header>

        {/* METRIC GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Gross Revenue" value={`₨${stats.revenue.toLocaleString()}`} icon={Banknote} color="emerald" />
          <StatCard label="Order Density" value={stats.totalOrders} icon={ShoppingBag} color="orange" />
          <StatCard label="Awaiting Dispatch" value={stats.pending} icon={Clock} color="blue" />
          <StatCard label="Fulfillment Score" value={`${stats.successRate}%`} icon={Target} color="purple" />
        </section>

        {/* ROW 1: REVENUE TRENDS & FULFILLMENT RATIO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-50">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-xl tracking-tight flex items-center gap-3">
                <Layers className="text-orange-500" /> Financial Trajectory
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[10px] font-black text-slate-400 uppercase">Sales Trend</span></div>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={15} />
                  <YAxis hide />
                  <Tooltip content={<ModernTooltip />} cursor={{stroke: '#f1f5f9', strokeWidth: 2}} />
                  <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={4} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-50 flex flex-col items-center">
            <h3 className="font-black text-xl tracking-tight mb-10">System Mix</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                    {stats.pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-8 w-full mt-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Fulfilled</p>
                <p className="text-2xl font-black text-emerald-500">{stats.dispatched}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase mb-1">In Queue</p>
                <p className="text-2xl font-black text-orange-500">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: HOURLY DENSITY & ORDER COUNTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-black text-white rounded-[3.5rem] p-10 shadow-2xl shadow-black/20">
            <h3 className="font-black text-xl tracking-tight mb-2 text-center">Hourly Density</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10 text-center">Operational Peak Window</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyMap}>
                  <Bar dataKey="count">
                    {hourlyMap.map((entry, index) => (
                      <Cell key={index} fill={entry.count > 0 ? '#f97316' : '#1e293b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10">
              <span className="text-xs font-bold text-slate-400 uppercase">Top Hour</span>
              <span className="text-xl font-black text-orange-500">
                {hourlyMap.reduce((prev, curr) => (prev.count > curr.count) ? prev : curr).hour}
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200/40 border border-slate-50">
            <h3 className="font-black text-xl tracking-tight mb-8">Order Volume Flow</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} content={<CountTooltip />} />
                  <Bar dataKey="count" fill="#000" radius={[10, 10, 10, 10]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const styles: any = {
    emerald: "bg-emerald-50 text-emerald-500",
    orange: "bg-orange-50 text-orange-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500"
  }
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-slate-50 hover:scale-[1.02] transition-all group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 ${styles[color]}`}>
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
    </div>
  )
}

const ModernTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-6 rounded-3xl shadow-2xl border border-white/10 min-w-[200px]">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{payload[0].payload.label}</p>
        <p className="text-xs font-bold text-orange-500 uppercase">Gross Sales</p>
        <p className="text-2xl font-black tracking-tighter">₨{payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

const CountTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 text-center">
        <p className="text-xl font-black">{payload[0].value} Orders</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{payload[0].payload.label}</p>
      </div>
    )
  }
  return null
}