import { create } from "zustand"

type Product = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  color?: string // ✅ Added color
}

type CartStore = {
  cart: Product[]
  addToCart: (product: Product) => void
  removeFromCart: (id: string, color?: string) => void // ✅ accepts color
  clearCart: () => void
  increaseQuantity: (id: string, color?: string) => void // ✅ accepts color
  decreaseQuantity: (id: string, color?: string) => void // ✅ accepts color
}

export const useCart = create<CartStore>((set) => ({
  cart: [],

  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find(
        (item) => item.id === product.id && item.color === product.color // ✅ consider color
      )
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id && item.color === product.color
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      } else {
        return { cart: [...state.cart, product] }
      }
    }),

  removeFromCart: (id, color) =>
    set((state) => ({
      cart: state.cart.filter(
        (item) => !(item.id === id && item.color === color) // ✅ match both
      ),
    })),

  clearCart: () => set({ cart: [] }),

  increaseQuantity: (id, color) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === id && item.color === color
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    })),

  decreaseQuantity: (id, color) =>
    set((state) => ({
      cart: state.cart
        .map((item) =>
          item.id === id && item.color === color
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0),
    })),
}))
