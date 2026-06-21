"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, PackageCheck, ShieldCheck, Truck } from "lucide-react"
import ProductCard from "@/components/ProductCard"
import { Products } from "@/lib/products"

const categoryDetails: Record<string, { label: string; description: string }> = {
  parachute: {
    label: "Lightweight waterproof covers",
    description:
      "Built for everyday weather protection with a lightweight feel, easy handling, and multiple color choices.",
  },
  rexine: {
    label: "Premium textured protection",
    description:
      "Designed for customers who prefer a stronger surface finish with a refined look and reliable coverage.",
  },
  "car top cover": {
    label: "Measured vehicle top coverage",
    description:
      "Practical top-cover protection for compact vehicles with a clean fit and dependable waterproof material.",
  },
  "rain suites": {
    label: "Full-body rain protection",
    description:
      "Waterproof rain suits in multiple colors and sizes — stay dry on the road with Small, Medium, and Large options.",
  },
}

export default function CategoryPage() {
  const params = useParams()
  const rawParam = Array.isArray(params.name) ? params.name[0] : params.name
  const requestedCategory = decodeURIComponent(rawParam || "")
  const filteredProducts = Products.filter(
    (product) => product.category.toLowerCase() === requestedCategory.toLowerCase()
  )
  const categoryName = filteredProducts[0]?.category || requestedCategory
  const details = categoryDetails[categoryName.toLowerCase()] || {
    label: "Premium collection",
    description:
      "Explore carefully selected products with practical protection, reliable delivery, and clear color choices.",
  }
  const heroProducts = filteredProducts.slice(0, 3)
  const heroImage = heroProducts[0]?.cardImage || heroProducts[0]?.image || "/newarrival.png"

  return (
    <main className="min-h-screen bg-[#fbfbfa] pb-20 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
              {details.label}
            </p>
            <h1 className="mt-4 font-serif text-5xl tracking-tight text-slate-950 md:text-7xl">
              {categoryName}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              {details.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                `${filteredProducts.length} products`,
                "Free delivery",
                "Open parcel allowed",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1.25fr_0.75fr]"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-[#f2f3ef]">
              <Image
                src={heroImage}
                alt={`${categoryName} featured product`}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-contain p-6"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              {(heroProducts.length > 1 ? heroProducts.slice(1, 3) : heroProducts).map(
                (product) => (
                  <div
                    key={product.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-[#f7f7f4]"
                  >
                    <Image
                      src={product.cardImage || product.image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-contain p-4"
                    />
                  </div>
                )
              )}
              {heroProducts.length === 1 && (
                <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm font-medium text-slate-500">
                  More colors available inside
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
              Collection
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Available {categoryName}
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-800 transition-colors hover:text-orange-500"
          >
            View all products
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-500">
                No products found in this collection yet.
              </p>
            </div>
          )}
        </AnimatePresence>
      </section>

      <section className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: Truck,
              title: "Fast delivery",
              desc: "Reliable delivery across Pakistan for every order.",
            },
            {
              icon: ShieldCheck,
              title: "Waterproof cover",
              desc: "Protection made for dust, rain, and daily outdoor use.",
            },
            {
              icon: PackageCheck,
              title: "Open parcel",
              desc: "Customers can check the parcel before accepting delivery.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
            >
              <div className="mb-5 grid size-11 place-items-center rounded-md bg-orange-400 text-white">
                <item.icon className="size-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
