"use client"
import { useEffect, useState, useMemo } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar 
} from "recharts"
import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"

// CRITICAL FIX: Extend dayjs outside the component
dayjs.extend(isBetween)

const COLORS = ['#FB923C', '#000000', '#6366f1', '#10b981', '#ef4444', '#8b5cf6'];

export default function PostExEnhancedDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly">("daily")
  const [daysFilter, setDaysFilter] = useState(30)
  const [selectedAccount, setSelectedAccount] = useState("All")

  useEffect(() => {
  const fetchOrders = async () => {

    let allOrders: any[] = []
    let from = 0
    const batchSize = 1000
    let done = false

    while (!done) {
      const { data, error } = await supabaseClient
        .from("manual_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + batchSize - 1)

      if (error) {
        console.error(error)
        break
      }

      if (data && data.length > 0) {
        allOrders = [...allOrders, ...data]
        from += batchSize

        if (data.length < batchSize) {
          done = true
        }
      } else {
        done = true
      }
    }

    setOrders(allOrders)
    setLoading(false)
  }

  fetchOrders()
}, [])

  const analytics = useMemo(() => {
    const now = dayjs()
    const currentCutoff = now.subtract(daysFilter, "day")
    const prevCutoff = currentCutoff.subtract(daysFilter, "day")

    // Filtered Data
    const currentPeriod = orders.filter(o => 
      dayjs(o.created_at).isAfter(currentCutoff) && 
      (selectedAccount === "All" || o.postex_account === selectedAccount)
    )
    
    const prevPeriod = orders.filter(o => 
      dayjs(o.created_at).isBetween(prevCutoff, currentCutoff, 'day', '[]') && 
      (selectedAccount === "All" || o.postex_account === selectedAccount)
    )

    const chartMap: any = {}
    const statusMap: any = {}
    const bookerMap: any = {}

    currentPeriod.forEach(o => {
      let label = dayjs(o.created_at).format(groupBy === "daily" ? "DD MMM" : groupBy === "weekly" ? "WW" : "MMM YYYY")
      if (!chartMap[label]) {
        chartMap[label] = { label, dispatched: 0, delivered: 0, revDelivered: 0, revTotal: 0, time: dayjs(o.created_at).unix() }
      }
      
      const isDelivered = o.delivery_date !== null && o.delivery_date !== undefined
      
      chartMap[label].dispatched++
      
      if (isDelivered) {
        chartMap[label].delivered++
        chartMap[label].revDelivered += Number(o.invoice_payment || 0)
      }
      chartMap[label].revTotal += Number(o.invoice_payment || 0)

      const status = o.transaction_status || "Pending"
      statusMap[status] = (statusMap[status] || 0) + 1

      const booker = o.reference_id || "Direct"
      if (!bookerMap[booker]) bookerMap[booker] = { name: booker, deliveredCount: 0, reward: 0 }
      if (isDelivered) {
        bookerMap[booker].deliveredCount++
        bookerMap[booker].reward += 50 
      }
    })

    const graphData = Object.values(chartMap).sort((a: any, b: any) => a.time - b.time)
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    const bookerData = Object.values(bookerMap).sort((a: any, b: any) => b.reward - a.reward)

    const curDelivered = currentPeriod.filter(o => o.delivery_date).length
    const oldDelivered = prevPeriod.filter(o => o.delivery_date).length
    const growth = oldDelivered ? (((curDelivered - oldDelivered) / oldDelivered) * 100).toFixed(1) : "100"

    return {
      graphData,
      statusData,
      bookerData,
      stats: {
        total: currentPeriod.length,
        delivered: curDelivered,
        revenue: currentPeriod.reduce((a, b) => a + Number(b.invoice_payment || 0), 0),
        delRevenue: currentPeriod.filter(o => o.delivery_date).reduce((a, b) => a + Number(b.invoice_payment || 0), 0),
        growth
      },
      accounts: Array.from(new Set(orders.map(o => o.postex_account))).filter(Boolean)
    }
  }, [orders, daysFilter, groupBy, selectedAccount])

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-orange-500">Syncing PostEx Data...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 mx-0 md:mx-auto">
      {/* Filters Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">POSTEX DASHBOARD</h1>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400">REAL-TIME PERFORMANCE TRACKING</p>
        </div>

        <button
          onClick={async () => {
            if (!confirm("Sync orders with PostEx?")) return
            const res = await fetch("/api/postex/sync-orders", { method: "POST" })
            const data = await res.json()
            alert(data.success ? "✅ " + data.message : "❌ " + data.error)
          }}
          className="h-10 md:h-12 bg-orange-400 text-white font-bold rounded-xl hover:bg-orange-600 transition mb-4 md:mb-0 px-3 md:px-4"
        >
          SYNC ORDERS
        </button>

        <div className="flex flex-wrap gap-2 md:gap-4 items-center">
          <select onChange={(e) => setSelectedAccount(e.target.value)} className="bg-slate-100 px-3 py-2 rounded-xl font-bold text-xs md:text-sm outline-none focus:ring-2 ring-orange-200">
              <option value="All">All Accounts</option>
              {analytics.accounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
          </select>

          {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDaysFilter(d)} className={`px-3 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${daysFilter === d ? 'bg-orange-400 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 hover:bg-slate-200'}`}>{d}D</button>
          ))}

          <div className="h-6 md:h-8 w-[1px] bg-slate-200 mx-1 md:mx-2" />

          {["daily", "weekly", "monthly"].map(g => (
              <button key={g} onClick={() => setGroupBy(g as any)} className={`px-3 py-2 rounded-xl font-bold text-xs md:text-sm uppercase transition-all ${groupBy === g ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>{g}</button>
          ))}
        </div>
      </div>

      {/* 1. KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-8">
        <Stat title="Total Orders" value={analytics.stats.total} />
        <Stat title="Delivered" value={analytics.stats.delivered} />
        <Stat title="Total Rev" value={`₨${analytics.stats.revenue.toLocaleString()}`} />
        <Stat title="Delivered Rev" value={`₨${analytics.stats.delRevenue.toLocaleString()}`} />
        <Stat title="Growth (vs Prev)" value={`${analytics.stats.growth}%`} highlight />
      </div>

      {/* 2. Dispatched vs Delivered Line Chart & Pie Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Order Volume: Dispatched vs Delivered">
              <LineChart data={analytics.graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Line type="monotone" dataKey="dispatched" stroke="#000" strokeWidth={2} name="Dispatched" dot={{ r: 3, fill: '#000' }} />
                  <Line type="monotone" dataKey="delivered" stroke="#FB923C" strokeWidth={2} name="Delivered" dot={{ r: 3, fill: '#FB923C' }} />
              </LineChart>
          </ChartCard>
        </div>

        <ChartCard title="Delivery Success Ratio">
          <PieChart>
            <Pie data={[
                {name: 'Delivered', value: analytics.stats.delivered}, 
                {name: 'Not Delivered', value: analytics.stats.total - analytics.stats.delivered}
            ]} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                <Cell fill="#FB923C" stroke="none" />
                <Cell fill="#f1f5f9" stroke="none" />
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" iconType="circle" />
          </PieChart>
        </ChartCard>
      </div>

      {/* 3. Revenue Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <ChartCard title="Total Projected Revenue (All Orders)">
            <LineChart data={analytics.graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" fontSize={9} />
                <YAxis fontSize={9} />
                <Tooltip />
                <Line type="step" dataKey="revTotal" stroke="#000" strokeWidth={2} dot={false} />
            </LineChart>
        </ChartCard>
        <ChartCard title="Actual Realized Revenue (Delivered Only)">
            <LineChart data={analytics.graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" fontSize={9} />
                <YAxis fontSize={9} />
                <Tooltip />
                <Line type="step" dataKey="revDelivered" stroke="#FB923C" strokeWidth={2} dot={false} />
            </LineChart>
        </ChartCard>
      </div>

      {/* 4. Booker Rewards & Transaction Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-w-0">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h3 className="font-black text-[9px] md:text-xs uppercase tracking-widest text-slate-400">Booker Reward Table (₨50/Delivery)</h3>
                <span className="bg-orange-100 text-orange-600 text-[8px] md:text-[10px] px-2 py-1 rounded-md font-black">TOP PERFORMERS</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[300px]">
                    <thead>
                        <tr className="text-[8px] md:text-[10px] uppercase text-slate-400 border-b border-slate-50">
                            <th className="pb-2">Booker Reference</th>
                            <th className="pb-2 text-center">Deliveries</th>
                            <th className="pb-2 text-right">Payout Reward</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {analytics.bookerData.map((b: any) => (
                            <tr key={b.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-2 md:py-4 font-bold text-slate-700">{b.name}</td>
                                <td className="py-2 md:py-4 text-center font-black">{b.deliveredCount}</td>
                                <td className="py-2 md:py-4 text-right font-black text-orange-500 underline decoration-orange-200 underline-offset-2">₨{b.reward.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <ChartCard title="Transaction Status Distribution">
            <BarChart data={analytics.statusData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={8} width={80} tick={{fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#fff7ed'}} />
                <Bar dataKey="value" fill="#000" radius={[0, 10, 10, 0]} barSize={16} />
            </BarChart>
        </ChartCard>
      </div>
    </div>
  )
}

/* ================= Styled Components ================= */
function Stat({ title, value, highlight = false }: any) {
  return (
    <div className={`p-4 md:p-6 rounded-3xl shadow-sm border transition-all hover:scale-[1.02] ${highlight ? 'border-orange-400 bg-orange-400 text-white' : 'bg-white border-slate-100'}`}>
      <p className={`text-[9px] md:text-[10px] font-black uppercase mb-1 tracking-widest ${highlight ? 'text-orange-100' : 'text-slate-400'}`}>{title}</p>
      <h3 className="text-xl md:text-2xl font-black">{value}</h3>
    </div>
  )
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-w-0">
      <h3 className="font-black mb-4 md:mb-8 text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400">{title}</h3>
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
