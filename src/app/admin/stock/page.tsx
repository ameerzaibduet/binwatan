"use client"

import { useEffect, useState, useMemo } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts"
import { 
  Banknote, ShoppingBag, Clock, TrendingUp, Package, 
  ArrowUpRight, Filter, Download, MoreHorizontal 
} from "lucide-react"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import weekOfYear from "dayjs/plugin/weekOfYear"

dayjs.extend(isBetween)
dayjs.extend(weekOfYear)

const COLORS = ['#000000', '#FACC15', '#4ade80', '#f87171'];

export default function ManualOrdersDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly">("daily")
  const [daysFilter, setDaysFilter] = useState(30)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabaseClient
        .from("manual_orders")
        .select("*")
        .order("created_at", { ascending: false })
      if (!error) setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const analytics = useMemo(() => {
    const now = dayjs()
    const cutoffDate = now.subtract(daysFilter, "day").startOf("day")
    const filtered = orders.filter(o => dayjs(o.created_at).isAfter(cutoffDate))

    // Mapping charts and breakdowns
    const chartMap: Record<string, any> = {}
    const refMap: Record<string, any> = {}

    filtered.forEach(o => {
      // Time grouping
      let label = ""
      if (groupBy === "daily") label = dayjs(o.created_at).format("DD MMM")
      else if (groupBy === "weekly") label = `Week ${dayjs(o.created_at).week()}`
      else label = dayjs(o.created_at).format("MMM YYYY")

      if (!chartMap[label]) chartMap[label] = { label, total: 0, dispatched: 0, revenue: 0, timestamp: dayjs(o.created_at).unix() }
      chartMap[label].total += 1
      if (o.dispatched) {
        chartMap[label].dispatched += 1
        chartMap[label].revenue += Number(o.invoice_payment || 0)
      }

      // Reference breakdown
      const ref = o.referenceId || "Unknown"
      refMap[ref] = (refMap[ref] || 0) + 1
    })

    const graphData = Object.values(chartMap).sort((a, b) => a.timestamp - b.timestamp)
    const refData = Object.entries(refMap).map(([name, value]) => ({ name, value }))
    const totalRevenue = filtered.filter(o => o.dispatched).reduce((sum, o) => sum + Number(o.invoice_payment || 0), 0)
    const dispatchedCount = filtered.filter(o => o.dispatched).length
    const pendingCount = filtered.length - dispatchedCount

    const pieData = [
      { name: 'Dispatched', value: dispatchedCount },
      { name: 'Pending', value: pendingCount }
    ]

    return {
      graphData,
      refData,
      pieData,
      recentOrders: filtered.slice(0, 5),
      stats: { totalOrders: filtered.length, totalRevenue, dispatchedCount, pendingCount }
    }
  }, [orders, daysFilter, groupBy])

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-black rounded-full animate-spin"></div>
        <p className="font-black text-black uppercase tracking-widest text-xs">Synchronizing Intelligence</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-black pb-12">
      {/* Sidebar-style Nav Header */}
      <nav className="bg-black text-white p-6 mb-8 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-400 p-2 rounded-lg">
            <TrendingUp size={24} className="text-black" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter italic">PostEx <span className="text-yellow-400">Pro</span></h1>
        </div>
        <div className="flex gap-3">
           <button className="bg-zinc-800 p-2 rounded-full hover:bg-yellow-400 hover:text-black transition-colors">
            <Download size={18} />
          </button>
          <button className="bg-zinc-800 p-2 rounded-full hover:bg-yellow-400 hover:text-black transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </nav>

      <div className="max-w-[1500px] mx-auto px-6 space-y-8">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-2xl w-fit">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDaysFilter(d)}
                className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${daysFilter === d ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:text-black'}`}>
                {d}D
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map(g => (
              <button key={g} onClick={() => setGroupBy(g as any)}
                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${groupBy === g ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-zinc-100 text-zinc-400 hover:border-black hover:text-black'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard label="Volume" value={analytics.stats.totalOrders} icon={ShoppingBag} trend="+12%" color="black" />
          <KPICard label="Revenue" value={`₨${analytics.stats.totalRevenue.toLocaleString()}`} icon={Banknote} trend="+8.4%" color="yellow" />
          <KPICard label="Fulfilled" value={analytics.stats.dispatchedCount} icon={Package} trend="+18%" color="white" />
          <KPICard label="Backlog" value={analytics.stats.pendingCount} icon={Clock} trend="-2%" color="white" />
        </div>

        {/* Analytics Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Financial Trajectory</h3>
                <p className="text-zinc-400 text-xs font-bold">Revenue performance over selected period</p>
              </div>
              <ArrowUpRight className="text-yellow-500" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.graphData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:10, fontWeight:'bold'}} />
                  <Tooltip contentStyle={{borderRadius:'15px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="revenue" stroke="#000" fill="url(#revGrad)" strokeWidth={4} dot={{r:4, fill:'#000'}} activeDot={{r:8, fill:'#FACC15'}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Status Distribution */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Market Share</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.pieData} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                    {analytics.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black">{Math.round((analytics.stats.dispatchedCount / analytics.stats.totalOrders) * 100)}%</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Success</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table: Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-zinc-100 flex flex-col">
            <div className="p-8 border-b border-zinc-50 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight">Latest Entries</h3>
              <button className="text-xs font-bold text-zinc-400 hover:text-black">View All Activity</button>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100">
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3 text-right">Payment</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {analytics.recentOrders.map((o: any, i: number) => (
                    <tr key={i} className="group hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-4 text-xs font-black">{o.referenceId || '--'}</td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-bold">{o.customerName}</p>
                        <p className="text-[10px] text-zinc-400">{o.customerPhone}</p>
                      </td>
                      <td className="px-4 py-4 text-[10px] font-bold uppercase">{o.cityName}</td>
                      <td className="px-4 py-4 text-xs font-black text-right">₨{o.invoice_payment}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.dispatched ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {o.dispatched ? 'Shipped' : 'Staged'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Efficiency Bar Chart */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100">
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Workload Balance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.graphData}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize:9, fontWeight:'bold'}} />
                  <Tooltip cursor={{fill: '#f8f8f8'}} />
                  <Bar dataKey="total" fill="#E5E7EB" radius={[10, 10, 0, 0]} barSize={20} />
                  <Bar dataKey="dispatched" fill="#000000" radius={[10, 10, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, trend, color }: any) {
  const themes: any = {
    black: 'bg-black text-white shadow-black/20',
    yellow: 'bg-yellow-400 text-black shadow-yellow-400/20',
    white: 'bg-white text-black border border-zinc-100 shadow-sm'
  }
  
  return (
    <div className={`${themes[color]} p-8 rounded-[2rem] shadow-xl flex flex-col justify-between h-44 group hover:scale-[1.02] transition-transform cursor-default`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${color === 'black' ? 'bg-zinc-800' : color === 'yellow' ? 'bg-black/10' : 'bg-zinc-100'}`}>
          <Icon size={20} className={color === 'yellow' ? 'text-black' : color === 'black' ? 'text-yellow-400' : 'text-zinc-600'} />
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${trend.startsWith('+') ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {trend}
          </span>
        </div>
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${color === 'black' ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</p>
        <h2 className="text-3xl font-black tracking-tighter">{value}</h2>
      </div>
    </div>
  )
}