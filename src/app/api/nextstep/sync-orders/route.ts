import { NextResponse } from "next/server"
import { chunkArray } from "@/lib/courier/chunk"
import { getSyncCutoffIso, shouldSyncOrder } from "@/lib/courier/sync-filters"
import { parseNextStepDeliveryDate, trackOrdersStatus } from "@/lib/nextstep/client"
import { supabaseServer } from "@/utils/supabase/server"

export async function POST() {
  try {
    const cutoff = getSyncCutoffIso()

    const { data: orders, error } = await supabaseServer
      .from("manual_orders")
      .select("*")
      .not("tracking_number", "is", null)
      .gte("created_at", cutoff)

    if (error) throw error

    const eligible = (orders || []).filter((order) => {
      if (order.courier_provider && order.courier_provider !== "nextstep") return false
      return shouldSyncOrder(order)
    })

    if (eligible.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No NextStep orders to sync",
        synced: 0,
      })
    }

    const batches = chunkArray(
      eligible.map((order) => order.tracking_number as string),
      50
    )

    let synced = 0

    for (const batch of batches) {
      const response = await trackOrdersStatus(batch)
      const results = response?.result || []

      for (const item of results) {
        const timeline = item.timeline || []
        const latestStatus =
          timeline[timeline.length - 1]?.status ||
          timeline[timeline.length - 1]?.name ||
          null
        const deliveryDate = parseNextStepDeliveryDate(timeline)

        const { error: updateError } = await supabaseServer
          .from("manual_orders")
          .update({
            transaction_status: latestStatus,
            delivery_date: deliveryDate,
            tracking_response: item,
            last_synced_at: new Date().toISOString(),
          })
          .eq("tracking_number", item.tracking_id)

        if (!updateError) synced++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} NextStep manual orders`,
      synced,
      skipped: (orders?.length || 0) - eligible.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed"
    console.error("NextStep manual sync error:", err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
