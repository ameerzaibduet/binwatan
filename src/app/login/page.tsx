"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const router = useRouter()

  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const fakeEmail = `${mobile}@company.com`

    const { error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    const { data } = await supabaseClient.auth.getUser()
    const role = data?.user?.user_metadata?.role

    if (role === "worker") {
      router.push("/worker/dashboard")
    } else if (role === "salesman") {
      router.push("/sales/dashboard")
    } else {
      setError("Access not allowed")
      await supabaseClient.auth.signOut()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">

        {/* Left Branding Side */}
        <div className="hidden md:flex flex-col justify-center items-center bg-black text-white p-12">
          <h1 className="text-4xl font-bold text-orange-400">BIN WATAN</h1>
          <p className="mt-4 text-center text-gray-300 max-w-xs">
            Secure access for workers and sales team. Manage your dashboard with ease.
          </p>
        </div>

        {/* Right Login Side */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-black mb-6">
            Login
          </h2>

          {error && (
            <div className="bg-orange-100 text-orange-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-orange-400 hover:text-black transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}