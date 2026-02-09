import { NextResponse } from "next/server"
import axios from "axios"
import { POSTEX_ACCOUNTS } from "@/lib/postexAccounts"
import { supabaseServer } from "@/utils/supabase/server"

/* ------------------------------
   Helper: Split array into chunks
--------------------------------*/
function chunkArray(arr: string[], size: number) {
  const result: string[][] = []

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }

  return result
}

/* ------------------------------
   POST: Sync Orders With PostEx
--------------------------------*/
export async function POST() {
  try {
    /* ----------------------------------
       1. Get Orders From Supabase
    ---------------------------------- */

    const { data: orders, error } = await supabaseServer
      .from("manual_orders")
      .select("id, tracking_number, postex_account")
      .not("tracking_number", "is", null)

    if (error) throw error

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orders found",
      })
    }

    /* ----------------------------------
       2. Group Orders By Account
    ---------------------------------- */

    const grouped: Record<string, string[]> = {}

    for (const order of orders) {
      if (!grouped[order.postex_account]) {
        grouped[order.postex_account] = []
      }

      grouped[order.postex_account].push(order.tracking_number)
    }

    /* ----------------------------------
       3. Process Each Account
    ---------------------------------- */

    for (const account in grouped) {
      const token = POSTEX_ACCOUNTS[account]

      if (!token) {
        console.log("Invalid token for account:", account)
        continue
      }

      const batches = chunkArray(grouped[account], 50)

      /* ----------------------------------
         4. Process Each Batch
      ---------------------------------- */

      for (const batch of batches) {
        const trackingList = batch.join(",")

        console.log("Syncing:", trackingList)

        /* ----------------------------------
           5. Call PostEx Bulk API
        ---------------------------------- */

        const res = await axios.get(
          "https://api.postex.pk/services/integration/api/order/v1/track-bulk-order",
          {
            headers: {
              token,
            },

            params: {
              // IMPORTANT: Backend expects this exact name
              TrackingNumbers: trackingList,
            },

            timeout: 30000,
          }
        )

        if (res.data?.statusCode !== "200") {
          console.log("PostEx API Error:", res.data)
          continue
        }

        const dist = res.data?.dist || []

        /* ----------------------------------
           6. Update Supabase Records
        ---------------------------------- */

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

          if (updateError) {
            console.error("Supabase Update Error:", updateError)
          }
        }
      }
    }

    /* ----------------------------------
       7. Done
    ---------------------------------- */

    return NextResponse.json({
      success: true,
      message: "Orders synced successfully",
    })

  } catch (err: any) {
    console.error("Sync Error:", err?.response?.data || err)

    return NextResponse.json(
      {
        success: false,
        error: err?.response?.data || err.message,
      },
      { status: 500 }
    )
  }
}
