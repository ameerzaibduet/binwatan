import { create } from "zustand"

type AuthState = {
  isLoggedIn: boolean
  username: string | null
  login: (username: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: typeof window !== "undefined" && !!localStorage.getItem("username"),
  username: typeof window !== "undefined" ? localStorage.getItem("username") : null,
  login: (username) => {
    localStorage.setItem("username", username)
    set({ isLoggedIn: true, username })
  },
  logout: () => {
    localStorage.removeItem("username")
    set({ isLoggedIn: false, username: null })
  },
}))
