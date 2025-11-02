import axios from "axios"

export const postexClient = axios.create({
  baseURL: "https://api.postex.pk/services/integration/api/order/v3",
  headers: {
    "Content-Type": "application/json",
    token: process.env.NEXT_PUBLIC_POSTEX_API_TOKEN, // use NEXT_PUBLIC_ if it's client-side
  },
})
