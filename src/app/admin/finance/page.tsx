"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/utils/supabase/client"

type Received = {
  id: string
  name: string
  amount: number
  details: string
  created_at: string
}

type Expense = {
  id: string
  reason: string
  amount: number
  details: string
  created_at: string
}

type Sale = {
  id: string
  name: string
  amount: number
  details: string
  paid: boolean
  created_at: string
}

export default function FinancePage() {
  const [received, setReceived] = useState<Received[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sales, setSales] = useState<Sale[]>([])

  const [loading, setLoading] = useState(false)

  const [receivedName, setReceivedName] = useState("")
  const [receivedAmount, setReceivedAmount] = useState("")
  const [receivedDetails, setReceivedDetails] = useState("")

  const [expenseReason, setExpenseReason] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseDetails, setExpenseDetails] = useState("")

  const [saleName, setSaleName] = useState("")
  const [saleAmount, setSaleAmount] = useState("")
  const [saleDetails, setSaleDetails] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const { data: r } = await supabaseClient.from("finance_received").select("*")
    const { data: e } = await supabaseClient.from("finance_expenses").select("*")
    const { data: s } = await supabaseClient.from("finance_sales").select("*")

    setReceived(r || [])
    setExpenses(e || [])
    setSales(s || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddReceived = async () => {
    await supabaseClient.from("finance_received").insert({
      name: receivedName,
      amount: parseFloat(receivedAmount),
      details: receivedDetails
    })
    setReceivedName("")
    setReceivedAmount("")
    setReceivedDetails("")
    fetchData()
  }

  const handleAddExpense = async () => {
    await supabaseClient.from("finance_expenses").insert({
      reason: expenseReason,
      amount: parseFloat(expenseAmount),
      details: expenseDetails
    })
    setExpenseReason("")
    setExpenseAmount("")
    setExpenseDetails("")
    fetchData()
  }

  const handleAddSale = async () => {
    await supabaseClient.from("finance_sales").insert({
      name: saleName,
      amount: parseFloat(saleAmount),
      details: saleDetails,
      paid: false
    })
    setSaleName("")
    setSaleAmount("")
    setSaleDetails("")
    fetchData()
  }

  const handleMarkPaid = async (id: string) => {
    await supabaseClient.from("finance_sales").update({ paid: true }).eq("id", id)
    fetchData()
  }

  const handleDeleteSale = async (id: string) => {
    await supabaseClient.from("finance_sales").delete().eq("id", id)
    fetchData()
  }

  const totalReceived = received.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalSales = sales.reduce((sum, s) => sum + Number(s.amount), 0)
  const totalPaidSales = sales.filter(s => s.paid).reduce((sum, s) => sum + Number(s.amount), 0)
  const net = totalReceived - totalExpenses

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-3xl font-bold">Finance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-xl font-semibold">Total Received</h2>
          <p className="text-2xl font-bold">Rs {totalReceived.toLocaleString()}</p>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <h2 className="text-xl font-semibold">Total Expenses</h2>
          <p className="text-2xl font-bold">Rs {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-xl font-semibold">Net Amount</h2>
          <p className="text-2xl font-bold">Rs {net.toLocaleString()}</p>
        </div>
      </div>

      {/* Received Form */}
      <div className="border p-4 rounded space-y-4">
        <h2 className="text-xl font-bold">Add Received Amount</h2>
        <Input placeholder="Name" value={receivedName} onChange={(e) => setReceivedName(e.target.value)} />
        <Input placeholder="Amount" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} />
        <Input placeholder="Details" value={receivedDetails} onChange={(e) => setReceivedDetails(e.target.value)} />
        <Button onClick={handleAddReceived}>Add Received</Button>
      </div>

      {/* Expense Form */}
      <div className="border p-4 rounded space-y-4">
        <h2 className="text-xl font-bold">Add Expense</h2>
        <Input placeholder="Reason" value={expenseReason} onChange={(e) => setExpenseReason(e.target.value)} />
        <Input placeholder="Amount" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
        <Input placeholder="Details" value={expenseDetails} onChange={(e) => setExpenseDetails(e.target.value)} />
        <Button onClick={handleAddExpense}>Add Expense</Button>
      </div>

      {/* Sales Form */}
      <div className="border p-4 rounded space-y-4">
        <h2 className="text-xl font-bold">Add Sale</h2>
        <Input placeholder="Name" value={saleName} onChange={(e) => setSaleName(e.target.value)} />
        <Input placeholder="Amount" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} />
        <Input placeholder="Details" value={saleDetails} onChange={(e) => setSaleDetails(e.target.value)} />
        <Button onClick={handleAddSale}>Add Sale</Button>
      </div>

      {/* Sales Table */}
      <div>
        <h2 className="text-2xl font-semibold">Sales</h2>
        <table className="w-full table-auto border mt-2">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Paid</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="text-center">
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{s.amount}</td>
                <td className="p-2 border">{s.paid ? "Yes" : "No"}</td>
                <td className="p-2 border">{format(new Date(s.created_at), "dd-MM-yyyy")}</td>
                <td className="p-2 border space-x-2">
                  {!s.paid && (
                    <Button onClick={() => handleMarkPaid(s.id)} size="sm">Mark Paid</Button>
                  )}
                  <Button variant="destructive" onClick={() => handleDeleteSale(s.id)} size="sm">Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
