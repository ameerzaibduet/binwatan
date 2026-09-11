
import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"

/**
 * ============================================================
 * WAPIO WEBHOOK
 * ============================================================
 *
 * Handles:
 * - messages.received
 * - personal.message.received
 * - messages.sent
 * - messages.update
 * - message-receipt.update
 * - session.status
 * - qr.updated
 * - unknown/future events
 *
 * Security:
 * - Reads the RAW request body
 * - Verifies X-Webhook-Signature using HMAC SHA-256
 * - Uses timingSafeEqual for comparison
 *
 * Message protection:
 * - Ignores our own messages (fromMe === true)
 * - Ignores WhatsApp groups (@g.us)
 *
 * Future:
 * - Confirm Order
 * - Cancel Order
 * - Need Help
 * - Supabase order updates
 * ============================================================
 */


/**
 * ------------------------------------------------------------
 * SIGNATURE VERIFICATION
 * ------------------------------------------------------------
 *
 * Wapio signs the RAW webhook request body using:
 *
 * HMAC-SHA256
 *
 * Secret:
 * WAPIO_WEBHOOK_SECRET
 *
 * Header:
 * X-Webhook-Signature
 *
 * IMPORTANT:
 * Do NOT JSON.parse() the body before calculating
 * the signature.
 */
function verifyWapioSignature(
  rawBody: string,
  receivedSignature: string | null
): boolean {
  const secret = process.env.WAPIO_WEBHOOK_SECRET

  if (!secret) {
    console.error(
      "[WAPIO WEBHOOK] ERROR: WAPIO_WEBHOOK_SECRET is missing"
    )

    return false
  }

  if (!receivedSignature) {
    console.error(
      "[WAPIO WEBHOOK] ERROR: X-Webhook-Signature header is missing"
    )

    return false
  }

  /**
   * Calculate expected HMAC.
   */
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")

  /**
   * Wapio's signature is expected to be the SHA-256
   * HMAC value.
   *
   * We also safely handle a possible:
   *
   * sha256=<hash>
   *
   * format if the provider includes that prefix.
   */
  const normalizedSignature =
    receivedSignature.trim().replace(/^sha256=/i, "")

  /**
   * Log only prefixes.
   *
   * NEVER log the complete signature or secret.
   */
  console.log(
    "[WAPIO WEBHOOK] Received signature prefix:",
    normalizedSignature.substring(0, 16)
  )

  console.log(
    "[WAPIO WEBHOOK] Expected signature prefix:",
    expectedSignature.substring(0, 16)
  )

  /**
   * HMAC SHA-256 hex digest must be 64 characters.
   *
   * timingSafeEqual throws when Buffer lengths differ,
   * so check length first.
   */
  if (
    normalizedSignature.length !==
    expectedSignature.length
  ) {
    console.error(
      "[WAPIO WEBHOOK] Invalid signature length"
    )

    return false
  }

  try {
    const receivedBuffer = Buffer.from(
      normalizedSignature,
      "utf8"
    )

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    )

    const valid = crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    )

    if (!valid) {
      console.error(
        "[WAPIO WEBHOOK] Invalid webhook signature"
      )
    }

    return valid
  } catch (error) {
    console.error(
      "[WAPIO WEBHOOK] Signature comparison failed:",
      error
    )

    return false
  }
}


/**
 * ------------------------------------------------------------
 * MESSAGE EXTRACTION
 * ------------------------------------------------------------
 *
 * Wapio message events use:
 *
 * payload.data.messages
 *
 * and the message key contains:
 *
 * key.fromMe
 * key.remoteJid
 *
 * We keep this function flexible because different
 * message types may not contain exactly the same fields.
 */
function extractIncomingMessage(payload: any) {
  const message = payload?.data?.messages

  if (!message) {
    return null
  }

  const key = message?.key || {}

  return {
    id:
      message?.id ||
      key?.id ||
      null,

    messageBody:
      typeof message?.messageBody === "string"
        ? message.messageBody
        : typeof message?.message?.conversation === "string"
        ? message.message.conversation
        : "",

    messageTimestamp:
      message?.messageTimestamp ||
      message?.messageTimestampMs ||
      null,

    pushName:
      typeof message?.pushName === "string"
        ? message.pushName
        : "",

    remoteJid:
      typeof message?.remoteJid === "string"
        ? message.remoteJid
        : typeof key?.remoteJid === "string"
        ? key.remoteJid
        : null,

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

    /**
     * IMPORTANT:
     *
     * true  = message was sent by our WhatsApp account
     * false = message came from customer
     */
    fromMe:
      key?.fromMe === true,
  }
}


/**
 * ------------------------------------------------------------
 * POST
 * ------------------------------------------------------------
 */
export async function POST(request: Request) {
  const receivedAt = new Date().toISOString()

  console.log(
    "=================================================="
  )

  console.log(
    "[WAPIO WEBHOOK] Incoming webhook:",
    receivedAt
  )

  try {
    /**
     * --------------------------------------------------------
     * 1. READ RAW BODY
     * --------------------------------------------------------
     *
     * MUST happen before JSON.parse().
     *
     * The HMAC signature is calculated against the exact
     * raw request body.
     */
    const rawBody = await request.text()

    /**
     * --------------------------------------------------------
     * 2. READ SIGNATURE
     * --------------------------------------------------------
     */
    const signature =
      request.headers.get("x-webhook-signature")

    console.log(
      "[WAPIO WEBHOOK] Signature present:",
      Boolean(signature)
    )

    /**
     * --------------------------------------------------------
     * 3. VERIFY SIGNATURE
     * --------------------------------------------------------
     */
    const validSignature =
      verifyWapioSignature(
        rawBody,
        signature
      )

    /**
     * NEVER process an unsigned/invalid webhook.
     */
    if (!validSignature) {
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
     * --------------------------------------------------------
     * 4. PARSE JSON
     * --------------------------------------------------------
     */
    let payload: any

    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      console.error(
        "[WAPIO WEBHOOK] Invalid JSON payload:",
        error
      )

      console.log(
        "=================================================="
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

    /**
     * --------------------------------------------------------
     * 5. GET EVENT INFORMATION
     * --------------------------------------------------------
     */
    const event =
      typeof payload?.event === "string"
        ? payload.event
        : "unknown"

    const sessionId =
      payload?.sessionId ||
      payload?.session_id ||
      null

    console.log(
      "[WAPIO WEBHOOK] Event:",
      event
    )

    console.log(
      "[WAPIO WEBHOOK] Session:",
      sessionId
    )


    /**
     * ========================================================
     * INCOMING CUSTOMER MESSAGES
     * ========================================================
     */
    if (
      event === "messages.received" ||
      event === "personal.message.received"
    ) {
      const message =
        extractIncomingMessage(payload)

      /**
       * ------------------------------------------------------
       * No message object
       * ------------------------------------------------------
       */
      if (!message) {
        console.warn(
          "[WAPIO WEBHOOK] Message event received but no message data found"
        )

        console.log(
          "=================================================="
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
       * ------------------------------------------------------
       * IGNORE OUR OWN OUTGOING MESSAGES
       * ------------------------------------------------------
       *
       * This is extremely important.
       *
       * Without this protection:
       *
       * Website → Wapio → WhatsApp
       *                 ↓
       *              webhook
       *                 ↓
       * Website → Wapio → WhatsApp
       *
       * could create a reply loop.
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
       * ------------------------------------------------------
       * IGNORE GROUP MESSAGES
       * ------------------------------------------------------
       *
       * WhatsApp group JIDs end with:
       *
       * @g.us
       */
      if (
        typeof message.remoteJid === "string" &&
        message.remoteJid.endsWith("@g.us")
      ) {
        console.log(
          "[WAPIO WEBHOOK] Ignoring WhatsApp group message"
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
       * ======================================================
       * CUSTOMER MESSAGE
       * ======================================================
       */
      const customerPhone =
        message.cleanedSenderPn ||
        message.senderPn ||
        null

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
        customerPhone || "Unknown"
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
       * ======================================================
       * FUTURE BIN WATAN AUTOMATION
       * ======================================================
       *
       * This is where we will later handle:
       *
       * Confirm Order
       * Cancel Order
       * Need Help
       * Customer replies
       * Address corrections
       * Product picture requests
       *
       * Example future logic:
       *
       * if (message.messageBody === "CONFIRM_ORDER") {
       *   // Find order
       *   // Update order_status = "confirmed"
       * }
       *
       * if (message.messageBody === "CANCEL_ORDER") {
       *   // Find order
       *   // Update order_status = "cancelled"
       * }
       *
       * IMPORTANT:
       * Do not put heavy processing here yet.
       *
       * First make sure Wapio webhook delivery is reliable.
       */


      console.log(
        "[WAPIO WEBHOOK] Customer message received successfully"
      )

      console.log(
        "=================================================="
      )

      /**
       * Wapio should receive a 200 quickly.
       */
      return NextResponse.json(
        {
          success: true,
          received: true,
          processed: true,
          event,
          message: {
            id: message.id,
            phone: customerPhone,
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
     * ========================================================
     * OUTGOING / MESSAGE STATUS EVENTS
     * ========================================================
     */
    if (
      event === "messages.sent" ||
      event === "messages.update" ||
      event === "message-receipt.update" ||
      event === "messages.receipt.update"
    ) {
      console.log(
        "[WAPIO WEBHOOK] Message/status event received:",
        event
      )

      /**
       * Do NOT dump secrets/signatures.
       *
       * Payload data is okay for debugging, but keep logs
       * reasonable in production.
       */
      console.log(
        "[WAPIO WEBHOOK] Data:",
        JSON.stringify(
          payload?.data ?? {},
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
          reason: "Message status event received",
          event,
        },
        {
          status: 200,
        }
      )
    }


    /**
     * ========================================================
     * SESSION EVENTS
     * ========================================================
     */
    if (
      event === "session.status" ||
      event === "qr.updated"
    ) {
      console.log(
        "[WAPIO WEBHOOK] Session event:",
        event
      )

      console.log(
        "[WAPIO WEBHOOK] Data:",
        JSON.stringify(
          payload?.data ?? {},
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
          event,
        },
        {
          status: 200,
        }
      )
    }


    /**
     * ========================================================
     * UNKNOWN / FUTURE EVENT
     * ========================================================
     *
     * If Wapio adds a new event, we still acknowledge it
     * rather than causing unnecessary webhook retries.
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
    /**
     * ========================================================
     * FATAL ERROR
     * ========================================================
     *
     * A real server-side failure occurred.
     *
     * Returning 500 allows Wapio to retry according to its
     * webhook delivery behaviour.
     */
    console.error(
      "[WAPIO WEBHOOK] Fatal error:",
      error
    )

    console.log(
      "=================================================="
    )

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

