"use client"

import { useState } from "react"

export default function WapioTestPage() {
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("Hello from Bin Watan 👋")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendMessage = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/wapio/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phone,
          text: message,
        }),
      })

      const data = await response.json()

      setResult({
        status: response.status,
        ...data,
      })
    } catch (error) {
      setResult({
        success: false,
        error: "Could not connect to your API",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900">
            Wapio WhatsApp Test
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Send a test WhatsApp message through Wapio.
          </p>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              WhatsApp Number
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="923001234567"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <p className="mt-1 text-xs text-gray-500">
              Use international format without +, spaces or dashes.
              Example: 923001234567
            </p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Message
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={loading || !phone || !message}
            className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send WhatsApp Message"}
          </button>

          {result && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-800">
                API Response
              </h2>

              <pre className="overflow-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}