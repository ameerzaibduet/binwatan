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

    const sessionKey = process.env.WAPIO_SESSION_KEY
    const sessionId = process.env.WAPIO_SESSION_ID

    if (!sessionKey) {
      return NextResponse.json(
        {
          success: false,
          error: "WAPIO_SESSION_KEY is missing",
        },
        { status: 500 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "WAPIO_SESSION_ID is missing",
        },
        { status: 500 }
      )
    }

    const response = await fetch(
      "https://api.wapio.io/api/send-message",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
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