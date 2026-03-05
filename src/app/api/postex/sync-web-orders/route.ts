import { NextResponse } from "next/server"
import axios from "axios"
import { supabaseServer } from "@/utils/supabase/server"

/* ------------------------------
   PostEx Token (Single Account)
--------------------------------*/
const POSTEX_API_TOKEN = process.env.POSTEX_API_TOKEN!

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
   POST: Sync Website Orders
--------------------------------*/
export async function POST() {
  try {

    /* ----------------------------------
       1. Get Orders From Supabase
    ---------------------------------- */

    const { data: orders, error } = await supabaseServer
      .from("orders")
      .select("id, tracking_number")
      .not("tracking_number", "is", null)

    if (error) throw error

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orders found",
      })
    }

    const trackingNumbers = orders.map(o => o.tracking_number)

    /* ----------------------------------
       2. Split Into Batches (50 each)
    ---------------------------------- */

    const batches = chunkArray(trackingNumbers, 50)

    /* ----------------------------------
       3. Process Each Batch
    ---------------------------------- */

    for (const batch of batches) {

      const trackingList = batch.join(",")

      console.log("Syncing:", trackingList)

      /* ----------------------------------
         4. Call PostEx Bulk API
      ---------------------------------- */

      const res = await axios.get(
        "https://api.postex.pk/services/integration/api/order/v1/track-bulk-order",
        {
          headers: {
            token: POSTEX_API_TOKEN,
          },

          params: {
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
         5. Update Supabase Records
      ---------------------------------- */

      for (const item of dist) {

        const t = item.trackingResponse

        if (!t?.trackingNumber) continue

        const { error: updateError } = await supabaseServer
          .from("orders")
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

    /* ----------------------------------
       6. Done
    ---------------------------------- */

    return NextResponse.json({
      success: true,
      message: "Website orders synced successfully",
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