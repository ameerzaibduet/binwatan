"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Hero() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full bg-[#1E1E1E] overflow-hidden">
        <div
          className="
            flex flex-col-reverse md:flex-row items-center justify-center
            px-6 sm:px-10 md:px-16 lg:px-24
            min-h-[70vh] md:min-h-[80vh]
            text-center md:text-left
            relative pb-8 pt-5
          "
        >
          {/* Left Side: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-5 md:space-y-6 mt-10 md:mt-0"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Ride in <br />
              <span className="text-[#F97316]">style & comfort</span>
            </h1>

            <p className="text-[#E5E7EB] text-sm sm:text-base md:text-lg max-w-md mx-auto md:mx-0">
              Explore our premium bike seat covers designed for performance and bold style.
              Experience comfort without compromise.
            </p>
          </motion.div>

          {/* Right Side: Product Banner */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="flex-1 flex justify-center items-center w-full relative"
          >
            <div className="absolute -inset-10 bg-gradient-to-r from-[#F97316]/20 via-[#E5E7EB]/10 to-[#F97316]/20 rounded-full blur-3xl"></div>
            <Image
              src="/banner.png"
              alt="Bin Watan Bike Seat Cover"
              width={650}
              height={500}
              priority
              className="w-[90%] sm:w-[70%] md:w-[85%] lg:w-[80%] h-auto object-contain relative z-10 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        </div>
      </section>

      
    </>
  )
}
