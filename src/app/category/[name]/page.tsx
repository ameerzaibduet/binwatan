"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Filter, LayoutGrid, Sparkles, ShieldCheck, Truck } from "lucide-react"
import { Product } from "@/types/product"
import { Products } from "@/lib/products"
import ProductCard from "@/components/ProductCard"

export default function CategoryPage() {
  const params = useParams()
  const categoryName = decodeURIComponent(params.name as string)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    const data = Products.filter(
      (p) => p.category.toLowerCase() === categoryName.toLowerCase()
    )
    setFilteredProducts(data)
  }, [categoryName])

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-24">
      
      {/* 🚀 MODERN HERO SECTION */}
      <section className="relative h-[60vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden bg-black">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-purple-600/20 blur-[120px] rounded-full" />
        
        <img
          src={filteredProducts[0]?.image || "/placeholder.jpg"}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale-[0.5]"
        />
        
        {/* Content */}
        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.2em] text-orange-400 uppercase bg-blue-400/10 border border-blue-400/20 rounded-full backdrop-blur-md">
              Premium Collection
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 uppercase italic">
              {categoryName}<span className="text-orange-600">.</span>
            </h1>
            <p className="max-w-xl mx-auto text-gray-400 text-lg md:text-xl font-light leading-relaxed">
              Engineering excellence meets modern aesthetics. Browse our signature {categoryName} lineup.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 🛠️ BENTO INFO SECTION */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl shadow-black/5 flex items-center gap-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Truck size={24}/></div>
            <div>
              <h4 className="font-bold">Fast Delivery</h4>
              <p className="text-sm text-gray-500">Global shipping in 3-5 days</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl shadow-black/5 flex items-center gap-5">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><ShieldCheck size={24}/></div>
            <div>
              <h4 className="font-bold">2-Year Warranty</h4>
              <p className="text-sm text-gray-500">Guaranteed quality control</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl shadow-black/5 flex items-center gap-5">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Sparkles size={24}/></div>
            <div>
              <h4 className="font-bold">Eco Friendly</h4>
              <p className="text-sm text-gray-500">100% Sustainable packaging</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📦 PRODUCTS FEED */}
      <section className="max-w-7xl mx-auto px-6 mt-20">
    

        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -10 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-[3rem]">
              <p className="text-gray-400 font-medium italic">No matches found in the current collection.</p>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* 📧 NEWSLETTER / CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 mt-32">
        <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 md:p-20 flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px]" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Join the Inner Circle</h2>
          <p className="text-gray-400 max-w-lg mb-10">Get early access to limited edition drops and member-only pricing.</p>
          
          <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 h-14 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
            />
            <button className="h-14 px-8 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
              Subscribe <ArrowRight size={18}/>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}