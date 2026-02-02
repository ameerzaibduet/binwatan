import { NextResponse } from "next/server"
import axios from "axios"
import { POSTEX_ACCOUNTS } from "@/lib/postexAccounts"
import { supabaseServer } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validate PostEx account
    const token = POSTEX_ACCOUNTS[body.postexAccount]
    if (!token) {
      return NextResponse.json({ error: "Invalid PostEx account" }, { status: 400 })
    }

    // Build PostEx payload
    const payload = {
      orderRefNumber: body.referenceId,
      invoicePayment: String(body.invoicePayment),
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      cityName: body.cityName,
      items: Number(body.items),
      weight: Number(body.weight),
      orderType: "Normal",
      pickupAddressCode: "001",
    }

    // Send to PostEx
    const response = await axios.post(
      "https://api.postex.pk/services/integration/api/order/v3/create-order",
      payload,
      { headers: { "Content-Type": "application/json", token } }
    )

    const trackingNumber = response.data?.dist?.trackingNumber || null

    // Insert into Supabase (manual_orders)
    const { data, error } = await supabaseServer
      .from("manual_orders")
      .insert({
        postex_account: body.postexAccount,
        reference_id: body.referenceId,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        delivery_address: body.deliveryAddress,
        city_name: body.cityName,
        invoice_payment: body.invoicePayment,
        items: body.items,
        weight: body.weight,
        order_ref_number: body.orderRefNumber,
        tracking_number: trackingNumber,
        dispatched: true,
        raw_response: response.data,
      })
      .select() // returns inserted row
      .single()

    console.log("📦 Supabase insert:", { data, error })

    if (error) {
      return NextResponse.json(
        { error: "Order created in PostEx but failed to save in DB", supabaseError: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trackingNumber,
      manualOrderId: data.id,
    })
  } catch (err: any) {
    console.error("❌ Manual order API error:", err)
    return NextResponse.json(
      { error: err.response?.data || err.message || "Unknown error" },
      { status: 500 }
    )
  }
}
