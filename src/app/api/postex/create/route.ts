// /app/api/postex/create/route.ts
import { NextResponse } from "next/server"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["customerName", "customerPhone", "deliveryAddress", "cityName", "invoicePayment", "items", "weight"]
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { statusCode: "400", statusMessage: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Build payload according to PostEx docs
    const payload: any = {
      orderRefNumber: body.orderRefNumber || `ORD-${Date.now()}`,
      invoicePayment: String(body.invoicePayment),
      orderDetail: body.orderDetail || "",
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      transactionNotes: body.transactionNotes || "",
      cityName: body.cityName,
      invoiceDivision: 1,
      items: Number(body.items),
      weight: Number(body.weight), // ✅ Include total weight
      orderType: body.orderType || "Normal",
      pickupAddressCode: body.pickupAddressCode || "001",
      pickupAddress: body.pickupAddress || "House # 44 5/f1 Orangi Town Karachi",
    }

    // Select which PostEx account token to sign this booking with.
    // Rain Suit / Rain Coat orders are flagged by the frontend with
    // accountKey: "KHAN_ZAIB" and must always book through that
    // dedicated PostEx account, independent of the default token.
    const postexToken =
      body.accountKey === "KHAN_ZAIB"
        ? process.env.POSTEX_TOKEN_KHAN_ZAIB
        : process.env.POSTEX_API_TOKEN

    if (!postexToken) {
      const missingVar =
        body.accountKey === "KHAN_ZAIB"
          ? "POSTEX_TOKEN_KHAN_ZAIB"
          : "POSTEX_API_TOKEN"

      console.error(`❌ Missing PostEx token env var: ${missingVar}`)

      return NextResponse.json(
        {
          statusCode: "500",
          statusMessage: `Server misconfigured: ${missingVar} is not set`,
        },
        { status: 500 }
      )
    }

    console.log(
      `📦 Sending payload to PostEx [account: ${body.accountKey === "KHAN_ZAIB" ? "KHAN_ZAIB" : "default"}]:`,
      payload
    )

    // Call PostEx API
    const response = await axios.post(
      "https://api.postex.pk/services/integration/api/order/v3/create-order",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          token: postexToken,
        },
      }
    )

    console.log("✅ PostEx API Response:", response.data)

    // ✅ Return flat structure (so frontend logic works)
    return NextResponse.json({
      statusCode: response.data.statusCode || "200",
      statusMessage: response.data.statusMessage || "ORDER HAS BEEN CREATED",
      dist: response.data.dist || {},
    })
  } catch (error: any) {
    const errData = error.response?.data || error.message
    console.error("❌ PostEx API Error:", errData)

    return NextResponse.json(
      {
        statusCode: String(error.response?.status || 500),
        statusMessage: errData?.statusMessage || "PostEx API request failed",
      },
      { status: error.response?.status || 500 }
    )
  }
}