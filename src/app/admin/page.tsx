"use client"

import { useEffect, useState, useMemo } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell, PieChart, Pie
} from "recharts"
import { 
  ShoppingBag, Banknote, Clock, ArrowUpRight, ArrowDownRight,
  Inbox, Calendar, Filter, TrendingUp, BarChart3, Package
} from "lucide-react"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import weekOfYear from "dayjs/plugin/weekOfYear"

dayjs.extend(isBetween)
dayjs.extend(weekOfYear)

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // DEFAULT FILTERS
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

  const analytics = useMemo(() => {
    const now = dayjs()
    const cutoffDate = now.subtract(daysFilter, 'day').startOf('day')
    
    // 1. FILTER DATA BY SELECTED RANGE
    const filteredOrders = orders.filter(o => dayjs(o.created_at).isAfter(cutoffDate))
    
    // 2. MOM COMPARISON DATA (Previous equivalent period)
    const prevCutoffStart = cutoffDate.subtract(daysFilter, 'day')
    const prevOrders = orders.filter(o => 
      dayjs(o.created_at).isBetween(prevCutoffStart, cutoffDate)
    )

    // 3. GROUPING LOGIC FOR GRAPHS
    const chartMap: any = {}
    
    filteredOrders.forEach(o => {
      let label = ""
      if (groupBy === "daily") label = dayjs(o.created_at).format("DD MMM")
      else if (groupBy === "weekly") label = `Week ${dayjs(o.created_at).week()}`
      else if (groupBy === "monthly") label = dayjs(o.created_at).format("MMM YYYY")

      if (!chartMap[label]) {
        chartMap[label] = { label, totalVolume: 0, dispatchedVolume: 0, revenue: 0, timestamp: dayjs(o.created_at).unix() }
      }
      
      chartMap[label].totalVolume += 1
      if (o.dispatched) {
        chartMap[label].dispatchedVolume += 1
        chartMap[label].revenue += (o.total || 0)
      }
    })

    const graphData = Object.values(chartMap).sort((a: any, b: any) => a.timestamp - b.timestamp)

    // 4. STAT CALCULATIONS
    const currentRevenue = filteredOrders.filter(o => o.dispatched).reduce((s, o) => s + (o.total || 0), 0)
    const prevRevenue = prevOrders.filter(o => o.dispatched).reduce((s, o) => s + (o.total || 0), 0)
    
    const unbookedCount = orders.filter(o => !o.dispatched).length

    return {
      graphData,
      stats: {
        totalRevenue: currentRevenue,
        revenueGrowth: prevRevenue === 0 ? 0 : ((currentRevenue - prevRevenue) / prevRevenue) * 100,
        totalOrders: filteredOrders.length,
        volumeGrowth: prevOrders.length === 0 ? 0 : ((filteredOrders.length - prevOrders.length) / prevOrders.length) * 100,
        unbookedCount,
        dispatchedCount: filteredOrders.filter(o => o.dispatched).length,
      }
    }
  }, [orders, daysFilter, groupBy])

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400 animate-pulse uppercase tracking-[0.3em]">Syncing Terminal...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 text-slate-900 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-8">
        
        {/* GLOBAL FILTER COMMAND BAR */}
        <header className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 px-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white"><BarChart3 size={20}/></div>
            <h1 className="font-black text-xl tracking-tighter uppercase">Operations <span className="text-orange-500">Hub</span></h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Range Select */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {[7, 30, 90].map((d) => (
                <button key={d} onClick={() => setDaysFilter(d)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${daysFilter === d ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  {d} Days
                </button>
              ))}
            </div>
            
            <div className="w-[1px] h-6 bg-slate-200 mx-1 hidden md:block" />

            {/* Grouping Select */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["daily", "weekly", "monthly"].map((g) => (
                <button key={g} onClick={() => setGroupBy(g as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${groupBy === g ? "bg-black text-white" : "text-slate-400 hover:text-slate-600"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* TOP KPI CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
            label="Booked Revenue" 
            value={`₨${analytics.stats.totalRevenue.toLocaleString()}`} 
            growth={analytics.stats.revenueGrowth}
            icon={Banknote} 
            color="orange"
          />
          <KPICard 
            label="Order Intake" 
            value={analytics.stats.totalOrders} 
            growth={analytics.stats.volumeGrowth}
            icon={ShoppingBag} 
            color="black"
          />
          <div className="bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center"><Clock size={20}/></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Unbooked</p>
              </div>
              <h2 className="text-5xl font-black italic">{analytics.stats.unbookedCount}</h2>
              <p className="text-[10px] font-bold text-red-500 uppercase mt-2 animate-pulse">Action required in PostEx Booking</p>
            </div>
            <Inbox className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform" size={140} />
          </div>
        </section>

        {/* REVENUE TRAJECTORY CHART */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="mb-10">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="text-orange-500" /> Revenue Trajectory
            </h3>
            <p className="text-xs font-bold text-slate-400">Total cash value of dispatched items ({groupBy})</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.graphData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip content={<RevenueTooltip />} cursor={{stroke: '#f97316', strokeWidth: 1}} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={4} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LOGISTICS VOLUME CHART */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Package className="text-black" /> Booking Efficiency
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase"><div className="w-2 h-2 rounded-full bg-slate-200" /> Total</div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase"><div className="w-2 h-2 rounded-full bg-orange-500" /> Booked</div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.graphData} barGap={8}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Tooltip cursor={{fill: '#f8fafc'}} content={<VolumeTooltip />} />
                <Bar dataKey="totalVolume" fill="#e2e8f0" radius={[4, 4, 4, 4]} barSize={20} />
                <Bar dataKey="dispatchedVolume" fill="#f97316" radius={[4, 4, 4, 4]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}

function KPICard({ label, value, growth, icon: Icon, color }: any) {
  const isPositive = growth >= 0
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/30">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-black'}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(Math.round(growth))}%
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-3xl font-black tracking-tighter italic">{value}</h4>
    </div>
  )
}

const RevenueTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-4 rounded-2xl shadow-2xl border border-white/10">
        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{payload[0].payload.label}</p>
        <p className="text-xl font-black text-orange-500">₨{payload[0].value.toLocaleString()}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase">Settled Revenue</p>
      </div>
    )
  }
  return null
}

const VolumeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{payload[0].payload.label}</p>
        <p className="text-sm font-black">Total: {payload[0].value}</p>
        <p className="text-sm font-black text-orange-500">Booked: {payload[1].value}</p>
      </div>
    )
  }
  return null
}