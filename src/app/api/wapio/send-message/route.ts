import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { to, text } = body

    if (!to || !text) {
      return NextResponse.json(
        {
          success: false,
          error: "to and text are required",
        },
        { status: 400 }
      )
    }

    const wapioKey = process.env.WAPIO_SK

    if (!wapioKey) {
      console.error("WAPIO_SK is missing")

      return NextResponse.json(
        {
          success: false,
          error: "Wapio API key is not configured",
        },
        { status: 500 }
      )
    }

    const response = await fetch(
      "https://api.wapio.io/api/send-message",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${wapioKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: String(to).replace(/\D/g, ""),
          text,
        }),
      }
    )

    const result = await response.json()

    console.log("Wapio response:", result)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Wapio API request failed",
          details: result,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Wapio send message error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}