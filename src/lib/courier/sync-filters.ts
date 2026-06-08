const TERMINAL_STATUS_PATTERNS = [
  /^delivered$/i,
  /^return/i,
  /returned/i,
  /return_confirm/i,
  /cancelled/i,
  /canceled/i,
]

export function isTerminalCourierStatus(status: string | null | undefined): boolean {
  if (!status) return false
  const normalized = status.trim()
  return TERMINAL_STATUS_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function getSyncCutoffIso(): string {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 2)
  return cutoff.toISOString()
}

export function shouldSyncOrder(order: {
  created_at?: string | null
  delivery_date?: string | null
  transaction_status?: string | null
}): boolean {
  if (!order.created_at) return false

  if (new Date(order.created_at) < new Date(getSyncCutoffIso())) return false
  if (order.delivery_date) return false
  if (isTerminalCourierStatus(order.transaction_status)) return false

  return true
}
