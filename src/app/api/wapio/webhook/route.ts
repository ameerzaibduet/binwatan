import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * =========================================================
 * BIN WATAN - WAPIO WEBHOOK
 * =========================================================
 *
 * File:
 * app/api/wapio/webhook/route.ts
 *
 * Required environment variable:
 *
 * WAPIO_WEBHOOK_SECRET=your_actual_webhook_secret
 *
 * Wapio signature:
 *
 * X-Webhook-Signature:
 * t=timestamp,v1=signature
 *
 * Wapio documentation verifies HMAC-SHA256
 * against the JSON request body.
 * =========================================================
 */


/**
 * Extract v1 signature from:
 *
 * t=1789163013,v1=6576b9d63...
 */
function extractV1Signature(
  signatureHeader: string
): string {
  const parts = signatureHeader.split(",")

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

    if (key === "v1") {
      return value
    }
  }

  return ""
}


/**
 * Verify Wapio webhook signature.
 *
 * IMPORTANT:
 * The raw request body is used.
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
     * Wapio current header format:
     *
     * t=1789163013,v1=abcdef...
     */
    const receivedSignature =
      extractV1Signature(signatureHeader)

    if (!receivedSignature) {
      console.error(
        "Wapio webhook: v1 signature missing"
      )

      return false
    }

    /**
     * IMPORTANT:
     *
     * Wapio documentation specifies:
     *
     * HMAC-SHA256(secret, rawBody)
     */
    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(rawBody)
        .digest("hex")

    /**
     * Timing-safe comparison.
     */
    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      )

    const receivedBuffer =
      Buffer.from(
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
 * POST /api/wapio/webhook
 * =========================================================
 */
export async function POST(
  request: Request
) {
  try {
    /**
     * -------------------------------------------------------
     * 1. READ RAW BODY
     * -------------------------------------------------------
     *
     * MUST happen before JSON parsing.
     */
    const rawBody =
      await request.text()

    /**
     * -------------------------------------------------------
     * 2. READ SIGNATURE
     * -------------------------------------------------------
     */
    const signatureHeader =
      request.headers.get(
        "x-webhook-signature"
      ) || ""

    /**
     * -------------------------------------------------------
     * 3. WEBHOOK SECRET
     * -------------------------------------------------------
     */
    const webhookSecret =
      process.env.WAPIO_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error(
        "Wapio webhook error: WAPIO_WEBHOOK_SECRET is missing"
      )

      return NextResponse.json(
        {
          success: false,
          error:
            "WAPIO_WEBHOOK_SECRET is missing",
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
        webhookSecret
      )

    if (!validSignature) {
      console.error(
        "Wapio webhook: INVALID SIGNATURE"
      )

      console.error(
        "Signature prefix:",
        signatureHeader.substring(
          0,
          30
        ) + "..."
      )

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid webhook signature",
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
      payload =
        JSON.parse(rawBody)
    } catch {
      console.error(
        "Wapio webhook: Invalid JSON"
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
      "======================================"
    )
    console.log(
      "       WAPIO WEBHOOK RECEIVED"
    )
    console.log(
      "======================================"
    )
    console.log(
      "Event:",
      event
    )
    console.log(
      "Event ID:",
      eventId
    )
    console.log(
      "Delivery ID:",
      deliveryId
    )
    console.log(
      "Attempt:",
      `${attempt}/${totalAttempts}`
    )
    console.log(
      "======================================"
    )

    /**
     * =======================================================
     * INCOMING CUSTOMER MESSAGES
     * =======================================================
     */
    if (
      event === "messages.received" ||
      event ===
        "personal.message.received" ||
      event === "messages.upsert"
    ) {
      const messages =
        payload?.data?.messages

      /**
       * Wapio can provide a message
       * as an object or array.
       */
      const messageList =
        Array.isArray(messages)
          ? messages
          : messages
            ? [messages]
            : []

      console.log(
        "Incoming messages:",
        messageList.length
      )

      for (
        const message
        of messageList
      ) {
        try {
          const key =
            message?.key || {}

          /**
           * Ignore our own outgoing messages.
           */
          const fromMe =
            Boolean(
              key?.fromMe
            )

          if (fromMe) {
            console.log(
              "Ignoring outgoing message"
            )

            continue
          }

          /**
           * WhatsApp remote JID.
           */
          const remoteJid =
            key?.remoteJid ||
            message?.remoteJid ||
            ""

          /**
           * Ignore WhatsApp groups.
           */
          if (
            typeof remoteJid ===
              "string" &&
            remoteJid.endsWith(
              "@g.us"
            )
          ) {
            console.log(
              "Ignoring group message:",
              remoteJid
            )

            continue
          }

          /**
           * Phone number, if Wapio provides it.
           */
          const senderPn =
            key?.senderPn ||
            message?.senderPn ||
            ""

          const cleanedPhone =
            senderPn
              ? String(
                  senderPn
                ).replace(
                  /\D/g,
                  ""
                )
              : ""

          /**
           * LID.
           */
          const senderLid =
            key?.senderLid ||
            message?.senderLid ||
            ""

          /**
           * Message ID.
           */
          const messageId =
            key?.id ||
            message?.id ||
            ""

          /**
           * Extract text from common
           * WhatsApp message formats.
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
            cleanedPhone
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
           * FUTURE AUTOMATION
           * =================================================
           *
           * CONFIRM
           * CANCEL
           * NEED HELP
           *
           * We will connect this to
           * Supabase/order handling next.
           */

        } catch (
          messageError
        ) {
          /**
           * One malformed message
           * must not crash the webhook.
           */
          console.error(
            "Error processing message:",
            messageError
          )
        }
      }

      /**
       * Wapio requires a quick 200 response.
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
     * Example:
     *
     * message-receipt.update
     *
     * data:
     * {
     *   key: {
     *     fromMe: false,
     *     id: "...",
     *     remoteJid: "...@lid"
     *   },
     *   messageTimestamp: 1789162034,
     *   status: 4
     * }
     */
    if (
      event ===
        "message-receipt.update" ||
      event ===
        "messages.receipt.update" ||
      event ===
        "messages.update" ||
      event ===
        "messages.sent"
    ) {
      const data =
        payload?.data || {}

      const key =
        data?.key || {}

      console.log("")
      console.log(
        "----- MESSAGE STATUS -----"
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
        "--------------------------"
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
     * SESSION STATUS
     * =======================================================
     */
    if (
      event ===
      "session.status"
    ) {
      console.log(
        "Wapio session status:",
        payload?.data ||
          payload
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
     * OTHER VALID WAPIO EVENTS
     * =======================================================
     *
     * We acknowledge them with 200 so Wapio
     * doesn't retry unnecessarily.
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
    console.error(
      "Wapio webhook fatal error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Internal webhook error",
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
 * Browser test:
 *
 * https://binwatan.com/api/wapio/webhook
 *
 * Should return 200.
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