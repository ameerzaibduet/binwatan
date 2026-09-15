import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

/**
 * Meta webhook verification
 *
 * Meta sends:
 * GET /api/whatsapp/webhook
 * ?hub.mode=subscribe
 * &hub.verify_token=...
 * &hub.challenge=...
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (
      mode === "subscribe" &&
      token &&
      VERIFY_TOKEN &&
      token === VERIFY_TOKEN
    ) {
      console.log("✅ Meta WhatsApp webhook verified")

      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }

    console.error("❌ Meta webhook verification failed")

    return new Response("Forbidden", {
      status: 403,
    })
  } catch (error) {
    console.error("Webhook GET error:", error)

    return new Response("Internal Server Error", {
      status: 500,
    })
  }
}

/**
 * Meta WhatsApp webhook events
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log(
      "📩 WhatsApp webhook received:",
      JSON.stringify(body, null, 2)
    )

    /*
     * Meta sends different webhook objects.
     * We only process WhatsApp Business Account events.
     */
    if (body?.object !== "whatsapp_business_account") {
      console.log("ℹ️ Ignoring non-WhatsApp webhook")

      return NextResponse.json(
        { success: true },
        { status: 200 }
      )
    }

    const entries = body?.entry

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { success: true },
        { status: 200 }
      )
    }

    for (const entry of entries) {
      const changes = entry?.changes

      if (!Array.isArray(changes)) {
        continue
      }

      for (const change of changes) {
        const value = change?.value

        if (!value) {
          continue
        }

        /*
         * Incoming customer messages
         */
        const messages = value?.messages

        if (Array.isArray(messages)) {
          for (const message of messages) {
            console.log(
              "📱 Incoming WhatsApp message:",
              JSON.stringify(message, null, 2)
            )

            const from = message?.from
            const messageType = message?.type

            console.log("Customer:", from)
            console.log("Message type:", messageType)

            /*
             * Button / interactive reply
             */
            if (messageType === "interactive") {
              const interactive = message?.interactive

              if (interactive?.type === "button_reply") {
                const buttonId =
                  interactive?.button_reply?.id

                const buttonTitle =
                  interactive?.button_reply?.title

                console.log("🔘 Button ID:", buttonId)
                console.log("🔘 Button title:", buttonTitle)

                /*
                 * Later we will connect these IDs to Supabase:
                 *
                 * confirm_order
                 * cancel_order
                 * need_help
                 */
              }
            }

            /*
             * Text message
             */
            if (messageType === "text") {
              const text = message?.text?.body

              console.log("💬 Customer text:", text)
            }
          }
        }

        /*
         * Delivery / read / sent status updates
         */
        const statuses = value?.statuses

        if (Array.isArray(statuses)) {
          for (const status of statuses) {
            console.log(
              "📊 WhatsApp status:",
              JSON.stringify(status, null, 2)
            )
          }
        }
      }
    }

    /*
     * IMPORTANT:
     * Always return 200 quickly to Meta.
     */
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ WhatsApp webhook error:", error)

    /*
     * We still return 200 so Meta doesn't repeatedly retry
     * a malformed/unexpected event.
     */
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  }
}