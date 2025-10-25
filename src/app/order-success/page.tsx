"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center px-4">
      <CheckCircle size={64} className="text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Thank you for your order!</h1>
      <p className="text-gray-600 mb-6">
        Your order has been placed successfully. You will receive a confirmation soon.
      </p>
      <Link href="/">
        <Button>Continue Shopping</Button>
      </Link>
    </div>
  )
}
