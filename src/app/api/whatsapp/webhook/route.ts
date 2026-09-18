
import { NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const APP_SECRET = process.env.WHATSAPP_APP_SECRET

/**
 * Verify Meta webhook signature
 *
 * Meta sends:
 * x-hub-signature-256: sha256=...
 *
 * Signature is calculated using:
 * HMAC-SHA256(raw request body, APP_SECRET)
 */
function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!APP_SECRET || !signature) {
    console.error("❌ Missing APP_SECRET or signature")
    return false
  }

  if (!signature.startsWith("sha256=")) {
    console.error("❌ Invalid signature format")
    return false
  }

  const receivedSignature = signature.slice("sha256=".length)

  const expectedSignature = crypto
    .createHmac("sha256", APP_SECRET)
    .update(rawBody)
    .digest("hex")

  try {
    const receivedBuffer = Buffer.from(
      receivedSignature,
      "hex"
    )

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "hex"
    )

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return false
    }

    return crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    )
  } catch (error) {
    console.error(
      "❌ Signature comparison error:",
      error
    )

    return false
  }
}

/**
 * GET
 *
 * Meta WhatsApp webhook verification
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const mode = searchParams.get("hub.mode")
    const token = searchParams.get(
      "hub.verify_token"
    )
    const challenge = searchParams.get(
      "hub.challenge"
    )

    console.log("🔐 Meta webhook verification request")
    console.log("Mode:", mode)

    if (
      mode === "subscribe" &&
      token &&
      VERIFY_TOKEN &&
      token === VERIFY_TOKEN &&
      challenge
    ) {
      console.log(
        "✅ Meta WhatsApp webhook verified"
      )

      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }

    console.error(
      "❌ Meta webhook verification failed"
    )

    return new Response("Forbidden", {
      status: 403,
    })
  } catch (error) {
    console.error(
      "❌ Webhook GET error:",
      error
    )

    return new Response(
      "Internal Server Error",
      {
        status: 500,
      }
    )
  }
}

/**
 * POST
 *
 * Incoming WhatsApp messages
 * and message status updates.
 */
export async function POST(request: Request) {
  try {
    /**
     * IMPORTANT:
     *
     * Read the raw body BEFORE JSON.parse().
     *
     * Meta calculates the webhook signature
     * using the exact raw request body.
     */
    const rawBody = await request.text()

    /**
     * Meta signature header
     */
    const signature = request.headers.get(
      "x-hub-signature-256"
    )

    console.log(
      "📨 Meta webhook POST received"
    )

    /**
     * Verify webhook signature
     */
    if (!verifySignature(rawBody, signature)) {
      console.error(
        "❌ Invalid Meta webhook signature"
      )

      return new Response("Forbidden", {
        status: 403,
      })
    }

    console.log(
      "✅ Meta webhook signature verified"
    )

    /**
     * Parse JSON
     */
    let body: any

    try {
      body = JSON.parse(rawBody)
    } catch (error) {
      console.error(
        "❌ Invalid JSON received:",
        error
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
     * Log complete webhook
     */
    console.log(
      "📩 WhatsApp webhook received:"
    )

    console.log(
      JSON.stringify(body, null, 2)
    )

    /**
     * Only process WhatsApp Business
     * Account webhooks.
     */
    if (
      body?.object !==
      "whatsapp_business_account"
    ) {
      console.log(
        "ℹ️ Ignoring non-WhatsApp webhook"
      )

      return NextResponse.json(
        {
          success: true,
        },
        {
          status: 200,
        }
      )
    }

    /**
     * Get entries
     */
    const entries = body?.entry

    if (!Array.isArray(entries)) {
      console.log(
        "ℹ️ No webhook entries found"
      )

      return NextResponse.json(
        {
          success: true,
        },
        {
          status: 200,
        }
      )
    }

    /**
     * Process each entry
     */
    for (const entry of entries) {
      const changes = entry?.changes

      if (!Array.isArray(changes)) {
        continue
      }

      /**
       * Process each change
       */
      for (const change of changes) {
        const value = change?.value

        if (!value) {
          continue
        }

        /**
         * ==================================================
         * WABA INFORMATION
         * ==================================================
         */

        const phoneNumberId =
          value?.metadata?.phone_number_id

        const displayPhoneNumber =
          value?.metadata?.display_phone_number

        const businessPhoneNumberId =
          value?.metadata?.display_phone_number

        console.log(
          "📞 Phone Number ID:",
          phoneNumberId
        )

        console.log(
          "📞 Display Number:",
          displayPhoneNumber
        )

        /**
         * ==================================================
         * INCOMING MESSAGES
         * ==================================================
         */

        const messages = value?.messages

        if (Array.isArray(messages)) {
          for (const message of messages) {
            const from = message?.from
            const messageId = message?.id
            const messageType = message?.type
            const timestamp =
              message?.timestamp

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )

            console.log(
              "📱 Incoming WhatsApp message"
            )

            console.log(
              "From:",
              from
            )

            console.log(
              "Message ID:",
              messageId
            )

            console.log(
              "Type:",
              messageType
            )

            console.log(
              "Timestamp:",
              timestamp
            )

            /**
             * ==================================================
             * TEXT MESSAGE
             * ==================================================
             */

            if (messageType === "text") {
              const text =
                message?.text?.body ?? ""

              console.log(
                "💬 Customer text:",
                text
              )

              /**
               * Later we can process:
               *
               * - Customer replies
               * - Order lookup
               * - Help requests
               * - Address confirmation
               */
            }

            /**
             * ==================================================
             * INTERACTIVE MESSAGE
             * ==================================================
             */

            if (
              messageType ===
              "interactive"
            ) {
              const interactive =
                message?.interactive

              console.log(
                "🔘 Interactive type:",
                interactive?.type
              )

              /**
               * ==================================================
               * BUTTON REPLY
               * ==================================================
               *
               * Current template has:
               *
               * Confirm
               * Cancel
               *
               * IMPORTANT:
               *
               * We log the actual button ID that Meta sends.
               *
               * Do NOT assume that the visible Urdu/English
               * title is the same thing as the button ID.
               */

              if (
                interactive?.type ===
                "button_reply"
              ) {
                const buttonId =
                  interactive
                    ?.button_reply
                    ?.id

                const buttonTitle =
                  interactive
                    ?.button_reply
                    ?.title

                console.log(
                  "🔘 Button ID:",
                  buttonId
                )

                console.log(
                  "🔘 Button title:",
                  buttonTitle
                )

                /**
                 * IMPORTANT:
                 *
                 * These IDs are placeholders until
                 * we receive the real Meta webhook.
                 *
                 * After clicking the actual buttons,
                 * check the server logs.
                 */

                switch (buttonId) {
                  case "confirm_order":
                    console.log(
                      "✅ Customer confirmed order"
                    )

                    /**
                     * Later:
                     *
                     * Update Supabase:
                     *
                     * order_status = "confirmed"
                     *
                     * We first need to associate
                     * the WhatsApp number with
                     * the correct order.
                     */

                    break

                  case "cancel_order":
                    console.log(
                      "❌ Customer cancelled order"
                    )

                    /**
                     * Later:
                     *
                     * Update Supabase:
                     *
                     * order_status = "cancelled"
                     *
                     * We first need to associate
                     * the WhatsApp number with
                     * the correct order.
                     */

                    break

                  default:
                    console.log(
                      "ℹ️ Unknown button:",
                      buttonId
                    )
                }
              }

              /**
               * ==================================================
               * LIST REPLY
               * ==================================================
               *
               * Kept for future use.
               */

              if (
                interactive?.type ===
                "list_reply"
              ) {
                const listReply =
                  interactive?.list_reply

                console.log(
                  "📋 List reply ID:",
                  listReply?.id
                )

                console.log(
                  "📋 List reply title:",
                  listReply?.title
                )

                console.log(
                  "📋 List reply description:",
                  listReply?.description
                )
              }
            }

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )
          }
        }

        /**
         * ==================================================
         * MESSAGE STATUS UPDATES
         * ==================================================
         */

        const statuses = value?.statuses

        if (Array.isArray(statuses)) {
          for (const status of statuses) {
            const messageId = status?.id

            const statusValue =
              status?.status

            const recipientId =
              status?.recipient_id

            const timestamp =
              status?.timestamp

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )

            console.log(
              "📊 WhatsApp message status"
            )

            console.log(
              "Message ID:",
              messageId
            )

            console.log(
              "Status:",
              statusValue
            )

            console.log(
              "Recipient:",
              recipientId
            )

            console.log(
              "Timestamp:",
              timestamp
            )

            /**
             * SENT
             */
            if (
              statusValue === "sent"
            ) {
              console.log(
                "📤 Message sent"
              )
            }

            /**
             * DELIVERED
             */
            if (
              statusValue ===
              "delivered"
            ) {
              console.log(
                "📬 Message delivered"
              )
            }

            /**
             * READ
             */
            if (
              statusValue === "read"
            ) {
              console.log(
                "👀 Message read"
              )
            }

            /**
             * FAILED
             */
            if (
              statusValue === "failed"
            ) {
              console.error(
                "❌ WhatsApp message failed:"
              )

              console.error(
                JSON.stringify(
                  status,
                  null,
                  2
                )
              )
            }

            console.log(
              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            )
          }
        }
      }
    }

    /**
     * ==================================================
     * ACKNOWLEDGE WEBHOOK
     * ==================================================
     *
     * Meta expects a successful response.
     */
    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      "❌ WhatsApp webhook error:",
      error
    )

    /**
     * Return 200 so Meta does not repeatedly
     * retry an event that has already reached us.
     */
    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    )
  }
}

