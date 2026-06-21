import { create } from "zustand"

type CartItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  color?: string
  size?: string
}

function cartItemKey(item: Pick<CartItem, "id" | "color" | "size">) {
  return `${item.id}::${item.color ?? ""}::${item.size ?? ""}`
}

function matchesCartItem(
  item: CartItem,
  id: string,
  color?: string,
  size?: string
) {
  return cartItemKey(item) === cartItemKey({ id, color, size })
}

type CartStore = {
  cart: CartItem[]
  addToCart: (product: CartItem) => void
  removeFromCart: (id: string, color?: string, size?: string) => void
  clearCart: () => void
  increaseQuantity: (id: string, color?: string, size?: string) => void
  decreaseQuantity: (id: string, color?: string, size?: string) => void
}

export const useCart = create<CartStore>((set) => ({
  cart: [],

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => matchesCartItem(item, product.id, product.color, product.size))
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            matchesCartItem(item, product.id, product.color, product.size)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      }
      return { cart: [...state.cart, product] }
    }),

  removeFromCart: (id, color, size) =>
    set((state) => ({
      cart: state.cart.filter((item) => !matchesCartItem(item, id, color, size)),
    })),

  clearCart: () => set({ cart: [] }),

  increaseQuantity: (id, color, size) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        matchesCartItem(item, id, color, size)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    })),

  decreaseQuantity: (id, color, size) =>
    set((state) => ({
      cart: state.cart
        .map((item) =>
          matchesCartItem(item, id, color, size)
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0),
    })),
}))
