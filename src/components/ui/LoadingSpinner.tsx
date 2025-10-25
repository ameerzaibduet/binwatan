import { Loader2 } from "lucide-react"

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-white animate-fade-in">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-700 text-sm font-medium">{message}</p>
    </div>
  )
}
