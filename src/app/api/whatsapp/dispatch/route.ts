import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID

const ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN

const API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v23.0"

const TEMPLATE_NAME =
  "order_dispatched"

const TEMPLATE_LANGUAGE =
  process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en"

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY

// ============================================================
// SUPABASE SERVER CLIENT
// ============================================================

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null

// ============================================================
// POST
// ============================================================

export async function POST(request: Request) {
  try {
    // --------------------------------------------------------
    // CHECK ENVIRONMENT
    // --------------------------------------------------------

    if (!PHONE_NUMBER_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "WHATSAPP_PHONE_NUMBER_ID is missing",
        },
        { status: 500 }
      )
    }

    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: "WHATSAPP_ACCESS_TOKEN is missing",
        },
        { status: 500 }
      )
    }

    if (!SUPABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "NEXT_PUBLIC_SUPABASE_URL is missing",
        },
        { status: 500 }
      )
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "SUPABASE_SERVICE_ROLE_KEY is missing",
        },
        { status: 500 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase server client could not be created",
        },
        { status: 500 }
      )
    }

    // --------------------------------------------------------
    // READ REQUEST
    // --------------------------------------------------------

    const body = await request.json()

    const {
      phone,
      orderId,
      trackingNumber,
      courier,
      trackingLink,
    } = body

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "phone is required",
        },
        { status: 400 }
      )
    }

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "orderId is required",
        },
        { status: 400 }
      )
    }

    if (!trackingNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "trackingNumber is required",
        },
        { status: 400 }
      )
    }

    if (!courier) {
      return NextResponse.json(
        {
          success: false,
          error: "courier is required",
        },
        { status: 400 }
      )
    }

    if (!trackingLink) {
      return NextResponse.json(
        {
          success: false,
          error: "trackingLink is required",
        },
        { status: 400 }
      )
    }

    // --------------------------------------------------------
    // NORMALIZE PHONE NUMBER
    // --------------------------------------------------------

    let recipient = String(phone).replace(
      /\D/g,
      ""
    )

    if (recipient.startsWith("0")) {
      recipient =
        "92" + recipient.substring(1)
    }

    if (!recipient.startsWith("92")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Phone number must be a Pakistani number",
        },
        { status: 400 }
      )
    }

    // --------------------------------------------------------
    // VERIFY ORDER EXISTS
    // --------------------------------------------------------

    const {
      data: existingOrder,
      error: orderLookupError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        "id, name, phone, total, order_status"
      )
      .eq("id", orderId)
      .maybeSingle()

    if (orderLookupError) {
      console.error(
        "❌ Supabase order lookup error:",
        orderLookupError
      )

      return NextResponse.json(
        {
          success: false,
          error: "Could not verify order",
          details:
            orderLookupError.message,
        },
        { status: 500 }
      )
    }

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
          orderId,
        },
        { status: 404 }
      )
    }

    // --------------------------------------------------------
    // META WHATSAPP API URL
    // --------------------------------------------------------

    const url =
      `https://graph.facebook.com/` +
      `${API_VERSION}/` +
      `${PHONE_NUMBER_ID}/messages`

    // --------------------------------------------------------
    // WHATSAPP TEMPLATE
    //
    // Template:
    // order_dispatched
    //
    // Body parameters:
    // {{1}} = Tracking Number
    // {{2}} = Courier
    // {{3}} = Tracking Link
    // --------------------------------------------------------

    const payload = {
      messaging_product: "whatsapp",

      recipient_type: "individual",

      to: recipient,

      type: "template",

      template: {
        name: TEMPLATE_NAME,

        language: {
          code: TEMPLATE_LANGUAGE,
        },

        components: [
          {
            type: "body",

            parameters: [
              {
                type: "text",
                text: String(
                  trackingNumber
                ),
              },

              {
                type: "text",
                text: String(
                  courier
                ),
              },

              {
                type: "text",
                text: String(
                  trackingLink
                ),
              },
            ],
          },
        ],
      },
    }

    // --------------------------------------------------------
    // LOG
    // --------------------------------------------------------

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    console.log(
      "📦 Sending Bin Watan dispatch WhatsApp"
    )

    console.log(
      "Order ID:",
      orderId
    )

    console.log(
      "To:",
      recipient
    )

    console.log(
      "Template:",
      TEMPLATE_NAME
    )

    console.log(
      "Tracking Number:",
      trackingNumber
    )

    console.log(
      "Courier:",
      courier
    )

    console.log(
      "Tracking Link:",
      trackingLink
    )

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    // --------------------------------------------------------
    // SEND TO META
    // --------------------------------------------------------

    const response = await fetch(
      url,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${ACCESS_TOKEN}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          payload
        ),
      }
    )

    const data =
      await response.json()

    // --------------------------------------------------------
    // META ERROR
    // --------------------------------------------------------

    if (!response.ok) {
      console.error(
        "❌ Meta WhatsApp API error:"
      )

      console.error(
        JSON.stringify(
          data,
          null,
          2
        )
      )

      return NextResponse.json(
        {
          success: false,
          error: data,
          orderId,
          template:
            TEMPLATE_NAME,
          language:
            TEMPLATE_LANGUAGE,
        },
        {
          status:
            response.status,
        }
      )
    }

    // --------------------------------------------------------
    // META SUCCESS
    // --------------------------------------------------------

    console.log(
      "✅ Dispatch WhatsApp message sent successfully"
    )

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    )

    // --------------------------------------------------------
    // GET WHATSAPP MESSAGE ID
    // --------------------------------------------------------

    const whatsappMessageId =
      data?.messages?.[0]?.id

    if (!whatsappMessageId) {
      console.error(
        "⚠️ Meta response did not contain message ID"
      )

      return NextResponse.json(
        {
          success: true,
          warning:
            "Message sent but WhatsApp message ID was not returned",
          data,
          orderId,
        }
      )
    }

    console.log(
      "🆔 WhatsApp Message ID:",
      whatsappMessageId
    )

    // --------------------------------------------------------
    // SAVE DISPATCH MESSAGE ID TO SUPABASE
    // --------------------------------------------------------

    const {
      error: saveMessageIdError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        whatsapp_message_id:
          whatsappMessageId,
      })
      .eq("id", orderId)

    if (saveMessageIdError) {
      console.error(
        "❌ Failed to save WhatsApp message ID:"
      )

      console.error(
        saveMessageIdError
      )

      // Message was already sent.
      return NextResponse.json(
        {
          success: true,

          warning:
            "WhatsApp sent, but message ID could not be saved",

          data,

          orderId,

          whatsappMessageId,
        }
      )
    }

    console.log(
      "✅ WhatsApp message ID saved to order:",
      orderId
    )

    // --------------------------------------------------------
    // FINAL RESPONSE
    // --------------------------------------------------------

    return NextResponse.json({
      success: true,

      orderId,

      recipient,

      template:
        TEMPLATE_NAME,

      language:
        TEMPLATE_LANGUAGE,

      trackingNumber,

      courier,

      trackingLink,

      whatsappMessageId,

      data,

      message:
        "Order dispatched WhatsApp message sent successfully",
    })
  } catch (error) {
    console.error(
      "❌ WhatsApp dispatch send error:",
      error
    )

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}