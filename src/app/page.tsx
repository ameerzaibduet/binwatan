"use client"

import Hero from "@/components/Hero"
import ProductCard from "@/components/ProductCard"
import { motion, Variants } from "framer-motion"
import { Products } from "@/lib/products"
import { Truck, Shield, Headphones, ArrowRight, Minus } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const products = Products

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.3 } 
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  }

  const categories = [
    { name: "The Parachute Series", image: "/parachute.png", href: "/category/parachute" },
    { name: "The Rexine Collection", image: "/rexine.png", href: "/category/Rexine" },
  ]

  return (
    <main className="bg-[#FCFCFC] text-slate-900 selection:bg-slate-200 antialiased">
      {/* Hero Section */}
      <Hero />

     

      {/* 2. Featured Categories - Increased Padding */}
      <section className="max-w-7xl mx-auto  pb-10 mt-15">
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-blue-600 text-xs font-bold uppercase tracking-[0.3em] mb-4">Discovery</span>
          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 tracking-tight">Curated Materials</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {categories.map((cat, idx) => (
            <Link key={idx} href={cat.href} className="group relative block overflow-hidden bg-slate-200">
              <div className="aspect-[4/3] md:aspect-[16/10] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 flex flex-col justify-end p-10">
                <h3 className="text-white text-3xl font-serif mb-4">{cat.name}</h3>
                <div className="w-0 group-hover:w-12 h-px bg-white transition-all duration-500 mb-4" />
                <span className="text-white text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Shop Category
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Top Products - Systematic Grid Spacing */}
      <section className="bg-white py-32 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <Minus className="text-blue-600 w-8" />
                <span className="text-blue-600 text-xs font-bold uppercase tracking-[0.3em]">Our Essentials</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-slate-900">Most Desired Pieces</h2>
            </div>
            <Link href="/shop" className="text-sm font-bold uppercase tracking-widest border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition-all">
              View All Products
            </Link>
          </div>
          
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={cardVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
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
            <button className="inline-block bg-white text-slate-900 px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all duration-300">
              Explore New Arrivals
            </button>
          </div>
        </div>
      </section>

      {/* 5. Benefits Section - Clean & Balanced */}
      <section className="max-w-5xl mx-auto py-32 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
          {[
            { title: "Delivery", desc: "Reliable nationwide logistics ensuring your order arrives in pristine condition." },
            { title: "Quality", desc: "Using only the finest Rexine and Parachute fabrics tested for extreme weather." },
            { title: "Support", desc: "A dedicated concierge service available 24/7 for all your tailoring needs." },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <span className="text-slate-300 text-4xl font-serif mb-6">0{idx + 1}</span>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] mb-4 text-slate-900">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}