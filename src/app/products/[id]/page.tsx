"use client"

import { use, useState, useEffect } from "react"
import { notFound, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Products } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/use-cart"
import { useCartUI } from "@/lib/use-cart-ui"
import clsx from "clsx"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Truck, ArrowRight, Minus } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

// Map color names to Hex codes for the UI swatches
const colorMap: Record<string, string> = {
  "Black": "#1a1a1a",
  "Red": "#b91c1c",
  "Blue": "#1d4ed8",
  "Grey": "#6b7280",
  "Silver": "#cbd5e1",
  "Brown": "#78350f",
}

const ttqTrack = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && (window as any).ttq) {
    ;(window as any).ttq.track(eventName, params)
  }
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params)
  const product = Products.find((p) => p.id === id)
  const router = useRouter()
  const { addToCart } = useCart()
  const { openCart, closeCart } = useCartUI()

  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.find((c) => c.default) || product?.colors?.[0]
  )
  const [selectedCC, setSelectedCC] = useState("70cc")

  if (!product) return notFound()

  useEffect(() => {
    ttqTrack("ViewContent", {
      content_id: product.id,
      content_type: "product",
      content_name: product.name,
      price: product.price,
      currency: "PKR",
    })
  }, [product])

  const handleAddToCart = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })
    ttqTrack("AddToCart", {
      content_id: product.id,
      content_type: "product",
      quantity: 1,
      price: product.price,
      currency: "PKR",
    })
    openCart()
  }

  const handleBuyNow = () => {
    addToCart({ ...product, quantity: 1, color: selectedColor?.name })
    ttqTrack("InitiateCheckout", {
      content_id: product.id,
      content_type: "product",
      value: product.price,
      currency: "PKR",
    })
    closeCart()
    router.push("/checkout")
  }

  return (
    <div className="bg-[#FCFCFC] min-h-screen antialiased text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        
        {/* BREADCRUMB - Classic touch */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-12">
          <Link href="/" className="hover:text-slate-900 transition">Home</Link>
          <span>/</span>
          <span className="text-slate-900 uppercase">{product.name}</span>
        </nav>

        {/* MAIN PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/5] bg-white border border-slate-100 rounded-sm overflow-hidden group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedColor?.image}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={selectedColor?.image || "/placeholder.png"}
                    alt={product.name}
                    fill
                    priority
                    className="object-contain p-6 md:p-12"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-4 mt-6 overflow-x-auto pb-2 scrollbar-hide">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={clsx(
                    "relative flex-shrink-0 w-20 h-20 border transition-all duration-300 rounded-sm",
                    selectedColor?.name === color.name ? "border-slate-900" : "border-slate-100"
                  )}
                >
                  <Image src={color.image} alt={color.name} fill className="object-cover p-1" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Information */}
          <div className="lg:col-span-5 flex flex-col pt-2">
            <header className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Minus className="w-6 text-blue-600" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-blue-600 font-bold">
                  Artisan Quality
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif leading-[1.1] mb-6">
                {product.name}
              </h1>
              <p className="text-2xl font-light tracking-tight text-slate-500">
                PKR {product.price.toLocaleString()}
              </p>
            </header>

            {/* Selection Area */}
            <div className="space-y-10">
              {/* Color Swatches */}
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold mb-4 text-slate-400">
                  Select Finish: <span className="text-slate-900 ml-2">{selectedColor?.name}</span>
                </p>
                <div className="flex gap-4">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={clsx(
                        "w-7 h-7 rounded-full border transition-all duration-300 ring-offset-2",
                        selectedColor?.name === color.name ? "ring-2 ring-slate-900" : "ring-0"
                      )}
                      style={{ backgroundColor: colorMap[color.name] || "#000" }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Bike Type */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">Engine Capacity</p>
                  <button className="text-[10px] uppercase tracking-widest text-slate-400 underline underline-offset-4 hover:text-slate-900 transition">
                    Size Guide
                  </button>
                </div>
                <div className="flex gap-3">
                  {["70cc", "125cc"].map((cc) => (
                    <button
                      key={cc}
                      onClick={() => setSelectedCC(cc)}
                      className={clsx(
                        "flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] border transition-all duration-500",
                        selectedCC === cc 
                          ? "bg-slate-900 text-white border-slate-900 shadow-xl" 
                          : "bg-transparent text-slate-400 border-slate-200 hover:border-slate-900 hover:text-slate-900"
                      )}
                    >
                      {cc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={handleBuyNow}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-none uppercase text-[11px] font-bold tracking-[0.2em] transition-all"
                >
                  Buy Now — PKR {product.price.toLocaleString()}
                </Button>
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="w-full h-14 border-slate-900 text-slate-900 rounded-none uppercase text-[11px] font-bold tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all"
                >
                  Add to Shopping Bag
                </Button>
              </div>

              {/* Features List */}
              <div className="pt-10 border-t border-slate-100 space-y-4">
                 {product.description.split("\n").map((line, i) => (
                  <div key={i} className="flex items-start gap-4 text-slate-500">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    <p className="text-xs leading-relaxed uppercase tracking-wide">{line.trim()}</p>
                  </div>
                ))}
              </div>

              {/* Trust Section */}
              <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-100">
                <div className="flex flex-col gap-2">
                  <Truck className="w-5 h-5 stroke-[1px] text-slate-400" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Global Delivery</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Fast & tracked shipping across Pakistan.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <ShieldCheck className="w-5 h-5 stroke-[1px] text-slate-400" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Quality Shield</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Made from premium weather-resistant fabrics.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        <section className="mt-40">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-2 block">Recommendation</span>
              <h3 className="text-3xl font-serif">Explore Collections</h3>
            </div>
            <Link href="/shop" className="text-[10px] uppercase tracking-widest font-bold border-b border-slate-900 pb-1 flex items-center gap-2 group hover:text-blue-600 hover:border-blue-600 transition-all">
              View All <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {Products.filter(p => p.id !== product.id).slice(0, 4).map((item) => (
              <Link href={`/products/${item.id}`} key={item.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden bg-white border border-slate-100 mb-6 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-slate-200/50">
                  <Image
                    src={item.colors?.[0]?.image}
                    alt={item.name}
                    fill
                    className="object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h4>
                <p className="text-sm font-light text-slate-500">PKR {item.price.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}