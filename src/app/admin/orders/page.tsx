"use client"

import { useEffect, useMemo, useState } from "react"
import { supabaseClient } from "@/utils/supabase/client"
import {
  Search,
  RefreshCw,
  Package,
  CheckCircle2,
  Clock3,
  Truck,
  Trash2,
  Pencil,
  X,
  Save,
  MapPin,
  Phone,
  User,
  CalendarDays,
  ExternalLink,
  AlertCircle,
  Loader2,
  Ban,
  Hash,
  Plus,
  Wrench,
} from "lucide-react"

type OrderStatus =
  | "pending"
  | "confirmed"
  | "cancelled"

type OrderItem = {
  id?: string
  name?: string
  price?: number
  quantity?: number
  color?: string | null
  size?: string | null
  image?: string | null
  category?: string | null
}

type Order = {
  id: string
  name: string
  phone: string
  email?: string | null
  city: string
  address: string
  items: OrderItem[]
  total: number
  dispatched: boolean

  order_status?: OrderStatus | null

  created_at: string

  tracking_number?: string | null
  courier_provider?: string | null

  transaction_status?: string | null
  transaction_notes?: string | null

  bike_specifications?: string | null

  delivery_date?: string | null
  pickup_date?: string | null

  latitude?: number | null
  longitude?: number | null
}

type FilterStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "dispatched"

const PAGE_SIZE = 50

const RAIN_CATEGORIES = [
  "rain suit",
  "rain coat",
]

function isRainCategoryOrder(order: Order) {
  return order.items?.some((item) => {
    const category = String(item.category || "").toLowerCase()
    const name = String(item.name || "").toLowerCase()

    return RAIN_CATEGORIES.some(
      (rainCategory) =>
        category.includes(rainCategory) ||
        name.includes(rainCategory)
    )
  })
}

function getOrderStatus(order: Order): OrderStatus {
  if (order.order_status === "confirmed") {
    return "confirmed"
  }

  if (order.order_status === "cancelled") {
    return "cancelled"
  }

  return "pending"
}

function getStatusLabel(order: Order) {
  if (order.dispatched) {
    return "Dispatched"
  }

  const status = getOrderStatus(order)

  if (status === "confirmed") {
    return "Confirmed"
  }

  if (status === "cancelled") {
    return "Cancelled"
  }

  return "Pending"
}

function getStatusClasses(order: Order) {
  if (order.dispatched) {
    return "bg-blue-50 text-blue-700 border-blue-200"
  }

  const status = getOrderStatus(order)

  if (status === "confirmed") {
    return "bg-green-50 text-green-700 border-green-200"
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700 border-red-200"
  }

  return "bg-orange-50 text-orange-700 border-orange-200"
}

// Left accent stripe + card ring color per order state — this is the primary
// way orders are told apart at a glance, so it needs to read before the badge does.
function getAccentClasses(order: Order) {
  if (order.dispatched) {
    return { stripe: "bg-sky-500", ring: "hover:border-sky-200" }
  }

  const status = getOrderStatus(order)

  if (status === "confirmed") {
    return { stripe: "bg-emerald-500", ring: "hover:border-emerald-200" }
  }

  if (status === "cancelled") {
    return { stripe: "bg-rose-500", ring: "hover:border-rose-200" }
  }

  return { stripe: "bg-amber-500", ring: "hover:border-amber-200" }
}

function getProductDetails(order: Order) {
  if (!order.items?.length) {
    return "Order"
  }

  return order.items
    .map((item) => {
      const parts = [
        item.name || "Product",
        item.quantity ? `x${item.quantity}` : "",
        item.color ? `Color: ${item.color}` : "",
        item.size ? `Size: ${item.size}` : "",
      ].filter(Boolean)

      return parts.join(" - ")
    })
    .join(", ")
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-PK").format(
    Number(value || 0)
  )
}

function formatDate(date: string) {
  if (!date) {
    return "-"
  }

  return new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

// Compact, front-and-center version for the card header: "Today · 4:32 PM"
function formatCardDate(dateStr: string) {
  if (!dateStr) {
    return "-"
  }

  const date = new Date(dateStr)
  const now = new Date()

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const time = date.toLocaleTimeString("en-PK", {
    hour: "numeric",
    minute: "2-digit",
  })

  if (isSameDay(date, now)) return `Today · ${time}`
  if (isSameDay(date, yesterday)) return `Yesterday · ${time}`

  const day = date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })

  return `${day} · ${time}`
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [search, setSearch] = useState("")

  const [filterStatus, setFilterStatus] =
    useState<FilterStatus>("all")

  const [page, setPage] = useState(1)

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null)

  const [editingOrder, setEditingOrder] =
    useState<Order | null>(null)

  const [actionLoading, setActionLoading] =
    useState<string | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, filterStatus])

  async function fetchOrders(showRefresh = false) {
    try {
      setError("")

      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const allOrders: Order[] = []

      let from = 0
      const batchSize = 1000

      while (true) {
        const { data, error } = await supabaseClient
          .from("orders")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .range(
            from,
            from + batchSize - 1
          )

        if (error) {
          throw error
        }

        if (!data || data.length === 0) {
          break
        }

        allOrders.push(
          ...(data as Order[])
        )

        if (data.length < batchSize) {
          break
        }

        from += batchSize
      }

      /*
       * IMPORTANT:
       * Explicitly type the result as Order[]
       * so TypeScript doesn't convert order_status
       * into a generic string.
       */

      const normalizedOrders: Order[] =
        allOrders.map((order) => {
          let status: OrderStatus = "pending"

          if (
            order.order_status ===
            "confirmed"
          ) {
            status = "confirmed"
          } else if (
            order.order_status ===
            "cancelled"
          ) {
            status = "cancelled"
          }

          return {
            ...order,
            items: Array.isArray(order.items)
              ? order.items
              : [],
            order_status: status,
          }
        })

      setOrders(normalizedOrders)
    } catch (err: any) {
      console.error(
        "Failed to fetch orders:",
        err
      )

      setError(
        err?.message ||
          "Failed to load orders."
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    return orders.filter((order) => {
      const status =
        getOrderStatus(order)

      let statusMatch = true

      if (filterStatus === "pending") {
        statusMatch =
          !order.dispatched &&
          status === "pending"
      }

      if (filterStatus === "confirmed") {
        statusMatch =
          !order.dispatched &&
          status === "confirmed"
      }

      if (filterStatus === "cancelled") {
        statusMatch =
          !order.dispatched &&
          status === "cancelled"
      }

      if (filterStatus === "dispatched") {
        statusMatch = order.dispatched
      }

      if (!statusMatch) {
        return false
      }

      if (!query) {
        return true
      }

      const searchable = [
        order.id,
        order.name,
        order.phone,
        order.email,
        order.city,
        order.address,
        order.tracking_number,
        getProductDetails(order),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [
    orders,
    search,
    filterStatus,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length /
        PAGE_SIZE
    )
  )

  const currentPageOrders =
    filteredOrders.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    )

  const stats = useMemo(() => {
    const pending =
      orders.filter(
        (order) =>
          !order.dispatched &&
          getOrderStatus(order) ===
            "pending"
      ).length

    const confirmed =
      orders.filter(
        (order) =>
          !order.dispatched &&
          getOrderStatus(order) ===
            "confirmed"
      ).length

    const cancelled =
      orders.filter(
        (order) =>
          !order.dispatched &&
          getOrderStatus(order) ===
            "cancelled"
      ).length

    const dispatched =
      orders.filter(
        (order) => order.dispatched
      ).length

    return {
      total: orders.length,
      pending,
      confirmed,
      cancelled,
      dispatched,
    }
  }, [orders])

  function showMessage(text: string) {
    setMessage(text)

    setTimeout(() => {
      setMessage("")
    }, 4000)
  }

  function showError(text: string) {
    setError(text)

    setTimeout(() => {
      setError("")
    }, 5000)
  }

  /*
   * MANUAL CONFIRMATION
   *
   * Admin can manually confirm an order.
   */

  async function manuallyConfirmOrder(
    order: Order
  ) {
    if (order.dispatched) {
      showError(
        "This order is already dispatched."
      )
      return
    }

    if (
      getOrderStatus(order) ===
      "confirmed"
    ) {
      showMessage(
        "This order is already confirmed."
      )
      return
    }

    if (
      getOrderStatus(order) ===
      "cancelled"
    ) {
      showError(
        "Cancelled orders cannot be confirmed."
      )
      return
    }

    try {
      setActionLoading(
        `confirm-${order.id}`
      )

      const { error } =
        await supabaseClient
          .from("orders")
          .update({
            order_status:
              "confirmed",
          })
          .eq("id", order.id)

      if (error) {
        throw error
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                order_status:
                  "confirmed",
              }
            : item
        )
      )

      if (
        selectedOrder?.id ===
        order.id
      ) {
        setSelectedOrder({
          ...selectedOrder,
          order_status:
            "confirmed",
        })
      }

      showMessage(
        "Order manually confirmed."
      )
    } catch (err: any) {
      console.error(
        "Manual confirmation error:",
        err
      )

      showError(
        err?.message ||
          "Failed to confirm order."
      )
    } finally {
      setActionLoading(null)
    }
  }

  /*
   * MANUAL CANCELLATION
   */

  async function cancelOrder(
    order: Order
  ) {
    if (order.dispatched) {
      showError(
        "A dispatched order cannot be cancelled from here."
      )
      return
    }

    if (
      getOrderStatus(order) ===
      "cancelled"
    ) {
      return
    }

    const confirmed =
      window.confirm(
        `Cancel order of ${order.name}?`
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(
        `cancel-${order.id}`
      )

      const { error } =
        await supabaseClient
          .from("orders")
          .update({
            order_status:
              "cancelled",
          })
          .eq("id", order.id)

      if (error) {
        throw error
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                order_status:
                  "cancelled",
              }
            : item
        )
      )

      if (
        selectedOrder?.id ===
        order.id
      ) {
        setSelectedOrder({
          ...selectedOrder,
          order_status:
            "cancelled",
        })
      }

      showMessage(
        "Order cancelled."
      )
    } catch (err: any) {
      console.error(
        "Cancel order error:",
        err
      )

      showError(
        err?.message ||
          "Failed to cancel order."
      )
    } finally {
      setActionLoading(null)
    }
  }

  /*
   * BOOK SHIPMENT
   */

  async function bookShipment(
    order: Order
  ) {
    if (order.dispatched) {
      showError(
        "This order has already been booked."
      )
      return
    }

    if (
      getOrderStatus(order) !==
      "confirmed"
    ) {
      showError(
        "Please confirm the order before booking shipment."
      )
      return
    }

    const isRainOrder =
      isRainCategoryOrder(order)

    /*
     * Rain Suit / Rain Coat:
     * Always PostEx + KHAN_ZAIB.
     */

    const effectiveProvider =
      isRainOrder
        ? "postex"
        : order.courier_provider ||
          "postex"

    const accountKey =
      isRainOrder
        ? "KHAN_ZAIB"
        : undefined

    try {
      setActionLoading(
        `book-${order.id}`
      )

      setError("")

      const totalItems =
        order.items?.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity || 1
            ),
          0
        ) || 1

      const totalWeight = Math.max(
        totalItems * 0.3,
        0.5
      )

      const orderDetail =
        getProductDetails(order)

      const payload: Record<
        string,
        any
      > = {
        orderId: order.id,

        orderRefNumber:
          `BIN-${order.id
            .slice(0, 8)
            .toUpperCase()}`,

        invoicePayment:
          String(order.total),

        orderDetail,

        customerName:
          order.name,

        customerPhone:
          order.phone,

        deliveryAddress:
          order.address,

        transactionNotes:
          "Allowed To Open",

        cityName:
          order.city,

        invoiceDivision: 1,

        items: totalItems,

        weight: totalWeight,

        orderType: "Normal",

        pickupAddressCode:
          "001",

        pickupAddress:
          "House # 44 5/f1 Orangi Town Karachi",
      }

      if (accountKey) {
        payload.accountKey =
          accountKey
      }

      const endpoint =
        effectiveProvider ===
        "nextstep"
          ? "/api/nextstep/create"
          : "/api/postex/create"

      console.log(
        "Courier booking:",
        {
          endpoint,
          provider:
            effectiveProvider,
          payload,
        }
      )

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result?.statusMessage ||
            result?.message ||
            "Courier booking failed."
        )
      }

      console.log(
        "Courier response:",
        result
      )

      const dist =
        result?.dist || {}

      const trackingNumber =
        dist?.trackingNumber ||
        dist?.tracking_number ||
        dist?.trackingNo ||
        dist?.order
          ?.trackingNumber ||
        dist?.order
          ?.tracking_number ||
        result?.trackingNumber ||
        result?.tracking_number ||
        null

      const updatePayload: Record<
        string,
        unknown
      > = {
        dispatched: true,
        order_status:
          "confirmed",
        tracking_number:
          trackingNumber,
        courier_provider:
          effectiveProvider,
      }

      let {
        error: updateError,
      } =
        await supabaseClient
          .from("orders")
          .update(
            updatePayload
          )
          .eq("id", order.id)

      /*
       * Compatibility fallback if
       * courier_provider doesn't exist.
       */

      if (
        updateError &&
        updateError.message
          ?.toLowerCase()
          .includes(
            "courier_provider"
          )
      ) {
        const fallbackPayload = {
          dispatched: true,
          order_status:
            "confirmed",
          tracking_number:
            trackingNumber,
        }

        const fallback =
          await supabaseClient
            .from("orders")
            .update(
              fallbackPayload
            )
            .eq("id", order.id)

        updateError =
          fallback.error
      }

      if (updateError) {
        throw updateError
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                dispatched: true,
                order_status:
                  "confirmed",
                tracking_number:
                  trackingNumber,
                courier_provider:
                  effectiveProvider,
              }
            : item
        )
      )

      if (
        selectedOrder?.id ===
        order.id
      ) {
        setSelectedOrder({
          ...selectedOrder,
          dispatched: true,
          order_status:
            "confirmed",
          tracking_number:
            trackingNumber,
          courier_provider:
            effectiveProvider,
        })
      }

      showMessage(
        trackingNumber
          ? `Shipment booked successfully. Tracking: ${trackingNumber}`
          : "Shipment booked successfully."
      )
    } catch (err: any) {
      console.error(
        "Courier booking error:",
        err
      )

      showError(
        err?.message ||
          "Unable to book shipment."
      )
    } finally {
      setActionLoading(null)
    }
  }

  /*
   * DELETE
   */

  async function deleteOrder(
    order: Order
  ) {
    const confirmed =
      window.confirm(
        `Delete order of ${order.name}?\n\nThis action cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    try {
      setActionLoading(
        `delete-${order.id}`
      )

      const { error } =
        await supabaseClient
          .from("orders")
          .delete()
          .eq("id", order.id)

      if (error) {
        throw error
      }

      setOrders((current) =>
        current.filter(
          (item) =>
            item.id !== order.id
        )
      )

      if (
        selectedOrder?.id ===
        order.id
      ) {
        setSelectedOrder(null)
      }

      showMessage(
        "Order deleted successfully."
      )
    } catch (err: any) {
      console.error(
        "Delete order error:",
        err
      )

      showError(
        err?.message ||
          "Failed to delete order."
      )
    } finally {
      setActionLoading(null)
    }
  }

  /*
   * EDIT
   */

  async function saveEdit() {
    if (!editingOrder) {
      return
    }

    try {
      setActionLoading(
        `edit-${editingOrder.id}`
      )

      const cleanedItems = (
        editingOrder.items || []
      ).map((item) => ({
        ...item,
        price: Number(item.price || 0),
        quantity: Number(
          item.quantity || 1
        ),
      }))

      const updatePayload = {
        name: editingOrder.name,
        phone: editingOrder.phone,
        email:
          editingOrder.email ||
          null,
        city: editingOrder.city,
        address:
          editingOrder.address,
        total: Number(
          editingOrder.total
        ),
        bike_specifications:
          editingOrder.bike_specifications ||
          null,
        items: cleanedItems,
      }

      const {
        data,
        error,
      } = await supabaseClient
        .from("orders")
        .update(updatePayload)
        .eq("id", editingOrder.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setOrders((current) =>
        current.map((order) =>
          order.id ===
          editingOrder.id
            ? {
                ...order,
                ...(data as Order),
              }
            : order
        )
      )

      setEditingOrder(null)

      if (
        selectedOrder?.id ===
        editingOrder.id
      ) {
        setSelectedOrder({
          ...selectedOrder,
          ...(data as Order),
        })
      }

      showMessage(
        "Order updated successfully."
      )
    } catch (err: any) {
      console.error(
        "Edit order error:",
        err
      )

      showError(
        err?.message ||
          "Failed to update order."
      )
    } finally {
      setActionLoading(null)
    }
  }

  /*
   * ITEM EDITING (inside the edit modal)
   *
   * Lets the admin change or remove individual products
   * within a multi-product order, or add a new one.
   */

  function updateEditingItem(
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) {
    if (!editingOrder) {
      return
    }

    const items = [
      ...(editingOrder.items || []),
    ]

    items[index] = {
      ...items[index],
      [field]: value,
    }

    setEditingOrder({
      ...editingOrder,
      items,
    })
  }

  function removeEditingItem(
    index: number
  ) {
    if (!editingOrder) {
      return
    }

    const items = (
      editingOrder.items || []
    ).filter(
      (_, itemIndex) =>
        itemIndex !== index
    )

    setEditingOrder({
      ...editingOrder,
      items,
    })
  }

  function addEditingItem() {
    if (!editingOrder) {
      return
    }

    setEditingOrder({
      ...editingOrder,
      items: [
        ...(editingOrder.items ||
          []),
        {
          name: "",
          price: 0,
          quantity: 1,
          color: "",
          size: "",
        },
      ],
    })
  }

  function openGoogleMaps(
    order: Order
  ) {
    if (
      order.latitude !==
        null &&
      order.latitude !==
        undefined &&
      order.longitude !==
        null &&
      order.longitude !==
        undefined
    ) {
      window.open(
        `https://www.google.com/maps?q=${order.latitude},${order.longitude}`,
        "_blank"
      )

      return
    }

    const address =
      encodeURIComponent(
        `${order.address}, ${order.city}, Pakistan`
      )

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${address}`,
      "_blank"
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f5f2] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Dispatch Board
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Every order, its status, and what it needs next
            </p>
          </div>

          <button
            onClick={() =>
              fetchOrders(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* SUCCESS */}

        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            {message}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* STATS — each tile carries the same accent color as the cards it filters to */}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">

          <button
            onClick={() =>
              setFilterStatus("all")
            }
            className={`rounded-xl border-2 bg-white p-4 text-left shadow-sm transition ${
              filterStatus === "all"
                ? "border-gray-900"
                : "border-transparent hover:border-gray-200"
            }`}
          >
            <p className="text-xs font-semibold text-gray-500">
              All orders
            </p>

            <p className="mt-1 text-2xl font-black text-gray-900">
              {stats.total}
            </p>
          </button>

          <button
            onClick={() =>
              setFilterStatus("pending")
            }
            className={`rounded-xl border-2 bg-white p-4 text-left shadow-sm transition ${
              filterStatus === "pending"
                ? "border-amber-500"
                : "border-transparent hover:border-amber-200"
            }`}
          >
            <p className="text-xs font-semibold text-amber-600">
              Pending
            </p>

            <p className="mt-1 text-2xl font-black text-gray-900">
              {stats.pending}
            </p>
          </button>

          <button
            onClick={() =>
              setFilterStatus("confirmed")
            }
            className={`rounded-xl border-2 bg-white p-4 text-left shadow-sm transition ${
              filterStatus === "confirmed"
                ? "border-emerald-500"
                : "border-transparent hover:border-emerald-200"
            }`}
          >
            <p className="text-xs font-semibold text-emerald-600">
              Confirmed
            </p>

            <p className="mt-1 text-2xl font-black text-gray-900">
              {stats.confirmed}
            </p>
          </button>

          <button
            onClick={() =>
              setFilterStatus("cancelled")
            }
            className={`rounded-xl border-2 bg-white p-4 text-left shadow-sm transition ${
              filterStatus === "cancelled"
                ? "border-rose-500"
                : "border-transparent hover:border-rose-200"
            }`}
          >
            <p className="text-xs font-semibold text-rose-600">
              Cancelled
            </p>

            <p className="mt-1 text-2xl font-black text-gray-900">
              {stats.cancelled}
            </p>
          </button>

          <button
            onClick={() =>
              setFilterStatus(
                "dispatched"
              )
            }
            className={`rounded-xl border-2 bg-white p-4 text-left shadow-sm transition ${
              filterStatus === "dispatched"
                ? "border-sky-500"
                : "border-transparent hover:border-sky-200"
            }`}
          >
            <p className="text-xs font-semibold text-sky-600">
              Dispatched
            </p>

            <p className="mt-1 text-2xl font-black text-gray-900">
              {stats.dispatched}
            </p>
          </button>
        </div>

        {/* SEARCH */}

        <div className="mb-5 rounded-xl border bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search name, phone, city, address, tracking..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">

              {[
                ["all", "All"],
                ["pending", "Pending"],
                ["confirmed", "Confirmed"],
                ["cancelled", "Cancelled"],
                [
                  "dispatched",
                  "Dispatched",
                ],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() =>
                      setFilterStatus(
                        value as FilterStatus
                      )
                    }
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                      filterStatus ===
                      value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* ORDER CARDS — one box per order, same layout at every screen size */}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading orders...
            </div>
          </div>
        ) : currentPageOrders.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border bg-white text-center shadow-sm">
            <Package className="mb-3 h-10 w-10 text-gray-300" />

            <h3 className="font-semibold text-gray-900">
              No orders found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              No orders match the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {currentPageOrders.map(
              (order) => {
                const status =
                  getOrderStatus(order)

                const accent =
                  getAccentClasses(order)

                const confirming =
                  actionLoading ===
                  `confirm-${order.id}`

                const cancelling =
                  actionLoading ===
                  `cancel-${order.id}`

                const booking =
                  actionLoading ===
                  `book-${order.id}`

                return (
                  <div
                    key={order.id}
                    className={`flex overflow-hidden rounded-xl border-2 border-gray-100 bg-white shadow-sm transition ${accent.ring}`}
                  >
                    {/* status stripe */}
                    <div className={`w-1.5 shrink-0 ${accent.stripe}`} />

                    <div className="flex flex-1 flex-col p-4">

                      {/* date first, bold and unmissable */}
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-900">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          {formatCardDate(order.created_at)}
                        </span>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            order
                          )}`}
                        >
                          {order.dispatched ? (
                            <Truck className="h-3.5 w-3.5" />
                          ) : status === "confirmed" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : status === "cancelled" ? (
                            <Ban className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}

                          {getStatusLabel(order)}
                        </span>
                      </div>

                      {/* customer */}
                      <button
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                        className="text-left"
                      >
                        <p className="truncate font-bold text-gray-900 hover:text-orange-600">
                          {order.name}
                        </p>
                      </button>

                      <a
                        href={`tel:${order.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
                      >
                        <Phone className="h-4 w-4" />
                        {order.phone}
                      </a>

                      {/* product */}
                      <p className="mt-3 line-clamp-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        {getProductDetails(order)}
                      </p>

                      {/* address */}
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="line-clamp-2">
                          {order.address}, <span className="font-semibold text-gray-600">{order.city}</span>
                        </span>
                      </div>

                      {/* courier / tracking */}
                      {(order.courier_provider || order.tracking_number) && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          {order.courier_provider && (
                            <span className="font-semibold uppercase text-gray-600">
                              {order.courier_provider}
                            </span>
                          )}
                          {order.tracking_number && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-mono text-blue-700">
                              <Hash className="h-3 w-3" />
                              {order.tracking_number}
                            </span>
                          )}
                        </div>
                      )}

                      {/* amount */}
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                        <span className="text-xs font-semibold text-gray-500">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-base font-black text-gray-900">
                          Rs. {formatPrice(order.total)}
                        </span>
                      </div>

                      {/* actions */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">

                        {!order.dispatched && status === "pending" && (
                          <button
                            onClick={() => manuallyConfirmOrder(order)}
                            disabled={confirming}
                            title="Manually confirm order"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {confirming ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Confirm
                          </button>
                        )}

                        {!order.dispatched && status === "confirmed" && (
                          <button
                            onClick={() => bookShipment(order)}
                            disabled={booking}
                            title="Book courier shipment"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                          >
                            {booking ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Truck className="h-3.5 w-3.5" />
                            )}
                            Book
                          </button>
                        )}

                        {!order.dispatched && status !== "cancelled" && (
                          <button
                            onClick={() => cancelOrder(order)}
                            disabled={cancelling}
                            title="Cancel order"
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancelling ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrder(order)}
                          title="View details"
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          View
                        </button>

                        <button
                          onClick={() => setEditingOrder({ ...order })}
                          title="Edit"
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => deleteOrder(order)}
                          title="Delete"
                          className="ml-auto rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        )}

        {/* PAGINATION */}

        {!loading &&
          filteredOrders.length >
            0 && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">

              <p className="text-xs text-gray-500">
                Showing{" "}
                {(page - 1) *
                  PAGE_SIZE +
                  1}
                –
                {Math.min(
                  page *
                    PAGE_SIZE,
                  filteredOrders.length
                )}{" "}
                of{" "}
                {
                  filteredOrders.length
                }
              </p>

              <div className="flex items-center gap-2">

                <button
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      (p) =>
                        Math.max(
                          1,
                          p - 1
                        )
                    )
                  }
                  className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-xs text-gray-500">
                  Page {page} of{" "}
                  {totalPages}
                </span>

                <button
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (p) =>
                        Math.min(
                          totalPages,
                          p + 1
                        )
                    )
                  }
                  className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-40"
                >
                  Next
                </button>

              </div>
            </div>
          )}
      </div>

      {/* ORDER DETAILS */}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">

              <div>
                <h2 className="font-bold text-gray-900">
                  Order Details
                </h2>

                <p className="mt-1 font-mono text-xs text-gray-400">
                  {
                    selectedOrder.id
                  }
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingOrder({
                      ...selectedOrder,
                    })
                    setSelectedOrder(null)
                  }}
                  title="Edit order"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>

                <button
                  onClick={() =>
                    setSelectedOrder(
                      null
                    )
                  }
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

            </div>

            <div className="space-y-5 p-5">

              {/* CUSTOMER */}

              <div>
                <h3 className="mb-3 font-bold text-gray-900">
                  Customer
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="h-4 w-4" />
                      Name
                    </div>

                    <p className="mt-1 font-semibold">
                      {
                        selectedOrder.name
                      }
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-4 w-4" />
                      Phone
                    </div>

                    <a
                      href={`tel:${selectedOrder.phone}`}
                      className="mt-1 block text-lg font-bold text-blue-600 hover:underline"
                    >
                      {selectedOrder.phone}
                    </a>
                  </div>

                </div>
              </div>

              {/* ADDRESS */}

              <div>
                <h3 className="mb-3 font-bold">
                  Delivery Address
                </h3>

                <div className="rounded-lg bg-gray-50 p-3">

                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />

                    <div>
                      <p className="text-sm">
                        {
                          selectedOrder.address
                        }
                      </p>

                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {
                          selectedOrder.city
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      openGoogleMaps(
                        selectedOrder
                      )
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Maps
                  </button>

                </div>
              </div>

              {/* PRODUCTS */}

              <div>
                <h3 className="mb-3 font-bold">
                  Products
                </h3>

                <div className="divide-y rounded-lg border">

                  {selectedOrder.items?.map(
                    (item, index) => (
                      <div
                        key={`${item.id || item.name}-${index}`}
                        className="flex items-center justify-between gap-3 p-3"
                      >

                        <div>
                          <p className="font-medium">
                            {
                              item.name
                            }
                          </p>

                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">

                            {item.quantity && (
                              <span>
                                Qty:{" "}
                                {
                                  item.quantity
                                }
                              </span>
                            )}

                            {item.color && (
                              <span>
                                Color:{" "}
                                {
                                  item.color
                                }
                              </span>
                            )}

                            {item.size && (
                              <span>
                                Size:{" "}
                                {
                                  item.size
                                }
                              </span>
                            )}

                          </div>
                        </div>

                        <span className="font-semibold">
                          Rs.{" "}
                          {formatPrice(
                            Number(
                              item.price ||
                                0
                            ) *
                              Number(
                                item.quantity ||
                                  1
                              )
                          )}
                        </span>

                      </div>
                    )
                  )}

                  <div className="flex justify-between bg-gray-50 p-3">

                    <span className="font-bold">
                      Total
                    </span>

                    <span className="text-lg font-bold">
                      Rs.{" "}
                      {formatPrice(
                        selectedOrder.total
                      )}
                    </span>

                  </div>

                </div>
              </div>

              {/* BIKE SPECIFICATIONS */}

              {selectedOrder.bike_specifications && (
                <div>
                  <h3 className="mb-3 font-bold">
                    Bike Specifications
                  </h3>

                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                    <Wrench className="h-4 w-4 shrink-0 text-gray-400" />
                    {selectedOrder.bike_specifications}
                  </div>
                </div>
              )}

              {/* STATUS */}

              <div>
                <h3 className="mb-3 font-bold">
                  Status
                </h3>

                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                    selectedOrder
                  )}`}
                >
                  {getStatusLabel(
                    selectedOrder
                  )}
                </span>

                {selectedOrder.tracking_number && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">

                    <p className="text-xs text-blue-600">
                      Tracking Number
                    </p>

                    <p className="mt-1 font-mono font-bold text-blue-900">
                      {
                        selectedOrder.tracking_number
                      }
                    </p>

                  </div>
                )}
              </div>

              {/* ACTIONS */}

              <div className="border-t pt-4">

                {!selectedOrder.dispatched &&
                  getOrderStatus(
                    selectedOrder
                  ) ===
                    "pending" && (
                    <div className="flex flex-col gap-2 sm:flex-row">

                      <button
                        onClick={() =>
                          manuallyConfirmOrder(
                            selectedOrder
                          )
                        }
                        disabled={
                          actionLoading ===
                          `confirm-${selectedOrder.id}`
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Manual Confirm
                      </button>

                      <button
                        onClick={() =>
                          cancelOrder(
                            selectedOrder
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        <Ban className="h-5 w-5" />
                        Cancel Order
                      </button>

                    </div>
                  )}

                {!selectedOrder.dispatched &&
                  getOrderStatus(
                    selectedOrder
                  ) ===
                    "confirmed" && (
                    <button
                      onClick={() =>
                        bookShipment(
                          selectedOrder
                        )
                      }
                      disabled={
                        actionLoading ===
                        `book-${selectedOrder.id}`
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      {actionLoading ===
                      `book-${selectedOrder.id}` ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Truck className="h-5 w-5" />
                      )}

                      Book Shipment
                    </button>
                  )}

              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays className="h-4 w-4" />
                {formatDate(
                  selectedOrder.created_at
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}

      {editingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b px-5 py-4">

              <div>
                <h2 className="font-bold">
                  Edit Order
                </h2>

                <p className="text-xs text-gray-400">
                  Update customer information
                </p>
              </div>

              <button
                onClick={() =>
                  setEditingOrder(
                    null
                  )
                }
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-4 p-5">

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Customer Name
                </label>

                <input
                  value={
                    editingOrder.name
                  }
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      name: e.target
                        .value,
                    })
                  }
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Phone
                </label>

                <input
                  value={
                    editingOrder.phone
                  }
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      phone: e.target
                        .value,
                    })
                  }
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Email
                </label>

                <input
                  value={
                    editingOrder.email ||
                    ""
                  }
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      email: e.target
                        .value,
                    })
                  }
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  City
                </label>

                <input
                  value={
                    editingOrder.city
                  }
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      city: e.target
                        .value,
                    })
                  }
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Address
                </label>

                <textarea
                  value={
                    editingOrder.address
                  }
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      address:
                        e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Total
                </label>

                <input
                  type="number"
                  value={
                    editingOrder.total
                  }
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      total: Number(
                        e.target.value
                      ),
                    })
                  }
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Bike Specifications
                </label>

                <input
                  value={
                    editingOrder.bike_specifications ||
                    ""
                  }
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      bike_specifications:
                        e.target.value,
                    })
                  }
                  placeholder="70cc, 125cc..."
                  className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-600">
                    Products
                  </label>

                  <button
                    type="button"
                    onClick={addEditingItem}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add product
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingOrder.items || []).length === 0 && (
                    <p className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400">
                      No products on this order yet.
                    </p>
                  )}

                  {(editingOrder.items || []).map((item, index) => (
                    <div
                      key={item.id || index}
                      className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          value={item.name || ""}
                          onChange={(e) =>
                            updateEditingItem(index, "name", e.target.value)
                          }
                          placeholder="Product name"
                          className="h-9 w-full rounded-lg border bg-white px-3 text-sm font-medium outline-none focus:border-orange-400"
                        />

                        <button
                          type="button"
                          onClick={() => removeEditingItem(index)}
                          title="Remove this product"
                          className="shrink-0 rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                            Price
                          </label>
                          <input
                            type="number"
                            value={item.price ?? 0}
                            onChange={(e) =>
                              updateEditingItem(
                                index,
                                "price",
                                Number(e.target.value)
                              )
                            }
                            className="h-9 w-full rounded-lg border bg-white px-2 text-sm outline-none focus:border-orange-400"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity ?? 1}
                            onChange={(e) =>
                              updateEditingItem(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            className="h-9 w-full rounded-lg border bg-white px-2 text-sm outline-none focus:border-orange-400"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                            Color
                          </label>
                          <input
                            value={item.color || ""}
                            onChange={(e) =>
                              updateEditingItem(index, "color", e.target.value)
                            }
                            placeholder="e.g. Red"
                            className="h-9 w-full rounded-lg border bg-white px-2 text-sm outline-none focus:border-orange-400"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                            Size
                          </label>
                          <input
                            value={item.size || ""}
                            onChange={(e) =>
                              updateEditingItem(index, "size", e.target.value)
                            }
                            placeholder="e.g. L"
                            className="h-9 w-full rounded-lg border bg-white px-2 text-sm outline-none focus:border-orange-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[11px] text-gray-400">
                  Editing products here doesn't automatically change the order Total above — update it too if needed.
                </p>
              </div>

            </div>

            <div className="flex gap-2 border-t bg-gray-50 px-5 py-4">

              <button
                onClick={() =>
                  setEditingOrder(
                    null
                  )
                }
                className="flex-1 rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                disabled={
                  actionLoading ===
                  `edit-${editingOrder.id}`
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {actionLoading ===
                `edit-${editingOrder.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Save Changes
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  )
}