"use client"

import Hero from "@/components/Hero"
import ProductCard from "@/components/ProductCard"
import { motion, Variants } from "framer-motion"
import { Products } from "@/lib/products"
import { Truck, Shield, Users } from "lucide-react"

export default function HomePage() {
  // ✅ Use Products directly (no need for useState/useEffect)
  const products = Products

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const categories = [
    { name: "Parachute", image: "/parachute.png", href: "/category/parachute" },
    { name: "Rexine", image: "/rexine.png", href: "/category/Rexine" },
  ]

  return (
    <main className="bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <Hero />

      {/* Featured Categories */}
      <section className="max-w-6xl mx-auto py-12 px-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <a
            key={idx}
            href={cat.href}
            className="relative h-60 rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <h3 className="text-white text-2xl font-bold">{cat.name}</h3>
            </div>
          </a>
        ))}
      </section>

      {/* Top Products */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 pb-2 mb-6 border-b border-gray-300">
          Top Products
        </h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Promotional Banner */}
      <section className="max-w-6xl mx-auto py-12 px-4 mt-12">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img
            src="/newarrival.png"
            alt="Promotion"
            className="w-full h-64 sm:h-80 md:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h3 className="text-white text-3xl sm:text-4xl font-bold">New Arrivals</h3>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-6xl mx-auto py-12 px-4 flex flex-col md:flex-row justify-between gap-6">
        {[
          { icon: <Truck className="w-6 h-6 text-gray-800" />, title: "Free Delivery", desc: "Fast and reliable delivery across Pakistan." },
          { icon: <Shield className="w-6 h-6 text-gray-800" />, title: "Premium Quality", desc: "High-quality bike seat covers built to last." },
          { icon: <Users className="w-6 h-6 text-gray-800" />, title: "24/7 Support", desc: "We’re here for you anytime you need help." },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
            <div className="mb-3">{item.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="text-gray-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
