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
  process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
  "en_US"

export async function POST(request: Request) {
  try {
    /*
     * Check environment variables
     */
    if (
      !PHONE_NUMBER_ID ||
      !ACCESS_TOKEN
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WhatsApp environment variables are missing",
        },
        {
          status: 500,
        }
      )
    }

    /*
     * Read request body
     */
    const body = await request.json()

    const {
      phone,
      customerName,
      items,
      total,
    } = body

    /*
     * Validate required fields
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
          error:
            "customerName is required",
        },
        {
          status: 400,
        }
      )
    }

    if (!items) {
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
     * Convert Pakistani phone number
     *
     * 03172017176
     *       ↓
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
     * Meta Graph API endpoint
     */
    const url =
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`

    /*
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
                text: String(
                  customerName
                ),
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

    console.log(
      "📤 Sending Bin Watan WhatsApp template:",
      JSON.stringify(
        {
          to: recipient,
          template: TEMPLATE_NAME,
          language:
            TEMPLATE_LANGUAGE,
        },
        null,
        2
      )
    )

    /*
     * Send to Meta
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
     * Meta returned an error
     */
    if (!response.ok) {
      console.error(
        "❌ Meta WhatsApp API error:",
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
        },
        {
          status:
            response.status,
        }
      )
    }

    /*
     * Successful send
     */
    console.log(
      "✅ WhatsApp message sent:",
      JSON.stringify(
        data,
        null,
        2
      )
    )

    return NextResponse.json({
      success: true,

      data,

      message: "WhatsApp message sent successfully",
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
      {
        status: 500,
      }
    )
  }
}