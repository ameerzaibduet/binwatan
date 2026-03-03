"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/utils/supabase/client"

export default function SalesDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabaseClient.auth.getUser()

      if (!data.user) {
        router.push("/login")
        return
      }

      const role = data.user.user_metadata?.role

      if (role !== "salesman") {
        router.push("/unauthorized")
        return
      }

      setUser(data.user)
    }

    checkUser()
  }, [router])

  if (!user) return <div>Loading...</div>

  return (
    <div>
      <h1>Sales Dashboard</h1>
      <p>Welcome {user.email}</p>
    </div>
  )
}