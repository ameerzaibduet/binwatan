import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"

/**
 * Verify Wapio webhook signature.
 *
 * Wapio sends:
 * X-Webhook-Signature
 *
 * The signature is an HMAC SHA-256 hash generated
 * using the webhook signing secret.
 */
function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.WAPIO_WEBHOOK_SECRET

  if (!secret) {
    console.error(
      "[WAPIO WEBHOOK] WAPIO_WEBHOOK_SECRET is missing"
    )

    return false
  }

  if (!signature) {
    console.error(
      "[WAPIO WEBHOOK] X-Webhook-Signature header is missing"
    )

    return false
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  /**
   * Wapio documentation indicates the signature may be
   * represented with additional formatting/prefixing.
   *
   * We therefore accept:
   *
   *   expectedSignature
   *
   * or a signature containing the expected hash.
   */
  const valid =
    signature === expectedSignature ||
    signature.includes(expectedSignature)

  if (!valid) {
    console.error(
      "[WAPIO WEBHOOK] Invalid webhook signature"
    )

    console.error(
      "[WAPIO WEBHOOK] Received signature prefix:",
      signature.substring(0, 20)
    )

    console.error(
      "[WAPIO WEBHOOK] Expected signature prefix:",
      expectedSignature.substring(0, 20)
    )
  }

  return valid
}

/**
 * Safely extract an incoming WhatsApp message.
 */
function extractIncomingMessage(payload: any) {
  const message = payload?.data?.messages

  if (!message) {
    return null
  }

  const key = message?.key

  return {
    id: message?.id || key?.id || null,

    messageBody:
      typeof message?.messageBody === "string"
        ? message.messageBody
        : "",

    messageTimestamp:
      message?.messageTimestamp || null,

    pushName:
      typeof message?.pushName === "string"
        ? message.pushName
        : "",

    remoteJid:
      typeof message?.remoteJid === "string"
        ? message.remoteJid
        : key?.remoteJid || null,

    senderPn:
      typeof key?.senderPn === "string"
        ? key.senderPn
        : null,

    cleanedSenderPn:
      typeof key?.cleanedSenderPn === "string"
        ? key.cleanedSenderPn
        : null,

    senderLid:
      typeof key?.senderLid === "string"
        ? key.senderLid
        : null,

    fromMe: key?.fromMe === true,
  }
}

export async function POST(request: Request) {
  const receivedAt = new Date().toISOString()

  try {
    /**
     * IMPORTANT:
     *
     * Read the raw request body before parsing JSON.
     * The webhook signature is calculated from the payload.
     */
    const rawBody = await request.text()

    const signature =
      request.headers.get("x-webhook-signature")

    console.log(
      "=================================================="
    )

    console.log(
      "[WAPIO WEBHOOK] Incoming webhook:",
      receivedAt
    )

    console.log(
      "[WAPIO WEBHOOK] Signature present:",
      Boolean(signature)
    )

    /**
     * --------------------------------------------------
     * SIGNATURE VERIFICATION
     * --------------------------------------------------
     */
    const isValidSignature = verifySignature(
      rawBody,
      signature
    )

    if (!isValidSignature) {
      console.error(
        "[WAPIO WEBHOOK] Request rejected: invalid signature"
      )

      console.log(
        "=================================================="
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

    console.log(
      "[WAPIO WEBHOOK] Signature verified successfully"
    )

    /**
     * --------------------------------------------------
     * PARSE PAYLOAD
     * --------------------------------------------------
     */
    let payload: any

    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error(
        "[WAPIO WEBHOOK] Invalid JSON payload:",
        error
      )

      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON payload",
        },
        {
          status: 400,
        }
      )
    }

    const event = payload?.event || "unknown"
    const sessionId = payload?.sessionId || null

    console.log(
      "[WAPIO WEBHOOK] Event:",
      event
    )

    console.log(
      "[WAPIO WEBHOOK] Session:",
      sessionId
    )

    /**
     * --------------------------------------------------
     * INCOMING MESSAGE EVENTS
     * --------------------------------------------------
     */
    if (
      event === "messages.received" ||
      event === "personal.message.received"
    ) {
      const message = extractIncomingMessage(payload)

      /**
       * No message object.
       */
      if (!message) {
        console.warn(
          "[WAPIO WEBHOOK] Message event received but no message data found"
        )

        return NextResponse.json(
          {
            success: true,
            received: true,
            processed: false,
            reason: "No message data",
          },
          {
            status: 200,
          }
        )
      }

      /**
       * ------------------------------------------------
       * PROTECT AGAINST OUR OWN OUTGOING MESSAGES
       * ------------------------------------------------
       *
       * Wapio includes:
       *
       * data.messages.key.fromMe
       *
       * true = message was sent by our WhatsApp account
       * false = message came from the customer
       *
       * We MUST NOT process our own outgoing messages.
       */
      if (message.fromMe) {
        console.log(
          "[WAPIO WEBHOOK] Ignoring outgoing message from our own account"
        )

        console.log(
          "[WAPIO WEBHOOK] Message ID:",
          message.id
        )

        console.log(
          "[WAPIO WEBHOOK] Message:",
          message.messageBody
        )

        console.log(
          "=================================================="
        )

        return NextResponse.json(
          {
            success: true,
            received: true,
            processed: false,
            reason: "Outgoing message ignored",
          },
          {
            status: 200,
          }
        )
      }

      /**
       * ------------------------------------------------
       * PROTECT AGAINST GROUP MESSAGES
       * ------------------------------------------------
       */
      if (
        message.remoteJid &&
        message.remoteJid.endsWith("@g.us")
      ) {
        console.log(
          "[WAPIO WEBHOOK] Ignoring group message"
        )

        console.log(
          "[WAPIO WEBHOOK] Group JID:",
          message.remoteJid
        )

        console.log(
          "=================================================="
        )

        return NextResponse.json(
          {
            success: true,
            received: true,
            processed: false,
            reason: "Group message ignored",
          },
          {
            status: 200,
          }
        )
      }

      /**
       * ------------------------------------------------
       * CUSTOMER MESSAGE
       * ------------------------------------------------
       */
      console.log(
        "[WAPIO WEBHOOK] CUSTOMER MESSAGE"
      )

      console.log(
        "[WAPIO WEBHOOK] Message ID:",
        message.id
      )

      console.log(
        "[WAPIO WEBHOOK] Customer:",
        message.pushName || "Unknown"
      )

      console.log(
        "[WAPIO WEBHOOK] Phone:",
        message.cleanedSenderPn ||
          message.senderPn ||
          "Unknown"
      )

      console.log(
        "[WAPIO WEBHOOK] Remote JID:",
        message.remoteJid || "Unknown"
      )

      console.log(
        "[WAPIO WEBHOOK] Message:",
        message.messageBody || "[non-text message]"
      )

      console.log(
        "[WAPIO WEBHOOK] From me:",
        message.fromMe
      )

      /**
       * ------------------------------------------------
       * THIS IS WHERE WE WILL ADD AUTOMATION
       * ------------------------------------------------
       *
       * Examples:
       *
       * 1. Customer clicks Confirm Order
       * 2. Customer clicks Cancel Order
       * 3. Customer asks for product pictures
       * 4. Customer asks for price
       * 5. Customer sends an address
       *
       * For now we ONLY log the message.
       */

      console.log(
        "[WAPIO WEBHOOK] Customer message received successfully"
      )

      console.log(
        "=================================================="
      )

      return NextResponse.json(
        {
          success: true,
          received: true,
          processed: true,
          event,
          message: {
            id: message.id,
            phone:
              message.cleanedSenderPn ||
              message.senderPn ||
              null,
            pushName: message.pushName,
            remoteJid: message.remoteJid,
            messageBody: message.messageBody,
          },
        },
        {
          status: 200,
        }
      )
    }

    /**
     * --------------------------------------------------
     * OUTGOING MESSAGE EVENTS
     * --------------------------------------------------
     */
    if (
      event === "messages.sent" ||
      event === "messages.update" ||
      event === "message-receipt.update" ||
      event === "messages.receipt.update"
    ) {
      console.log(
        "[WAPIO WEBHOOK] Outgoing/status event"
      )

      console.log(
        "[WAPIO WEBHOOK] Data:",
        JSON.stringify(
          payload?.data,
          null,
          2
        )
      )

      console.log(
        "=================================================="
      )

      return NextResponse.json(
        {
          success: true,
          received: true,
          processed: false,
          reason: "Status event received",
        },
        {
          status: 200,
        }
      )
    }

    /**
     * --------------------------------------------------
     * SESSION EVENTS
     * --------------------------------------------------
     */
    if (
      event === "session.status" ||
      event === "qr.updated"
    ) {
      console.log(
        "[WAPIO WEBHOOK] Session lifecycle event:",
        event
      )

      console.log(
        "[WAPIO WEBHOOK] Data:",
        JSON.stringify(
          payload?.data,
          null,
          2
        )
      )

      console.log(
        "=================================================="
      )

      return NextResponse.json(
        {
          success: true,
          received: true,
          processed: false,
          reason: "Session event received",
        },
        {
          status: 200,
        }
      )
    }

    /**
     * --------------------------------------------------
     * OTHER EVENTS
     * --------------------------------------------------
     */
    console.log(
      "[WAPIO WEBHOOK] Unhandled event:",
      event
    )

    console.log(
      "[WAPIO WEBHOOK] Payload:",
      JSON.stringify(
        payload,
        null,
        2
      )
    )

    console.log(
      "=================================================="
    )

    /**
     * Always acknowledge valid Wapio events.
     */
    return NextResponse.json(
      {
        success: true,
        received: true,
        processed: false,
        reason: "Event acknowledged",
        event,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      "[WAPIO WEBHOOK] Fatal error:",
      error
    )

    /**
     * We return 500 here because something actually
     * failed while processing the request.
     *
     * Wapio may retry this event.
     */
    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      {
        status: 500,
      }
    )
  }
}