"use client"

import { useState } from "react"

export default function AdminDashboard() {
  const [name, setName] = useState("")
  const [role, setRole] = useState("worker")
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const res = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, mobile, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.error)
      setLoading(false)
      return
    }

    setMessage("User created successfully ✅")
    setName("")
    setMobile("")
    setPassword("")
    setRole("worker")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-6">
          Create User
        </h1>

        {message && (
          <div className="mb-4 text-sm text-blue-600">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="User Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="worker">Worker</option>
            <option value="salesman">Salesman</option>
          </select>

          <input
            type="text"
            placeholder="Mobile Number (Login Username)"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg"
          >
            {loading ? "Creating..." : "Create User"}
          </button>

        </form>
      </div>
    </div>
  )
}