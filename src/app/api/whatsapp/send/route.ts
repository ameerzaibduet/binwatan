import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

const API_VERSION = "v23.0"
const TEMPLATE_NAME = "order_confrimation"

export async function POST(request: Request) {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp environment variables are missing",
        },
        { status: 500 }
      )
    }

    const body = await request.json()

    const {
      phone,
      customerName,
      items,
      total,
    } = body

    if (!phone || !customerName || !items || total === undefined || total === null) {
      return NextResponse.json(
        {
          success: false,
          error: "phone, customerName, items and total are required",
        },
        { status: 400 }
      )
    }

    let recipient = String(phone).replace(/\D/g, "")

    if (recipient.startsWith("0")) {
      recipient = "92" + recipient.substring(1)
    }

    if (!recipient.startsWith("92")) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number must be a Pakistani number",
        },
        { status: 400 }
      )
    }

    const url =
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "template",

      template: {
        name: TEMPLATE_NAME,

        language: {
          code: "en_US",
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

    console.log(
      "📤 Sending WhatsApp order confirmation:",
      JSON.stringify(
        {
          to: recipient,
          template: TEMPLATE_NAME,
          customerName,
          items,
          total,
        },
        null,
        2
      )
    )

    const response = await fetch(url, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(
        "❌ Meta WhatsApp API error:",
        JSON.stringify(data, null, 2)
      )

      return NextResponse.json(
        {
          success: false,
          error: data,
        },
        {
          status: response.status,
        }
      )
    }

    console.log(
      "✅ WhatsApp order confirmation sent:",
      JSON.stringify(data, null, 2)
    )

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("❌ WhatsApp send error:", error)

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