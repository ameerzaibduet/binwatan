export function normalizeOrderPhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "")
  if (digits.startsWith("92")) return digits
  if (digits.startsWith("0")) return `92${digits.slice(1)}`
  if (digits.length === 10) return `92${digits}`
  return digits
}

export function isDeliveredOrder(order: {
  delivery_date?: string | null
  transaction_status?: string | null
}): boolean {
  if (order.delivery_date) return true
  return /^delivered$/i.test(String(order.transaction_status || "").trim())
}

export function isReturnedOrder(order: {
  transaction_status?: string | null
}): boolean {
  const status = String(order.transaction_status || "").trim()
  return /^return/i.test(status) || /returned/i.test(status) || /return_confirm/i.test(status)
}

export type CustomerTrustLabel = "new" | "trusted" | "high-risk"

export function getCustomerTrustLabel(
  phone: string,
  currentOrderId: string,
  allOrders: Array<{
    id: string
    phone?: string | null
    delivery_date?: string | null
    transaction_status?: string | null
  }>
): CustomerTrustLabel {
  const normalized = normalizeOrderPhone(phone)
  const previous = allOrders.filter(
    (order) =>
      order.id !== currentOrderId &&
      normalizeOrderPhone(order.phone || "") === normalized
  )

  if (previous.length === 0) return "new"
  if (previous.some(isReturnedOrder)) return "high-risk"
  if (previous.some(isDeliveredOrder)) return "trusted"
  return "new"
}

export type CustomerOrderStatus =
  | "placed"
  | "booked"
  | "in-transit"
  | "delivered"
  | "returned"

export function getCustomerOrderStatus(order: {
  dispatched?: boolean
  delivery_date?: string | null
  transaction_status?: string | null
  tracking_number?: string | null
}): CustomerOrderStatus {
  if (isReturnedOrder(order)) return "returned"
  if (isDeliveredOrder(order)) return "delivered"
  if (order.dispatched || order.tracking_number) return "in-transit"
  return "placed"
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerOrderStatus, string> = {
  placed: "Order placed",
  booked: "Booked for delivery",
  "in-transit": "On the way",
  delivered: "Delivered",
  returned: "Returned",
}
