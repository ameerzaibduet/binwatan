import { NextResponse } from "next/server"
import { registerOrders, normalizePhone } from "@/lib/nextstep/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const locationId =
      body.pickupLocationId || process.env.NEXTSTEP_PICKUP_LOCATION_ID || null

    const requiredFields = [
      "customerName",
      "customerPhone",
      "deliveryAddress",
      "cityName",
      "invoicePayment",
      "items",
      "weight",
    ]

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { statusCode: "400", statusMessage: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    const orderRef = String(body.orderRefNumber || body.orderId || `WEB-${Date.now()}`)

    const response = await registerOrders(locationId, [
      {
        ref_no: orderRef,
        c_name: body.customerName,
        c_contact: normalizePhone(body.customerPhone),
        c_address: body.deliveryAddress,
        c_city: body.cityName,
        c_reference: orderRef,
        c_remarks: body.transactionNotes || "",
        product: body.orderDetail || "Website Order",
        quantity: Number(body.items),
        cod: Number(body.invoicePayment),
        weight: Math.max(Number(body.weight) || 0, 0.5),
        allow_open: body.allowOpen !== false,
        fragile: Boolean(body.fragile),
      },
    ])

    const bookedOrder = response?.result?.orders?.[0]
    const failedOrder = response?.result?.failed_orders?.[0]

    if (!response?.success || !bookedOrder?.tracking_id) {
      const statusMessage =
        failedOrder?.message ||
        response?.message ||
        "NextStep booking failed"

      console.error("NextStep booking rejected:", {
        statusMessage,
        failed_orders: response?.result?.failed_orders,
        response,
      })

      return NextResponse.json(
        {
          statusCode: "400",
          statusMessage,
          failedOrders: response?.result?.failed_orders || [],
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      statusCode: "200",
      statusMessage: response.message || "ORDER HAS BEEN CREATED",
      dist: {
        trackingNumber: bookedOrder.tracking_id,
      },
      provider: "nextstep",
      raw: response,
    })
  } catch (error: unknown) {
    const err = error as {
      code?: string
      response?: {
        data?: {
          message?: string
          result?: { failed_orders?: Array<{ message?: string }> }
        }
        status?: number
      }
      message?: string
    }

    console.error("NextStep create error:", {
      code: err.code,
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    })

    const failedMessage = err.response?.data?.result?.failed_orders?.[0]?.message
    const isTimeout =
      err.code === "ECONNABORTED" || /timeout/i.test(err.message || "")
    const message = isTimeout
      ? "NextStep API timed out. Check your internet connection and NEXTSTEP_API_BASE_URL, then try again."
      : failedMessage ||
        err.response?.data?.message ||
        err.message ||
        "NextStep API request failed"

    return NextResponse.json(
      {
        statusCode: String(err.response?.status || 500),
        statusMessage: message,
      },
      { status: err.response?.status || 500 }
    )
  }
}
