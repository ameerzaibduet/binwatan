import { NextResponse } from "next/server"
import { getPickupLocationApiId, getPickupLocations } from "@/lib/nextstep/client"

export async function GET() {
  try {
    const locations = await getPickupLocations(true)
    const active = locations
      .filter((location) => location.is_active)
      .map((location) => ({
        ...location,
        locationId: getPickupLocationApiId(location),
      }))

    return NextResponse.json({
      success: true,
      locations: active,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load pickup locations"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
