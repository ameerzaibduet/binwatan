import axios from "axios"
import https from "https"

const BASE_URL = (
  process.env.NEXTSTEP_API_BASE_URL ||
  "https://api.nextstepcourier.com/api/webhooks"
).replace(/\/$/, "")

// Avoid IPv6 connection hangs on some Windows networks.
const HTTPS_AGENT = new https.Agent({ family: 4, keepAlive: true })

const REQUEST_TIMEOUT_MS = 45000

function getHeaders() {
  const apiKey = process.env.NEXTSTEP_API_KEY
  if (!apiKey) {
    throw new Error("NEXTSTEP_API_KEY is not configured")
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }
}

export type NextStepRegisterOrderInput = {
  ref_no: string | number
  c_name: string
  c_contact: string
  c_address: string
  c_city: string
  c_reference: string
  c_remarks?: string
  product: string
  quantity: number
  cod: number
  weight: number
  allow_open: boolean
  fragile: boolean
}

export type NextStepPickupLocation = {
  _id: string
  uid: string
  name?: string
  address: string
  area?: string
  city: string
  is_active: boolean
}

let pickupLocationsCache: NextStepPickupLocation[] | null = null
let pickupLocationsCacheAt = 0
const PICKUP_CACHE_MS = 5 * 60 * 1000

export async function getPickupLocations(forceRefresh = false) {
  const now = Date.now()
  if (
    !forceRefresh &&
    pickupLocationsCache &&
    now - pickupLocationsCacheAt < PICKUP_CACHE_MS
  ) {
    return pickupLocationsCache
  }

  const res = await axios.get(`${BASE_URL}/get/pickup/locations`, {
    headers: getHeaders(),
    timeout: REQUEST_TIMEOUT_MS,
    httpsAgent: HTTPS_AGENT,
  })

  pickupLocationsCache = (res.data?.result || []) as NextStepPickupLocation[]
  pickupLocationsCacheAt = now
  return pickupLocationsCache
}

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i

export function getPickupLocationApiId(location: NextStepPickupLocation) {
  return location._id
}

export async function resolvePickupLocationId(preferredId?: string | null) {
  const candidate = preferredId || process.env.NEXTSTEP_PICKUP_LOCATION_ID || null

  if (candidate && OBJECT_ID_RE.test(candidate)) {
    return candidate
  }

  const locations = (await getPickupLocations()).filter((location) => location.is_active)

  if (locations.length === 0) {
    throw new Error(
      "No active NextStep pickup locations found. Set NEXTSTEP_PICKUP_LOCATION_ID in .env.local or register a pickup location in NextStep."
    )
  }

  if (candidate) {
    const match = locations.find(
      (location) => location._id === candidate || location.uid === candidate
    )
    if (!match) {
      throw new Error(`Pickup location "${candidate}" was not found in your NextStep account.`)
    }
    return match._id
  }

  return locations[0]._id
}

function sanitizeRegisterOrders(orders: NextStepRegisterOrderInput[]) {
  return orders.map((order) => ({
    ...order,
    product: (order.product || "Website Order").slice(0, 250),
    c_remarks: (order.c_remarks || "").slice(0, 250),
  }))
}

export async function registerOrders(
  locationId: string | null,
  orders: NextStepRegisterOrderInput[]
) {
  const resolvedLocationId = await resolvePickupLocationId(locationId)

  const res = await axios.post(
    `${BASE_URL}/register/orders`,
    {
      location_id: resolvedLocationId,
      orders: sanitizeRegisterOrders(orders),
    },
    {
      headers: getHeaders(),
      timeout: REQUEST_TIMEOUT_MS,
      httpsAgent: HTTPS_AGENT,
    }
  )

  return res.data
}

export async function trackOrdersStatus(trackingIds: string[]) {
  const res = await axios.post(
    `${BASE_URL}/track/orders/status`,
    { tracking_ids: trackingIds },
    {
      headers: getHeaders(),
      timeout: REQUEST_TIMEOUT_MS,
      httpsAgent: HTTPS_AGENT,
    }
  )

  return res.data
}

export async function trackOrder(trackingId: string) {
  const res = await axios.get(`${BASE_URL}/track/order/${trackingId}`, {
    headers: getHeaders(),
    timeout: REQUEST_TIMEOUT_MS,
    httpsAgent: HTTPS_AGENT,
  })

  return res.data
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")

  if (digits.startsWith("92")) return digits
  if (digits.startsWith("0")) return `92${digits.slice(1)}`
  if (digits.length === 10) return `92${digits}`

  return digits
}

export function parseNextStepDeliveryDate(timeline: Array<{ status?: string; name?: string; dt?: string }>) {
  const delivered = [...timeline]
    .reverse()
    .find((entry) => {
      const status = (entry.status || entry.name || "").toUpperCase()
      return status === "DELIVERED"
    })

  return delivered?.dt || null
}
