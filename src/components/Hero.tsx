"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export default function Hero() {
  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center bg-white overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative w-[300px] sm:w-[450px] md:w-[600px] lg:w-[700px]"
      >
        <Image
          src="/banner.png" // <-- replace with your actual white-background bike image
          alt="Bin Watan Bike Seat Cover"
          width={700}
          height={500}
          priority
          className="object-contain drop-shadow-[0_6px_15px_rgba(0,0,0,0.25)]"
        />
      </motion.div>
    </section>
  )
}
