import { NextResponse } from "next/server"
import axios from "axios"
import { POSTEX_ACCOUNTS } from "@/lib/postexAccounts"
import { supabaseServer } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const token = POSTEX_ACCOUNTS[body.postexAccount]
    if (!token) {
      return NextResponse.json({ error: "Invalid PostEx account" }, { status: 400 })
    }

    // ✅ Order Detail (REQUIRED)
    const orderDetail = `Manual Order | Items: ${body.items} | Weight: ${body.weight}kg`

    // 📦 PostEx Payload
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
      transactionNotes: "Allowed To Open",
      orderDetail: body.orderDetail,
    }

    const response = await axios.post(
      "https://api.postex.pk/services/integration/api/order/v3/create-order",
      payload,
      {
        headers: {
          token,
          "Content-Type": "application/json",
        },
      }
    )

    const trackingNumber = response.data?.dist?.trackingNumber || null

    // 💾 Save in Supabase
    const { error } = await supabaseServer
      .from("manual_orders")
      .insert({
        postex_account: body.postexAccount,
        reference_id: body.referenceId,
        order_ref_number: body.orderRefNumber,

        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        delivery_address: body.deliveryAddress,
        city_name: body.cityName,

        invoice_payment: body.invoicePayment,
        items: body.items,
        weight: body.weight,

        order_detail: body.orderDetail,
        transaction_notes: "Allowed To Open",

        tracking_number: trackingNumber,
        dispatched: true,
        raw_response: response.data,
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      trackingNumber,
    })

  } catch (err: any) {
    console.error("Manual Order Error:", err)
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    )
  }
}
