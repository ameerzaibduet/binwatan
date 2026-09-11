
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { to, text, idempotencyKey } = body

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient phone number is required" },
        { status: 400 }
      )
    }

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Message text is required" },
        { status: 400 }
      )
    }

    const sessionKey = process.env.WAPIO_SESSION_KEY

    if (!sessionKey) {
      console.error("WAPIO_SESSION_KEY is missing")

      return NextResponse.json(
        { success: false, error: "Wapio is not configured" },
        { status: 500 }
      )
    }

    // Wapio expects the phone number in international format
    // without +, spaces or dashes.
    const normalizedPhone = String(to)
      .replace(/\D/g, "")
      .replace(/^00/, "")

    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient phone number" },
        { status: 400 }
      )
    }

    const requestId =
      idempotencyKey ||
      `binwatan_${Date.now()}_${normalizedPhone}`

    const response = await fetch(
      "https://api.wapio.io/api/send-message",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": requestId,
        },
        body: JSON.stringify({
          to: normalizedPhone,
          text,
        }),
      }
    )

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      console.error("Wapio API error:", {
        status: response.status,
        result,
      })

      return NextResponse.json(
        {
          success: false,
          error: result?.message || "Wapio failed to send message",
          wapio: result,
        },
        { status: response.status }
      )
    }

    console.log("Wapio message accepted:", result)

    return NextResponse.json({
      success: true,
      data: result?.data || result,
    })
  } catch (error) {
    console.error("Wapio send-message error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send WhatsApp message",
      },
      { status: 500 }
    )
  }
}

