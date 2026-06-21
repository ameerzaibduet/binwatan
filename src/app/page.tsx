"use client"

import Hero from "@/components/Hero"
import ProductCard from "@/components/ProductCard"
import { motion } from "framer-motion"
import { Products } from "@/lib/products"
import Image from "next/image"
import { Minus } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const categoryOrder = ["Parachute", "Rexine", "Car Top Cover", "Rain Suites"]
  const productGroups = categoryOrder
    .map((category) => ({
      category,
      products: Products.filter((p) => p.category === category),
    }))
    .filter((group) => group.products.length > 0)

  const categories = [
    {
      name: "Parachute",
      image: "/parachute.png",
      href: "/category/parachute",
    },
    {
      name: "Rexine",
      image: "/rexine.png",
      href: "/category/Rexine",
    },
    {
      name: "Car Top",
      image: "/images/boolan-cover.png",
      href: "/category/Car%20Top%20Cover",
    },
    {
      name: "Rain Suites",
      image: "/images/rain-suite-black.png",
      href: "/category/Rain%20Suites",
    },
  ]

  return (
    <main className="bg-[#FCFCFC] text-slate-900 selection:bg-slate-200 antialiased">
      {/* Hero Section */}
      <Hero />

     

      {/* 2. Featured Categories */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <Minus className="w-5 text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-400">
              Category
            </span>
            <Minus className="w-5 text-orange-400" />
          </div>
        </div>

        <div className="category-scroll overflow-x-auto pb-2">
          <div className="mx-auto flex min-w-max snap-x snap-mandatory gap-4 pr-12 md:min-w-0 md:max-w-2xl md:justify-center md:gap-6 md:pr-0">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group flex w-[28vw] min-w-24 max-w-32 shrink-0 snap-start flex-col items-center text-center md:w-36 md:max-w-36"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-orange-300 group-hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 768px) 240px, 160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="mt-3 text-sm font-semibold text-slate-950 transition-colors group-hover:text-orange-500">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Top Products */}
      <section className="bg-white py-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Minus className="text-orange-400 w-5" />
              <span className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.22em]">
                Our Essentials
              </span>
              <Minus className="text-orange-400 w-5" />
            </div>
            <p className="text-sm text-slate-500">
              {Products.length} Products Across All Collections
            </p>
          </div>

          <div className="space-y-14">
            {productGroups.map((group) => (
              <div key={group.category}>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                      {group.category}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                      {group.products.length} available
                    </h2>
                  </div>
                  <Link
                    href={`/category/${encodeURIComponent(group.category)}`}
                    className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800 transition-colors hover:text-orange-500"
                  >
                    View all →
                  </Link>
                </div>

                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10"
                  initial={{ opacity: 0.6 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {group.products.map((product) => (
                    <div key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Promotional Banner - Minimalist Boldness */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto relative overflow-hidden bg-slate-900 min-h-[500px] flex items-center">
          <img
            src="/newarrival.png"
            alt="Promotion"
            className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-[10s] hover:scale-110"
          />
          <div className="relative z-10 px-8 md:px-24 text-center md:text-left">
            <h3 className="text-white text-5xl md:text-7xl font-serif mb-8 leading-[1.1]">The Winter <br/>Edition 2024</h3>
            <p className="text-white/70 text-lg mb-10 max-w-md leading-relaxed">
              Experience the fusion of artisanal craftsmanship and modern durability.
            </p>
           <Link href="/category/parachute">
           
           <button className="inline-block bg-orange-400 text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300">
              Explore New Arrivals
            </button>
           </Link> 
          </div>
        </div>
      </section>

      {/* 5. Benefits Section - Clean & Balanced */}
      <section className="max-w-5xl mx-auto pt-10 pb-20 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
          {[
            { title: "Delivery", desc: "Reliable nationwide logistics ensuring your order arrives in pristine condition." },
            { title: "Quality", desc: "Using only the finest Rexine and Parachute fabrics tested for extreme weather." },
            { title: "Support", desc: "A dedicated concierge service available 24/7 for all your tailoring needs." },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <span className="text-orange-400 text-4xl font-serif mb-6">0{idx + 1}</span>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-4 text-slate-900">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
