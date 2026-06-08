import { NextResponse } from "next/server"
import axios from "axios"
import { chunkArray } from "@/lib/courier/chunk"
import { getSyncCutoffIso, shouldSyncOrder } from "@/lib/courier/sync-filters"
import { POSTEX_ACCOUNTS } from "@/lib/postexAccounts"
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
      if (order.courier_provider === "nextstep") return false
      return shouldSyncOrder(order)
    })

    if (eligible.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No PostEx orders to sync",
        synced: 0,
        skipped: orders?.length || 0,
      })
    }

    const grouped: Record<string, string[]> = {}

    for (const order of eligible) {
      const account = order.postex_account || "Khan Zaib"
      if (!grouped[account]) grouped[account] = []
      grouped[account].push(order.tracking_number)
    }

    let synced = 0

    for (const account in grouped) {
      const token = POSTEX_ACCOUNTS[account]
      if (!token) continue

      const batches = chunkArray(grouped[account], 50)

      for (const batch of batches) {
        const trackingList = batch.join(",")

        const res = await axios.get(
          "https://api.postex.pk/services/integration/api/order/v1/track-bulk-order",
          {
            headers: { token },
            params: { TrackingNumbers: trackingList },
            timeout: 30000,
          }
        )

        if (res.data?.statusCode !== "200") continue

        const dist = res.data?.dist || []

        for (const item of dist) {
          const t = item.trackingResponse
          if (!t?.trackingNumber) continue

          const { error: updateError } = await supabaseServer
            .from("manual_orders")
            .update({
              transaction_status: t.transactionStatus,
              pickup_date: t.orderPickupDate || null,
              delivery_date: t.orderDeliveryDate || null,
              tracking_response: t,
              last_synced_at: new Date().toISOString(),
            })
            .eq("tracking_number", t.trackingNumber)

          if (!updateError) synced++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} PostEx manual orders`,
      synced,
      skipped: (orders?.length || 0) - eligible.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed"
    console.error("PostEx manual sync error:", err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
