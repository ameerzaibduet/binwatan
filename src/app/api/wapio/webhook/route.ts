import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SIGNATURE_TOLERANCE_SECONDS = 300

function verifyWapioWebhookSignature(
  secret: string,
  signatureHeader: string | null,
  rawBody: Buffer
): boolean {
  if (!signatureHeader || !secret) {
    return false
  }

  // Wapio format:
  // t=1789162034,v1=d94324ccde79...
  const timestampMatch = signatureHeader.match(
    /(?:^|,)t=(\d+)(?:,|$)/
  )

  const signatureMatch = signatureHeader.match(
    /(?:^|,)v1=([a-f0-9]+)(?:,|$)/
  )

  const timestamp = Number(timestampMatch?.[1])
  const receivedSignature = signatureMatch?.[1]

  if (
    !receivedSignature ||
    !Number.isFinite(timestamp)
  ) {
    return false
  }

  // Prevent replay attacks.
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (
    Math.abs(nowSeconds - timestamp) >
    SIGNATURE_TOLERANCE_SECONDS
  ) {
    console.error(
      "Wapio webhook: signature timestamp expired",
      {
        timestamp,
        nowSeconds,
        difference: Math.abs(nowSeconds - timestamp),
      }
    )

    return false
  }

  /*
   * IMPORTANT:
   *
   * Wapio signs:
   *
   * timestamp + "." + EXACT RAW BODY
   *
   * We therefore MUST NOT JSON.parse() and stringify the body
   * before verification.
   */
  const signedPayload = Buffer.concat([
    Buffer.from(`${timestamp}.`, "utf8"),
    rawBody,
  ])

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex")

  const receivedBuffer = Buffer.from(
    receivedSignature,
    "utf8"
  )

  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  )

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  )
}

export async function POST(request: Request) {
  try {
    /*
     * IMPORTANT:
     * Read the body as ARRAY BUFFER first.
     *
     * This preserves the exact bytes Wapio signed.
     */
    const rawBody = Buffer.from(
      await request.arrayBuffer()
    )

    const signatureHeader =
      request.headers.get("x-webhook-signature")

    const secret =
      process.env.WAPIO_WEBHOOK_SECRET

    if (!secret) {
      console.error(
        "Wapio webhook error: WAPIO_WEBHOOK_SECRET is missing"
      )

      return NextResponse.json(
        {
          success: false,
          error: "Webhook secret is not configured",
        },
        { status: 500 }
      )
    }

    /*
     * Verify Wapio signature BEFORE parsing JSON.
     */
    const valid = verifyWapioWebhookSignature(
      secret,
      signatureHeader,
      rawBody
    )

    if (!valid) {
      console.error(
        "Wapio webhook: INVALID SIGNATURE"
      )

      console.error(
        "Signature prefix:",
        signatureHeader
          ? signatureHeader.substring(0, 80)
          : "missing"
      )

      return NextResponse.json(
        {
          success: false,
          error: "Invalid signature",
        },
        { status: 401 }
      )
    }

    /*
     * Signature is valid.
     * Now and ONLY now parse the JSON.
     */
    const bodyText = rawBody.toString("utf8")

    let body: any

    try {
      body = JSON.parse(bodyText)
    } catch (error) {
      console.error(
        "Wapio webhook: invalid JSON"
      )

      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON",
        },
        { status: 400 }
      )
    }

    const event = body?.event

    console.log(
      "Wapio webhook: VALID SIGNATURE",
      {
        event,
        sessionId: body?.sessionId,
        deliveryId:
          request.headers.get(
            "x-webhook-delivery-id"
          ),
        eventId:
          request.headers.get(
            "x-webhook-event-id"
          ),
        attempt:
          request.headers.get(
            "x-webhook-attempt"
          ),
      }
    )

    /*
     * ----------------------------------------------------
     * INCOMING WHATSAPP MESSAGE
     * ----------------------------------------------------
     */
    if (
      event === "messages.received" ||
      event === "personal.message.received" ||
      event === "messages.upsert"
    ) {
      const data = body?.data

      const key = data?.key

      /*
       * Ignore messages sent by our own WhatsApp account.
       */
      if (key?.fromMe) {
        console.log(
          "Wapio webhook: ignoring own message"
        )

        return NextResponse.json({
          success: true,
          ignored: true,
          reason: "fromMe",
        })
      }

      const remoteJid =
        key?.remoteJid || ""

      /*
       * Ignore WhatsApp groups.
       */
      if (remoteJid.endsWith("@g.us")) {
        console.log(
          "Wapio webhook: ignoring group message"
        )

        return NextResponse.json({
          success: true,
          ignored: true,
          reason: "group",
        })
      }

      /*
       * Wapio/WhatsApp can provide senderPn.
       *
       * remoteJid can sometimes be @lid rather than
       * an actual phone number.
       */
      const senderPn =
        data?.senderPn ||
        data?.senderPN ||
        data?.participantPn ||
        null

      const senderLid =
        remoteJid.endsWith("@lid")
          ? remoteJid
          : null

      const messageId =
        key?.id || null

      /*
       * Try to extract text from common WhatsApp
       * message formats.
       */
      const message =
        data?.message || {}

      const text =
        message?.conversation ||
        message?.extendedTextMessage?.text ||
        message?.imageMessage?.caption ||
        message?.videoMessage?.caption ||
        message?.text ||
        ""

      console.log(
        "Wapio incoming message:",
        {
          senderPn,
          senderLid,
          messageId,
          text,
        }
      )

      /*
       * ------------------------------------------------
       * TODO:
       *
       * Here we will later process:
       *
       * CONFIRM
       * CANCEL
       * NEED HELP
       *
       * and update the Supabase order.
       * ------------------------------------------------
       */
    }

    /*
     * ----------------------------------------------------
     * MESSAGE RECEIPTS / STATUS
     * ----------------------------------------------------
     */
    if (
      event === "message-receipt.update" ||
      event === "messages.receipt.update" ||
      event === "messages.update" ||
      event === "messages.sent"
    ) {
      console.log(
        "Wapio message status event:",
        event
      )

      return NextResponse.json({
        success: true,
        event,
      })
    }

    /*
     * ----------------------------------------------------
     * SESSION EVENTS
     * ----------------------------------------------------
     */
    if (
      event === "session.status" ||
      event === "qr.updated"
    ) {
      console.log(
        "Wapio session event:",
        event
      )

      return NextResponse.json({
        success: true,
        event,
      })
    }

    /*
     * ----------------------------------------------------
     * UNKNOWN EVENT
     * ----------------------------------------------------
     *
     * We still return 200 so Wapio doesn't repeatedly
     * retry an event we don't currently process.
     */
    console.log(
      "Wapio webhook: event received:",
      event
    )

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error(
      "Wapio webhook fatal error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      "Bin Watan Wapio webhook is active",
  })
}