"use client"

import ProductCard from "@/components/ProductCard"
import { Products } from "@/lib/products"
import { motion, Variants } from "framer-motion"
import { Minus, ShieldCheck, Sparkles, Truck } from "lucide-react"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
}

const categories = Array.from(new Set(Products.map((product) => product.category)))

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-[#fbfbfa] text-slate-950">
      <section className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2">
              <Minus className="w-8 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-400">
                Premium Covers
              </span>
            </div>
            <h1 className="font-serif text-4xl tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              Shop Products
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Browse durable bike covers with waterproof protection, open parcel
              checking, free delivery, and multiple color choices.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Free delivery" },
              { icon: ShieldCheck, label: "Waterproof build" },
              { icon: Sparkles, label: `${categories.length} collections` },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <item.icon className="size-5 text-orange-400" />
                <span className="text-sm font-semibold text-slate-800">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {Products.length} products
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Available now
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Products.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  )
}
