"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type StoredOrderItem = {
  id: string
  name: string
  price: number
  quantity: number
  color?: string | null
  image?: string | null
}

export type StoredCustomerOrder = {
  id: string
  name: string
  phone: string
  city: string
  address: string
  total: number
  items: StoredOrderItem[]
  bike_specifications?: string | null
  created_at: string
  dispatched?: boolean
  transaction_status?: string | null
  delivery_date?: string | null
  tracking_number?: string | null
}

type CustomerOrdersStore = {
  orders: StoredCustomerOrder[]
  phone: string
  addOrder: (order: StoredCustomerOrder) => void
  setPhone: (phone: string) => void
  syncOrders: (remoteOrders: StoredCustomerOrder[]) => void
  clearOrders: () => void
}

export const useCustomerOrders = create<CustomerOrdersStore>()(
  persist(
    (set) => ({
      orders: [],
      phone: "",

      addOrder: (order) =>
        set((state) => {
          const exists = state.orders.some((item) => item.id === order.id)
          if (exists) {
            return {
              orders: state.orders.map((item) =>
                item.id === order.id ? { ...item, ...order } : item
              ),
              phone: order.phone || state.phone,
            }
          }
          return {
            orders: [order, ...state.orders],
            phone: order.phone || state.phone,
          }
        }),

      setPhone: (phone) => set({ phone }),

      syncOrders: (remoteOrders) =>
        set((state) => {
          const map = new Map(state.orders.map((order) => [order.id, order]))

          for (const remote of remoteOrders) {
            const existing = map.get(remote.id)
            map.set(remote.id, existing ? { ...existing, ...remote } : remote)
          }

          return {
            orders: Array.from(map.values()).sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
          }
        }),

      clearOrders: () => set({ orders: [], phone: "" }),
    }),
    {
      name: "customerOrders",
    }
  )
)
