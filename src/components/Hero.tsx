"use client"

import Image from "next/image"
import { motion } from "framer-motion"

export default function Hero() {
  return (
    <section
      className="
        relative w-full 
        h-[45vh] sm:h-[55vh] md:h-[70vh] 
        flex items-center justify-center 
        bg-white overflow-hidden 
        px-0 sm:px-4
      "
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="
          relative 
          w-[90%] sm:w-[420px] md:w-[600px] lg:w-[700px]
          mx-auto
        "
      >
        <Image
          src="/banner.png"
          alt="Bin Watan Bike Seat Cover"
          width={700}
          height={500}
          priority
          className="object-contain w-full h-auto"
        />
      </motion.div>
    </section>
  )
}
