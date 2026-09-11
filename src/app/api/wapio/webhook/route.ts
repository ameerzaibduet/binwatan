import { NextResponse } from "next/server"
import crypto from "crypto"

function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.WAPIO_WEBHOOK_SECRET

  if (!secret || !signature) {
    return false
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  // Wapio documentation shows signatures may contain the expected hash.
  return signature === expected || signature.includes(expected)
}

export async function POST(request: Request) {
  try {
    // IMPORTANT:
    // Read the raw body first because the signature is calculated
    // from the raw JSON payload.
    const rawBody = await request.text()

    const signature = request.headers.get("x-webhook-signature")

    // Verify that the request came from Wapio
    if (!verifySignature(rawBody, signature)) {
      console.error("Wapio webhook: invalid signature")

      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const payload = JSON.parse(rawBody)

    console.log("=================================")
    console.log("WAPIO WEBHOOK RECEIVED")
    console.log("Event:", payload.event)
    console.log("Payload:", JSON.stringify(payload, null, 2))
    console.log("=================================")

    /*
     * We will add the actual order-confirmation logic here
     * after we inspect Wapio's real button/message payload.
     */

    switch (payload.event) {
      case "messages.received":
      case "personal.message.received":
        console.log(
          "Incoming WhatsApp message:",
          payload.data?.messages
        )
        break

      case "messages.upsert":
        console.log(
          "Message upsert:",
          payload.data?.messages
        )
        break

      case "message-receipt.update":
      case "messages.receipt.update":
        console.log(
          "Message receipt update:",
          payload.data
        )
        break

      default:
        console.log(
          "Unhandled Wapio event:",
          payload.event
        )
    }

    // Wapio requires a quick 200 response
    return NextResponse.json(
      { received: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Wapio webhook error:", error)

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}