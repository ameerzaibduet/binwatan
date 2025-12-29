"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Play, Star } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative w-full bg-[#1E1E1E] overflow-hidden min-h-[85vh] flex items-center pt-10">
      
      {/* 🌫️ Background Texture & Lighting */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10" 
             style={{ backgroundImage: `radial-gradient(#F97316 0.5px, transparent 0.5px)`, backgroundSize: '30px 30px' }} />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#F97316]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
          
          {/* 📝 Left Side: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center md:text-left"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 mb-6">
              <Star size={14} className="text-[#F97316] fill-[#F97316]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#F97316]">Premium Collection</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.9] uppercase italic tracking-tighter mb-6">
              Ride in <br />
              <span className="text-[#F97316] drop-shadow-[0_2px_10px_rgba(249,115,22,0.3)]">Style & Comfort</span>
            </h1>

            <p className="text-gray-400 text-base md:text-xl max-w-lg mb-10 leading-relaxed font-light">
              Elevate your journey with our <span className="text-white font-medium">professional-grade</span> bike seat covers. Engineered for durability, designed for the bold.
            </p>

           

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-white/10 flex gap-8 justify-center md:justify-start pb-8">
              <div>
                <div className="text-2xl font-bold text-white">100k+</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">4.7/4K</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">User Rating</div>
              </div>
            </div>
          </motion.div>

          {/* 📸 Right Side: Image with Floating Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex-1 relative flex justify-center items-center w-full"
          >
            {/* Floating Info Card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 z-20 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center text-white">
                  <Star size={20} fill="white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white uppercase italic">Waterproof</div>
                  <div className="text-[10px] text-gray-400">All-weather Protection</div>
                </div>
              </div>
            </motion.div>

            {/* Glowing Aura */}
            <div className="absolute w-[80%] h-[80%] bg-[#F97316]/20 rounded-full blur-[100px] z-0" />

            <div className="relative z-10 group">
              <Image
                src="/bannerr.png"
                alt="Bin Watan Bike Seat Cover"
                width={700}
                height={550}
                priority
                className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}