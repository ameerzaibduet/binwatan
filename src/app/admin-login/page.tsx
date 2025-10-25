// app/admin/login/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminLoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem("isAdmin") === "true") {
      router.replace("/admin")
    }
  }, [])

  const handleLogin = () => {
    if (password === "admin123") {
      localStorage.setItem("isAdmin", "true")
      router.push("/admin")
    } else {
      setError("Incorrect password")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded p-6 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <Input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError("")
          }}
        />
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        <Button className="w-full mt-4" onClick={handleLogin}>
          Login
        </Button>
      </div>
    </div>
  )
}
