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
  "order_confirmation"

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
// TYPES
// ============================================================

type WhatsAppItem = {
  name: string
  quantity: number
  color?: string | null
  size?: string | null
}

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
          error:
            "WHATSAPP_PHONE_NUMBER_ID is missing",
        },
        { status: 500 }
      )
    }

    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WHATSAPP_ACCESS_TOKEN is missing",
        },
        { status: 500 }
      )
    }

    if (!SUPABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error:
            "NEXT_PUBLIC_SUPABASE_URL is missing",
        },
        { status: 500 }
      )
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SUPABASE_SERVICE_ROLE_KEY is missing",
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
      customerName,
      items,
      total,
      orderId,
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

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          error: "customerName is required",
        },
        { status: 400 }
      )
    }

    if (
      items === undefined ||
      items === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "items is required",
        },
        { status: 400 }
      )
    }

    if (
      total === undefined ||
      total === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "total is required",
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
          error:
            "Could not verify order",
          details: orderLookupError.message,
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
    // PREPARE ITEMS
    // --------------------------------------------------------

    let itemText = String(items)

    if (Array.isArray(items)) {
      itemText = (items as WhatsAppItem[])
        .map((item) => {
          let line =
            `${item.name} x${item.quantity}`

          if (item.color) {
            line += ` - ${item.color}`
          }

          if (item.size) {
            line += ` - ${item.size}`
          }

          return line
        })
        .join("\n")
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
    // order_confirmation
    //
    // Body parameters:
    // {{1}} = Customer name
    // {{2}} = Product details
    // {{3}} = Total
    //
    // Buttons are already configured in Meta.
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
                  customerName
                ),
              },

              {
                type: "text",
                text: itemText,
              },

              {
                type: "text",
                text: `Rs. ${total}`,
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
      "📤 Sending Bin Watan WhatsApp template"
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
      "Language:",
      TEMPLATE_LANGUAGE
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
      "✅ WhatsApp message sent successfully"
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
    // SAVE WHATSAPP MESSAGE ID TO SUPABASE
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
      // Don't report the whole WhatsApp send as failed.
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

      whatsappMessageId,

      data,

      message:
        "WhatsApp order confirmation sent and message ID saved successfully",
    })
  } catch (error) {
    console.error(
      "❌ WhatsApp send error:",
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