
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

export async function POST(request: Request) {
  try {
    /*
     * ==========================================
     * CHECK ENVIRONMENT VARIABLES
     * ==========================================
     */

    if (!PHONE_NUMBER_ID) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WHATSAPP_PHONE_NUMBER_ID is missing",
        },
        {
          status: 500,
        }
      )
    }

    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WHATSAPP_ACCESS_TOKEN is missing",
        },
        {
          status: 500,
        }
      )
    }

    /*
     * ==========================================
     * READ REQUEST BODY
     * ==========================================
     */

    const body = await request.json()

    const {
      phone,
      customerName,
      items,
      total,
    } = body

    /*
     * ==========================================
     * VALIDATION
     * ==========================================
     */

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "phone is required",
        },
        {
          status: 400,
        }
      )
    }

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          error: "customerName is required",
        },
        {
          status: 400,
        }
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
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      )
    }

    /*
     * ==========================================
     * FORMAT PAKISTANI PHONE NUMBER
     * ==========================================
     *
     * 03172017176
     *      ↓
     * 923172017176
     *
     * 923172017176
     *      ↓
     * 923172017176
     */

    let recipient =
      String(phone).replace(/\D/g, "")

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
        {
          status: 400,
        }
      )
    }

    /*
     * ==========================================
     * META GRAPH API URL
     * ==========================================
     */

    const url =
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`

    /*
     * ==========================================
     * TEMPLATE PAYLOAD
     * ==========================================
     *
     * Template:
     *
     * {{1}} = Customer name
     * {{2}} = Product details
     * {{3}} = Total
     */

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
                text: String(customerName),
              },

              {
                type: "text",
                text: String(items),
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

    /*
     * ==========================================
     * LOG SEND INFORMATION
     * ==========================================
     */

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )

    console.log(
      "📤 Sending Bin Watan WhatsApp template"
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

    /*
     * ==========================================
     * SEND TO META
     * ==========================================
     */

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

        body: JSON.stringify(payload),
      }
    )

    const data =
      await response.json()

    /*
     * ==========================================
     * META ERROR
     * ==========================================
     */

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

          template: TEMPLATE_NAME,

          language:
            TEMPLATE_LANGUAGE,
        },
        {
          status: response.status,
        }
      )
    }

    /*
     * ==========================================
     * SUCCESS
     * ==========================================
     */

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

    return NextResponse.json({
      success: true,

      data,

      template: TEMPLATE_NAME,

      language:
        TEMPLATE_LANGUAGE,

      recipient,

      message:
        "WhatsApp message sent successfully",
    })
  } catch (error) {
    /*
     * ==========================================
     * UNEXPECTED ERROR
     * ==========================================
     */

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
      {
        status: 500,
      }
    )
  }
}
