import { create } from "zustand"

type CartUIStore = {
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

export const useCartUI = create<CartUIStore>((set) => ({
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
}))
