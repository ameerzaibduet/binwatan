"use client"

import { useSearchParams } from "next/navigation"

export default function SearchClient() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q")

  if (!query) {
    return <p>Please enter a search query.</p>
  }

  return (
    <div>
      <p className="text-lg">You searched for: <strong>{query}</strong></p>
    </div>
  )
}
