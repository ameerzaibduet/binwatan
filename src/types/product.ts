export type Product = {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
  quantity: number
  colors: {
    name: string
    image: string
    default?: boolean // ✅ Add this line to fix the error
  }[]
  color?: string
}
