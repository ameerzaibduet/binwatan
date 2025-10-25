import { Suspense } from "react"
import SearchClient from "./SearchClient"

export default function SearchPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Search Results</h1>
      <Suspense fallback={<div>Loading search results...</div>}>
        <SearchClient />
      </Suspense>
    </div>
  )
}
