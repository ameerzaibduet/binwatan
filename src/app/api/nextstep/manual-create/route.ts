import { NextResponse } from "next/server"
import { registerOrders, normalizePhone } from "@/lib/nextstep/client"
import { supabaseServer } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const locationId =
      body.pickupLocationId || process.env.NEXTSTEP_PICKUP_LOCATION_ID || null

    const response = await registerOrders(locationId, [
      {
        ref_no: body.referenceId || `MAN-${Date.now()}`,
        c_name: body.customerName,
        c_contact: normalizePhone(body.customerPhone),
        c_address: body.deliveryAddress,
        c_city: body.cityName,
        c_reference: String(body.referenceId || `MAN-${Date.now()}`),
        c_remarks: body.orderDetail || "",
        product: body.orderDetail || "Manual Order",
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
      return NextResponse.json(
        {
          error:
            failedOrder?.message || response?.message || "NextStep booking failed",
        },
        { status: 400 }
      )
    }

    const trackingNumber = bookedOrder.tracking_id

    const insertPayload: Record<string, unknown> = {
      postex_account: body.referenceId || "NextStep",
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
      transaction_notes: body.transactionNotes || "Allowed To Open",

      tracking_number: trackingNumber,
      dispatched: true,
      raw_response: response,
      courier_provider: "nextstep",
    }

    let { error } = await supabaseServer.from("manual_orders").insert(insertPayload)

    if (error?.message?.includes("courier_provider")) {
      delete insertPayload.courier_provider
      ;({ error } = await supabaseServer.from("manual_orders").insert(insertPayload))
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      trackingNumber,
      provider: "nextstep",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error"
    console.error("NextStep Manual Order Error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
