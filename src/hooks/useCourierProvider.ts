"use client"

import { useEffect, useState } from "react"
import type { CourierProvider } from "@/lib/courier/types"

const STORAGE_KEY = "courierProvider"

export function useCourierProvider() {
  const [provider, setProviderState] = useState<CourierProvider>("postex")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CourierProvider | null
    if (saved === "postex" || saved === "nextstep") {
      setProviderState(saved)
    }
    setReady(true)
  }, [])

  const setProvider = (next: CourierProvider) => {
    setProviderState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { provider, setProvider, ready }
}
