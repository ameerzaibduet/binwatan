"use client"

type TiktokQueue = {
  track?: (eventName: string, params?: Record<string, unknown>) => void
  identify?: (params: Record<string, string>) => void
}

type ProductLike = {
  id: string
  name: string
  price: number
  quantity?: number
  category?: string
}

const getTtq = (): TiktokQueue | undefined => {
  if (typeof window === "undefined") return undefined
  return (window as Window & { ttq?: TiktokQueue }).ttq
}

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

const sha256 = async (value: string) => {
  if (typeof window === "undefined" || !window.crypto?.subtle) return ""

  const data = new TextEncoder().encode(value)
  const hash = await window.crypto.subtle.digest("SHA-256", data)
  return toHex(hash)
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const normalizePakistaniPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "")

  if (digits.startsWith("0092")) return digits.slice(2)
  if (digits.startsWith("92")) return digits
  if (digits.startsWith("0")) return `92${digits.slice(1)}`

  return digits
}

export const buildTikTokProductParams = (product: ProductLike) => ({
  content_id: product.id,
  content_ids: [product.id],
  contents: [
    {
      content_id: product.id,
      content_name: product.name,
      price: product.price,
      quantity: product.quantity ?? 1,
    },
  ],
  content_type: "product",
  content_name: product.name,
  content_category: product.category,
  quantity: product.quantity ?? 1,
  price: product.price,
  value: product.price * (product.quantity ?? 1),
  currency: "PKR",
})

export const buildTikTokCartParams = (cart: ProductLike[]) => {
  const contents = cart.map((item) => ({
    content_id: item.id,
    content_name: item.name,
    price: item.price,
    quantity: item.quantity ?? 1,
  }))

  return {
    content_id: contents.map((item) => item.content_id).join(","),
    content_ids: contents.map((item) => item.content_id),
    contents,
    content_type: "product",
    value: cart.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0),
    currency: "PKR",
  }
}

export const trackTikTokEvent = (
  eventName: string,
  params: Record<string, unknown> = {}
) => {
  getTtq()?.track?.(eventName, params)
}

export const identifyTikTokCustomer = async ({
  email,
  phone,
}: {
  email?: string
  phone?: string
}) => {
  const identifiers: Record<string, string> = {}
  const normalizedEmail = email ? normalizeEmail(email) : ""
  const normalizedPhone = phone ? normalizePakistaniPhone(phone) : ""

  if (normalizedEmail) identifiers.email = await sha256(normalizedEmail)
  if (normalizedPhone) identifiers.phone_number = await sha256(normalizedPhone)

  if (Object.keys(identifiers).length > 0) {
    getTtq()?.identify?.(identifiers)
  }
}
