import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * =========================================================
 * WAPIO WEBHOOK
 * =========================================================
 *
 * Environment variable required:
 *
 * WAPIO_WEBHOOK_SECRET=your_webhook_secret
 *
 * This endpoint:
 * - Verifies Wapio HMAC signature
 * - Handles incoming WhatsApp messages
 * - Handles message receipts/status
 * - Handles session status
 * - Handles QR updates
 * - Ignores messages sent by our own account
 * - Ignores WhatsApp groups
 *
 * IMPORTANT:
 * The raw request body MUST be used for signature verification.
 * =========================================================
 */

function verifyWapioSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    if (!signatureHeader || !secret) {
      return false
    }

    /**
     * Wapio signature format:
     *
     * t=1789162034,v1=d94324...
     */

    const parts = signatureHeader.split(",")

    let timestamp = ""
    let receivedSignature = ""

    for (const part of parts) {
      const separatorIndex = part.indexOf("=")

      if (separatorIndex === -1) {
        continue
      }

      const key = part
        .slice(0, separatorIndex)
        .trim()

      const value = part
        .slice(separatorIndex + 1)
        .trim()

      if (key === "t") {
        timestamp = value
      }

      if (key === "v1") {
        receivedSignature = value
      }
    }

    if (!timestamp || !receivedSignature) {
      console.error(
        "Wapio webhook: signature missing timestamp or v1"
      )

      return false
    }

    /**
     * Wapio signs:
     *
     * timestamp + "." + rawBody
     */
    const signedPayload = `${timestamp}.${rawBody}`

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex")

    /**
     * Prevent timing attacks.
     */
    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    )

    const receivedBuffer = Buffer.from(
      receivedSignature,
      "utf8"
    )

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    )
  } catch (error) {
    console.error(
      "Wapio signature verification error:",
      error
    )

    return false
  }
}

/**
 * =========================================================
 * POST
 * =========================================================
 */
export async function POST(request: Request) {
  try {
    /**
     * -------------------------------------------------------
     * 1. READ RAW BODY
     * -------------------------------------------------------
     *
     * DO NOT use request.json() before signature verification.
     */
    const rawBody = await request.text()

    /**
     * -------------------------------------------------------
     * 2. GET WAPIO SIGNATURE
     * -------------------------------------------------------
     */
    const signatureHeader =
      request.headers.get(
        "x-webhook-signature"
      ) || ""

    /**
     * -------------------------------------------------------
     * 3. GET WEBHOOK SECRET
     * -------------------------------------------------------
     */
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
        {
          status: 500,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * 4. VERIFY SIGNATURE
     * -------------------------------------------------------
     */
    const validSignature =
      verifyWapioSignature(
        rawBody,
        signatureHeader,
        secret
      )

    if (!validSignature) {
      console.error(
        "Wapio webhook: INVALID SIGNATURE"
      )

      /**
       * Don't expose the complete signature.
       */
      console.error(
        "Signature prefix:",
        signatureHeader.substring(0, 25) + "..."
      )

      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook signature",
        },
        {
          status: 401,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * 5. PARSE JSON
     * -------------------------------------------------------
     */
    let payload: any

    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error(
        "Wapio webhook: invalid JSON"
      )

      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON",
        },
        {
          status: 400,
        }
      )
    }

    /**
     * -------------------------------------------------------
     * 6. EVENT INFORMATION
     * -------------------------------------------------------
     */
    const event =
      payload?.event ||
      request.headers.get(
        "x-webhook-event"
      ) ||
      ""

    const deliveryId =
      request.headers.get(
        "x-webhook-delivery-id"
      ) || ""

    const eventId =
      request.headers.get(
        "x-webhook-event-id"
      ) || ""

    const attempt =
      request.headers.get(
        "x-webhook-attempt"
      ) || ""

    const totalAttempts =
      request.headers.get(
        "x-webhook-total-attempts"
      ) || ""

    console.log("")
    console.log(
      "=========================================="
    )
    console.log(
      "       WAPIO WEBHOOK RECEIVED"
    )
    console.log(
      "=========================================="
    )
    console.log("Event:", event)
    console.log("Event ID:", eventId)
    console.log("Delivery ID:", deliveryId)
    console.log(
      "Attempt:",
      `${attempt}/${totalAttempts}`
    )
    console.log(
      "=========================================="
    )

    /**
     * =======================================================
     * INCOMING MESSAGES
     * =======================================================
     *
     * These are the events we care about for:
     *
     * - Customer messages
     * - Order confirmation
     * - Cancel order
     * - Need help
     * - Product questions
     * - Catalogue requests
     */
    if (
      event === "messages.received" ||
      event === "personal.message.received" ||
      event === "messages.upsert"
    ) {
      const messages =
        payload?.data?.messages

      /**
       * Wapio may provide:
       *
       * data.messages
       *
       * as an object or array.
       */
      const messageList = Array.isArray(
        messages
      )
        ? messages
        : messages
          ? [messages]
          : []

      console.log(
        "Incoming message count:",
        messageList.length
      )

      for (const message of messageList) {
        try {
          const key =
            message?.key || {}

          /**
           * ---------------------------------------------------
           * FROM ME
           * ---------------------------------------------------
           *
           * Ignore messages sent by our own WhatsApp.
           *
           * This prevents:
           *
           * our message
           * -> webhook
           * -> automation
           * -> another message
           * -> webhook
           * -> loop
           */
          const fromMe =
            Boolean(key?.fromMe)

          if (fromMe) {
            console.log(
              "Ignoring outgoing message from our own account"
            )

            continue
          }

          /**
           * ---------------------------------------------------
           * REMOTE JID
           * ---------------------------------------------------
           */
          const remoteJid =
            key?.remoteJid ||
            message?.remoteJid ||
            ""

          /**
           * ---------------------------------------------------
           * GROUP MESSAGE
           * ---------------------------------------------------
           */
          if (
            typeof remoteJid === "string" &&
            remoteJid.endsWith("@g.us")
          ) {
            console.log(
              "Ignoring WhatsApp group message:",
              remoteJid
            )

            continue
          }

          /**
           * ---------------------------------------------------
           * PHONE NUMBER
           * ---------------------------------------------------
           *
           * IMPORTANT:
           *
           * Wapio/WhatsApp can provide @lid instead of a
           * normal phone JID.
           *
           * Therefore DON'T assume:
           *
           * remoteJid = phone number
           *
           * We check senderPn first.
           */
          const senderPn =
            key?.senderPn ||
            message?.senderPn ||
            ""

          const cleanedSenderPn =
            senderPn
              ? String(senderPn).replace(
                  /\D/g,
                  ""
                )
              : ""

          /**
           * LID
           */
          const senderLid =
            key?.senderLid ||
            message?.senderLid ||
            ""

          /**
           * ---------------------------------------------------
           * MESSAGE TEXT
           * ---------------------------------------------------
           */
          const messageText =
            message?.message
              ?.conversation ||
            message?.message
              ?.extendedTextMessage
              ?.text ||
            message?.message
              ?.imageMessage
              ?.caption ||
            message?.message
              ?.videoMessage
              ?.caption ||
            message?.text ||
            ""

          /**
           * ---------------------------------------------------
           * MESSAGE ID
           * ---------------------------------------------------
           */
          const messageId =
            key?.id ||
            message?.id ||
            ""

          /**
           * ---------------------------------------------------
           * LOG
           * ---------------------------------------------------
           */
          console.log("")
          console.log(
            "----- CUSTOMER MESSAGE -----"
          )
          console.log(
            "Message ID:",
            messageId
          )
          console.log(
            "Remote JID:",
            remoteJid
          )
          console.log(
            "Phone:",
            cleanedSenderPn
          )
          console.log(
            "LID:",
            senderLid
          )
          console.log(
            "Message:",
            messageText
          )
          console.log(
            "-----------------------------"
          )

          /**
           * =================================================
           * FUTURE ORDER AUTOMATION
           * =================================================
           *
           * Here we can later add:
           *
           * CONFIRM ORDER
           * CANCEL ORDER
           * NEED HELP
           *
           * Example:
           *
           * const normalizedText =
           *   String(messageText)
           *     .trim()
           *     .toLowerCase()
           *
           * if (
           *   normalizedText === "confirm"
           * ) {
           *   // Update order confirmation
           * }
           *
           * if (
           *   normalizedText === "cancel"
           * ) {
           *   // Cancel order
           * }
           *
           * if (
           *   normalizedText === "need help"
           * ) {
           *   // Notify team
           * }
           */

        } catch (messageError) {
          /**
           * Don't let one malformed message cause
           * the entire Wapio webhook to fail.
           */
          console.error(
            "Error processing individual message:",
            messageError
          )
        }
      }

      /**
       * IMPORTANT:
       * Return 200 quickly.
       */
      return NextResponse.json(
        {
          success: true,
          received: true,
          event,
        },
        {
          status: 200,
        }
      )
    }

    /**
     * =======================================================
     * MESSAGE RECEIPT / STATUS
     * =======================================================
     *
     * Example payload you received:
     *
     * {
     *   "event": "message-receipt.update",
     *   "data": {
     *     "key": {
     *       "fromMe": false,
     *       "id": "...",
     *       "remoteJid": "...@lid"
     *     },
     *     "messageTimestamp": 1789162034,
     *     "status": 4
     *   }
     * }
     */
    if (
      event ===
        "message-receipt.update" ||
      event ===
        "messages.receipt.update" ||
      event === "messages.update" ||
      event === "messages.sent"
    ) {
      const data =
        payload?.data || {}

      const key =
        data?.key || {}

      console.log("")
      console.log(
        "----- WAPIO MESSAGE STATUS -----"
      )
      console.log(
        "Message ID:",
        key?.id || ""
      )
      console.log(
        "Remote JID:",
        key?.remoteJid || ""
      )
      console.log(
        "From Me:",
        key?.fromMe ?? ""
      )
      console.log(
        "Status:",
        data?.status ?? ""
      )
      console.log(
        "--------------------------------"
      )

      /**
       * We don't need to do anything else here.
       */
      return NextResponse.json(
        {
          success: true,
          received: true,
          event,
        },
        {
          status: 200,
        }
      )
    }

    /**
     * =======================================================
     * SESSION STATUS
     * =======================================================
     */
    if (
      event === "session.status"
    ) {
      console.log(
        "Wapio session status:",
        payload?.data || payload
      )

      return NextResponse.json(
        {
          success: true,
          received: true,
          event,
        },
        {
          status: 200,
        }
      )
    }

    /**
     * =======================================================
     * QR UPDATED
     * =======================================================
     */
    if (
      event === "qr.updated"
    ) {
      console.log(
        "Wapio QR updated"
      )

      return NextResponse.json(
        {
          success: true,
          received: true,
          event,
        },
        {
          status: 200,
        }
      )
    }

    /**
     * =======================================================
     * UNKNOWN EVENT
     * =======================================================
     *
     * If Wapio sends another valid signed event,
     * acknowledge it instead of returning an error.
     *
     * This prevents unnecessary retries/dead-lettering.
     */
    console.log(
      "Unhandled Wapio event:",
      event
    )

    return NextResponse.json(
      {
        success: true,
        received: true,
        event,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    /**
     * -------------------------------------------------------
     * FATAL ERROR
     * -------------------------------------------------------
     */
    console.error(
      "Wapio webhook fatal error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error: "Internal webhook error",
      },
      {
        status: 500,
      }
    )
  }
}

/**
 * =========================================================
 * GET
 * =========================================================
 *
 * Useful for quickly checking whether the endpoint exists.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message:
        "Bin Watan Wapio webhook is active",
    },
    {
      status: 200,
    }
  )
}