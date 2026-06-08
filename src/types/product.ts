export type Product = {
  id: string
  name: string
  price: number
  image: string
  uncoveredImage?: string
  category: string
  carDetails?: {
    carName: string
    fit: string
    material: string
  }
  description: string
  quantity: number
  colors: {
    name: string
    image: string
    default?: boolean // ✅ Add this line to fix the error
  }[]
  color?: string
}
