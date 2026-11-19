"use client"

// Save as: app/admin/calling/page.tsx
// (put it in the admin folder next to your orders page, so the URL is /admin/calling)

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  Play,
  Square,
  RefreshCw,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Plus,
  X,
  MapPin,
  Settings,
  Ban,
  RotateCcw,
} from "lucide-react"

type CallStatus =
  | "not_called"
  | "calling"
  | "answered"
  | "no_answer"
  | "callback"
  | "failed"

type OrderItem = {
  name?: string
  quantity?: number
  color?: string | null
  size?: string | null
}

type QueueOrder = {
  id: string
  name: string
  phone: string
  city: string
  address: string
  items: OrderItem[]
  total: number
  order_status?: string | null
  dispatched: boolean
  created_at: string
  in_call_queue?: boolean | null
  call_status?: CallStatus | null
  call_attempts?: number | null
  last_call_at?: string | null
  next_call_at?: string | null
}

type CallingState = {
  running: boolean
  paused_reason: string | null
  ring_timeout_seconds: number
  max_attempts: number
  retry_after_minutes: number
}

type CallAttempt = {
  id: string
  order_id: string
  phone: string
  attempt_number: number
  outcome: string
  started_at: string
  talk_seconds: number
}

type ListFilter = "available" | "queued" | "all"

const POLL_MS = 4000

const ORDER_COLUMNS =
  "id,name,phone,city,address,items,total,order_status,dispatched,created_at,in_call_queue,call_status,call_attempts,last_call_at,next_call_at"

const STATUS_STYLES: Record<CallStatus, { label: string; classes: string }> = {
  not_called: {
    label: "Not called",
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  },
  calling: {
    label: "Calling",
    classes: "bg-sky-50 text-sky-700 border-sky-200",
  },
  answered: {
    label: "Answered",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  no_answer: {
    label: "No answer",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  callback: {
    label: "Call back",
    classes: "bg-violet-50 text-violet-700 border-violet-200",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
}

const OUTCOME_CLASSES: Record<string, string> = {
  calling: "text-sky-700",
  answered: "text-emerald-700",
  no_answer: "text-amber-700",
  rejected: "text-amber-700",
  callback: "text-violet-700",
  failed: "text-red-700",
}

function callStatusOf(order: QueueOrder): CallStatus {
  return order.call_status || "not_called"
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function itemsSummary(order: QueueOrder) {
  if (!order.items?.length) {
    return "Order"
  }

  return order.items
    .map((item) => {
      const parts = [
        item.name || "Product",
        item.quantity ? `x${item.quantity}` : "",
        item.color ? capitalize(String(item.color)) : "",
        item.size ? `Size: ${item.size}` : "",
      ].filter(Boolean)

      return parts.join(" - ")
    })
    .join(", ")
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-PK").format(Number(value || 0))
}

function formatWhen(dateStr?: string | null) {
  if (!dateStr) {
    return "-"
  }

  return new Date(dateStr).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function CallingQueuePage() {
  const [orders, setOrders] = useState<QueueOrder[]>([])
  const [state, setState] = useState<CallingState | null>(null)
  const [attempts, setAttempts] = useState<CallAttempt[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState("")
  const [listFilter, setListFilter] = useState<ListFilter>("available")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [busy, setBusy] = useState<string | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [settingsDraft, setSettingsDraft] = useState<{
    ring: string
    attempts: string
    retry: string
  } | null>(null)

  function showMessage(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(""), 4000)
  }

  function showError(text: string) {
    setError(text)
    setTimeout(() => setError(""), 6000)
  }

  const refresh = useCallback(async (silent = true) => {
    try {
      if (!silent) {
        setRefreshing(true)
      }

      const [ordersRes, stateRes, attemptsRes] = await Promise.all([
        supabaseClient
          .from("orders")
          .select(ORDER_COLUMNS)
          .eq("dispatched", false)
          .or("order_status.eq.pending,order_status.is.null")
          .order("created_at", { ascending: false })
          .limit(1000),

        supabaseClient.from("calling_state").select("*").eq("id", 1).single(),

        supabaseClient
          .from("call_attempts")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(20),
      ])

      if (ordersRes.error) throw ordersRes.error
      if (stateRes.error) throw stateRes.error
      if (attemptsRes.error) throw attemptsRes.error

      const loadedOrders = ((ordersRes.data || []) as QueueOrder[]).map(
        (order) => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
        })
      )

      const loadedState = stateRes.data as CallingState

      setOrders(loadedOrders)
      setState(loadedState)
      setAttempts((attemptsRes.data || []) as CallAttempt[])

      setSettingsDraft(
        (current) =>
          current || {
            ring: String(loadedState.ring_timeout_seconds),
            attempts: String(loadedState.max_attempts),
            retry: String(loadedState.retry_after_minutes),
          }
      )
    } catch (err: any) {
      console.error("Calling queue refresh error:", err)

      if (!silent) {
        showError(err?.message || "Failed to load the calling queue.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refresh(false)

    const timer = setInterval(() => refresh(true), POLL_MS)

    return () => clearInterval(timer)
  }, [refresh])

  const maxAttempts = state?.max_attempts ?? 3

  const queued = useMemo(
    () => orders.filter((order) => order.in_call_queue),
    [orders]
  )

  const callingNow = useMemo(
    () => orders.filter((order) => callStatusOf(order) === "calling"),
    [orders]
  )

  const answeredOrders = useMemo(
    () => orders.filter((order) => callStatusOf(order) === "answered"),
    [orders]
  )

  const waitingToCall = useMemo(
    () =>
      queued.filter((order) => {
        const status = callStatusOf(order)

        return (
          (status === "not_called" ||
            status === "no_answer" ||
            status === "callback") &&
          Number(order.call_attempts || 0) < maxAttempts
        )
      }),
    [queued, maxAttempts]
  )

  const gaveUp = useMemo(
    () =>
      queued.filter(
        (order) =>
          callStatusOf(order) === "no_answer" &&
          Number(order.call_attempts || 0) >= maxAttempts
      ),
    [queued, maxAttempts]
  )

  const notInQueue = useMemo(
    () =>
      orders.filter(
        (order) =>
          !order.in_call_queue &&
          callStatusOf(order) !== "calling" &&
          callStatusOf(order) !== "answered"
      ),
    [orders]
  )

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      if (listFilter === "available") {
        if (order.in_call_queue || callStatusOf(order) === "calling") {
          return false
        }
      }

      if (listFilter === "queued" && !order.in_call_queue) {
        return false
      }

      if (!query) {
        return true
      }

      return [order.name, order.phone, order.city, order.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [orders, search, listFilter])

  const ordersById = useMemo(() => {
    const map = new Map<string, QueueOrder>()

    orders.forEach((order) => map.set(String(order.id), order))

    return map
  }, [orders])

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const allVisibleSelected =
    visibleOrders.length > 0 &&
    visibleOrders.every((order) => selected.has(order.id))

  function toggleSelectAllVisible() {
    setSelected((current) => {
      const next = new Set(current)

      if (allVisibleSelected) {
        visibleOrders.forEach((order) => next.delete(order.id))
      } else {
        visibleOrders.forEach((order) => next.add(order.id))
      }

      return next
    })
  }

  async function updateOrders(ids: string[], patch: Record<string, unknown>) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)

      const { error: updateError } = await supabaseClient
        .from("orders")
        .update(patch)
        .in("id", chunk)

      if (updateError) {
        throw updateError
      }
    }
  }

  async function runAction(
    key: string,
    action: () => Promise<string | void>
  ) {
    try {
      setBusy(key)
      setError("")

      const text = await action()

      await refresh(true)

      if (text) {
        showMessage(text)
      }
    } catch (err: any) {
      console.error(`Calling action "${key}" failed:`, err)

      showError(err?.message || "Something went wrong.")
    } finally {
      setBusy(null)
    }
  }

  function addToQueue(ids: string[], label: string) {
    const eligible = ids.filter((id) => {
      const order = ordersById.get(id)

      return (
        order && !order.in_call_queue && callStatusOf(order) !== "calling"
      )
    })

    if (eligible.length === 0) {
      showError("Nothing to add. Those orders are already in the queue.")
      return
    }

    runAction("add", async () => {
      await updateOrders(eligible, {
        in_call_queue: true,
        call_status: "not_called",
        call_attempts: 0,
        next_call_at: null,
      })

      setSelected(new Set())

      return `${eligible.length} order${eligible.length === 1 ? "" : "s"} added to the queue (${label}).`
    })
  }

  function removeFromQueue(ids: string[]) {
    const eligible = ids.filter((id) => {
      const order = ordersById.get(id)

      return order && order.in_call_queue && callStatusOf(order) !== "calling"
    })

    if (eligible.length === 0) {
      showError("Nothing to remove.")
      return
    }

    runAction("remove", async () => {
      await updateOrders(eligible, { in_call_queue: false })

      setSelected(new Set())

      return `${eligible.length} order${eligible.length === 1 ? "" : "s"} removed from the queue.`
    })
  }

  function startQueue() {
    if (waitingToCall.length === 0 && callingNow.length === 0) {
      showError("Add orders to the queue before starting.")
      return
    }

    runAction("start", async () => {
      const { error: startError } = await supabaseClient
        .from("calling_state")
        .update({
          running: true,
          paused_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)

      if (startError) {
        throw startError
      }

      return "Queue started. The phone app will begin calling."
    })
  }

  function stopQueue() {
    runAction("stop", async () => {
      const { error: stopError } = await supabaseClient
        .from("calling_state")
        .update({
          running: false,
          paused_reason: "manual",
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)

      if (stopError) {
        throw stopError
      }

      return "Queue stopped. A call already in progress will finish."
    })
  }

  function confirmAnswered(order: QueueOrder) {
    runAction(`confirm-${order.id}`, async () => {
      const { error: confirmError } = await supabaseClient
        .from("orders")
        .update({ order_status: "confirmed", in_call_queue: false })
        .eq("id", order.id)

      if (confirmError) {
        throw confirmError
      }

      return `Order of ${order.name} confirmed.`
    })
  }

  function callBackLater(order: QueueOrder) {
    runAction(`callback-${order.id}`, async () => {
      await updateOrders([order.id], {
        call_status: "callback",
        in_call_queue: true,
        next_call_at: new Date(Date.now() + 30 * 60000).toISOString(),
      })

      return `${order.name} will be called back in about 30 minutes.`
    })
  }

  function cancelAnswered(order: QueueOrder) {
    if (!window.confirm(`Cancel order of ${order.name}?`)) {
      return
    }

    runAction(`cancel-${order.id}`, async () => {
      const { error: cancelError } = await supabaseClient
        .from("orders")
        .update({ order_status: "cancelled", in_call_queue: false })
        .eq("id", order.id)

      if (cancelError) {
        throw cancelError
      }

      return `Order of ${order.name} cancelled.`
    })
  }

  function saveSettings() {
    if (!settingsDraft) {
      return
    }

    const ring = Number(settingsDraft.ring)
    const maxTries = Number(settingsDraft.attempts)
    const retry = Number(settingsDraft.retry)

    if (!(ring >= 20 && ring <= 120)) {
      showError("Ring time must be between 20 and 120 seconds.")
      return
    }

    if (!(maxTries >= 1 && maxTries <= 10)) {
      showError("Attempts must be between 1 and 10.")
      return
    }

    if (!(retry >= 5 && retry <= 1440)) {
      showError("Retry delay must be between 5 and 1440 minutes.")
      return
    }

    runAction("settings", async () => {
      const { error: settingsError } = await supabaseClient
        .from("calling_state")
        .update({
          ring_timeout_seconds: ring,
          max_attempts: maxTries,
          retry_after_minutes: retry,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)

      if (settingsError) {
        throw settingsError
      }

      return "Calling settings saved."
    })
  }

  const running = !!state?.running
  const pausedByAnswer = !running && state?.paused_reason === "answered"
  const currentCall = callingNow[0]

  return (
    <div className="min-h-screen bg-[#f6f5f2] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1400px]">

        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Calling Queue
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Auto-call pending orders from your phone, one customer at a time
            </p>
          </div>

          <button
            onClick={() => refresh(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading calling queue...
            </div>
          </div>
        ) : !state ? (
          <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
            Could not load the calling settings. Make sure you ran both SQL
            migrations (calling-migration.sql and calling-migration-2.sql) in
            Supabase.
          </div>
        ) : (
          <>
            {/* CONTROL */}

            <div className="mb-5 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${
                      running
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : pausedByAnswer
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-gray-200 bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        running
                          ? "animate-pulse bg-emerald-500"
                          : pausedByAnswer
                            ? "bg-amber-500"
                            : "bg-gray-400"
                      }`}
                    />
                    {running
                      ? "Running"
                      : pausedByAnswer
                        ? "Stopped: customer answered"
                        : "Stopped"}
                  </span>

                  <span className="text-xs text-gray-500">
                    Ring {state.ring_timeout_seconds}s · {state.max_attempts}{" "}
                    attempts · retry after {state.retry_after_minutes} min
                  </span>
                </div>

                {running ? (
                  <button
                    onClick={stopQueue}
                    disabled={busy === "stop"}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {busy === "stop" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    Stop Calling
                  </button>
                ) : (
                  <button
                    onClick={startQueue}
                    disabled={busy === "start"}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy === "start" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start Calling
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["Not in queue", notInQueue.length, "text-gray-900"],
                  ["Waiting to call", waitingToCall.length, "text-amber-600"],
                  ["Calling now", callingNow.length, "text-sky-600"],
                  ["Answered", answeredOrders.length, "text-emerald-600"],
                  ["Gave up", gaveUp.length, "text-rose-600"],
                ].map(([label, value, color]) => (
                  <div key={label as string} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      {label}
                    </p>
                    <p className={`mt-1 text-2xl font-black ${color}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CALLING NOW */}

            <div className="mb-5">
              {currentCall ? (
                <div className="overflow-hidden rounded-xl border-2 border-sky-300 bg-white shadow-sm">
                  <div className="flex items-center gap-2 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-700">
                    <PhoneCall className="h-4 w-4 animate-pulse" />
                    Calling now · attempt {Number(currentCall.call_attempts || 1)}{" "}
                    of {maxAttempts}
                  </div>

                  <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
                    <div>
                      <p className="text-xl font-black text-gray-900">
                        {currentCall.name}
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-700">
                        {currentCall.phone}
                      </p>

                      <div className="mt-3 flex items-start gap-1.5 text-sm text-gray-600">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span>
                          {currentCall.address},{" "}
                          <span className="font-semibold">
                            {currentCall.city}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <p className="text-xs font-semibold text-gray-500">
                        Order
                      </p>

                      <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">
                        {itemsSummary(currentCall)}
                      </p>

                      <p className="mt-3 text-sm text-gray-500">
                        Cash on delivery:{" "}
                        <span className="text-lg font-black text-gray-900">
                          Rs. {formatPrice(currentCall.total)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                  {running
                    ? waitingToCall.length > 0
                      ? "Waiting for the phone app to pick up the next customer..."
                      : "No one is due for a call right now."
                    : pausedByAnswer
                      ? "Queue stopped because a customer answered. Handle them below, then press Start Calling to continue."
                      : "Queue is stopped. Add orders below and press Start Calling."}
                </div>
              )}
            </div>

            {/* ANSWERED, NEEDS ACTION */}

            {answeredOrders.length > 0 && (
              <div className="mb-5">
                <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                  <PhoneIncoming className="h-5 w-5 text-emerald-600" />
                  Customers who answered ({answeredOrders.length})
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {answeredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border-2 border-emerald-200 bg-white p-4 shadow-sm"
                    >
                      <p className="font-bold text-gray-900">{order.name}</p>

                      <a
                        href={`tel:${order.phone}`}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
                      >
                        <Phone className="h-4 w-4" />
                        {order.phone}
                      </a>

                      <p className="mt-3 line-clamp-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        {itemsSummary(order)}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {order.address},{" "}
                        <span className="font-semibold">{order.city}</span>
                      </p>

                      <p className="mt-2 text-base font-black text-gray-900">
                        Rs. {formatPrice(order.total)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => confirmAnswered(order)}
                          disabled={busy === `confirm-${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirm order
                        </button>

                        <button
                          onClick={() => callBackLater(order)}
                          disabled={busy === `callback-${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Call back later
                        </button>

                        <button
                          onClick={() => cancelAnswered(order)}
                          disabled={busy === `cancel-${order.id}`}
                          title="Cancel order"
                          className="ml-auto rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ORDER SELECTION */}

            <div className="mb-5 rounded-xl border bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">

                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, phone, city, address..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {(
                    [
                      ["available", "Not in queue"],
                      ["queued", "In queue"],
                      ["all", "All pending"],
                    ] as [ListFilter, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setListFilter(value)}
                      className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                        listFilter === value
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 px-3 py-2.5">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-4 w-4"
                  />
                  Select all shown ({visibleOrders.length})
                </label>

                <span className="text-xs text-gray-400">
                  {selected.size} selected
                </span>

                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    onClick={() => addToQueue(Array.from(selected), "selected")}
                    disabled={selected.size === 0 || busy === "add"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add selected
                  </button>

                  <button
                    onClick={() =>
                      addToQueue(
                        notInQueue.map((order) => order.id),
                        "all pending"
                      )
                    }
                    disabled={notInQueue.length === 0 || busy === "add"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add all pending ({notInQueue.length})
                  </button>

                  <button
                    onClick={() => removeFromQueue(Array.from(selected))}
                    disabled={selected.size === 0 || busy === "remove"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove selected
                  </button>
                </div>
              </div>

              {visibleOrders.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-500">
                  No orders match this view.
                </div>
              ) : (
                <div className="max-h-[560px] divide-y overflow-y-auto">
                  {visibleOrders.map((order) => {
                    const status = callStatusOf(order)
                    const style = STATUS_STYLES[status]

                    return (
                      <label
                        key={order.id}
                        className="flex cursor-pointer items-start gap-3 px-3 py-3 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(order.id)}
                          onChange={() => toggleSelected(order.id)}
                          className="mt-1 h-4 w-4 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-bold text-gray-900">
                              {order.name}
                            </span>

                            <span className="text-sm font-semibold text-blue-700">
                              {order.phone}
                            </span>

                            <span className="text-xs text-gray-500">
                              {order.city}
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-1 text-xs text-gray-600">
                            {itemsSummary(order)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-black text-gray-900">
                            Rs. {formatPrice(order.total)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {order.in_call_queue && (
                              <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                                In queue
                              </span>
                            )}

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style.classes}`}
                            >
                              {style.label}
                              {Number(order.call_attempts || 0) > 0
                                ? ` ${Number(order.call_attempts)}/${maxAttempts}`
                                : ""}
                            </span>
                          </div>

                          {order.next_call_at && order.in_call_queue && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                              <Clock3 className="h-3 w-3" />
                              Next: {formatWhen(order.next_call_at)}
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* RECENT CALLS */}

            <div className="mb-5 rounded-xl border bg-white shadow-sm">
              <div className="border-b px-4 py-3 font-bold text-gray-900">
                Recent calls
              </div>

              {attempts.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No calls yet.
                </div>
              ) : (
                <div className="divide-y">
                  {attempts.map((attempt) => {
                    const order = ordersById.get(String(attempt.order_id))

                    return (
                      <div
                        key={attempt.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm"
                      >
                        <span className="w-28 text-xs text-gray-500">
                          {formatWhen(attempt.started_at)}
                        </span>

                        <span className="font-semibold text-gray-900">
                          {order?.name || attempt.phone}
                        </span>

                        <span className="text-xs text-gray-500">
                          {order ? attempt.phone : ""} · attempt{" "}
                          {attempt.attempt_number}
                        </span>

                        <span
                          className={`ml-auto text-xs font-bold uppercase ${
                            OUTCOME_CLASSES[attempt.outcome] || "text-gray-600"
                          }`}
                        >
                          {attempt.outcome.replace("_", " ")}
                          {attempt.talk_seconds > 0
                            ? ` · ${attempt.talk_seconds}s`
                            : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* SETTINGS */}

            {settingsDraft && (
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                  <Settings className="h-4 w-4 text-gray-500" />
                  Calling rules
                </h2>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Ring time (seconds)
                    </label>
                    <input
                      type="number"
                      value={settingsDraft.ring}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          ring: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Max attempts per customer
                    </label>
                    <input
                      type="number"
                      value={settingsDraft.attempts}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          attempts: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">
                      Retry after (minutes)
                    </label>
                    <input
                      type="number"
                      value={settingsDraft.retry}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          retry: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={busy === "settings"}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {busy === "settings" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save rules
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}