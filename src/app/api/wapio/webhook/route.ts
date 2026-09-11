// app/api/wapio/webhook/route.ts

import { NextResponse } from "next/server"
import crypto from "crypto"

function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.WAPIO_WEBHOOK_SECRET

  if (!secret || !signature) {
    console.error("Wapio webhook: missing secret or signature")
    return false
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  return (
    signature === expected ||
    signature.includes(expected)
  )
}

export async function POST(request: Request) {
  try {
    // Read raw body first.
    // Wapio calculates the signature from the raw request body.
    const rawBody = await request.text()

    const signature = request.headers.get(
      "x-webhook-signature"
    )

    console.log("Wapio webhook request received")
    console.log("Signature present:", !!signature)
    console.log(
      "Webhook secret present:",
      !!process.env.WAPIO_WEBHOOK_SECRET
    )

    // Verify Wapio signature
    if (!verifySignature(rawBody, signature)) {
      console.error(
        "Wapio webhook: INVALID SIGNATURE"
      )

      return NextResponse.json(
        {
          received: false,
          error: "Invalid signature",
        },
        { status: 401 }
      )
    }

    let payload: any

    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error(
        "Wapio webhook: invalid JSON",
        error
      )

      return NextResponse.json(
        {
          received: false,
          error: "Invalid JSON",
        },
        { status: 400 }
      )
    }

    console.log("=================================")
    console.log("WAPIO WEBHOOK RECEIVED")
    console.log("Event:", payload?.event)
    console.log(
      "Payload:",
      JSON.stringify(payload, null, 2)
    )
    console.log("=================================")

    /*
     * IMPORTANT:
     *
     * We are only inspecting incoming events for now.
     *
     * Once we confirm the exact payload Wapio sends when
     * a customer clicks a WhatsApp button, we will add:
     *
     * Confirm Order
     *       ↓
     * Supabase transaction_status = confirmed
     *
     * Cancel Order
     *       ↓
     * Supabase transaction_status = cancelled
     *
     * Do NOT add button logic until we have the real payload.
     */

    switch (payload?.event) {
      case "messages.received": {
        console.log(
          "Incoming WhatsApp message:",
          payload?.data?.messages
        )

        break
      }

      case "personal.message.received": {
        console.log(
          "Incoming personal WhatsApp message:",
          payload?.data?.messages
        )

        break
      }

      case "messages.upsert": {
        console.log(
          "WhatsApp message upsert:",
          payload?.data?.messages
        )

        break
      }

      case "message-receipt.update":
      case "messages.receipt.update": {
        console.log(
          "WhatsApp message receipt update:",
          payload?.data
        )

        break
      }

      default: {
        console.log(
          "Unhandled Wapio event:",
          payload?.event
        )

        break
      }
    }

    // Always return HTTP 200 after successful verification.
    return NextResponse.json(
      {
        received: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      "Wapio webhook processing error:",
      error
    )

    return NextResponse.json(
      {
        received: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    )
  }
}