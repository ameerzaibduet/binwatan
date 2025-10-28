"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Hero() {
  return (
    <section
      className="
        relative w-full min-h-[80vh]
        flex flex-col-reverse md:flex-row items-center justify-center
        bg-gradient-to-r from-black via-[#3a0000] to-red-700
        px-6 sm:px-10 md:px-16 lg:px-24
        text-center md:text-left
        overflow-hidden
      "
    >
      {/* ✅ Left Side (Text Content) */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 space-y-5 md:space-y-6 mt-10 md:mt-0"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
          Are you ready to <br />
          <span className="text-red-400">lead the way?</span>
        </h1>

        <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-md mx-auto md:mx-0">
          Discover premium comfort and bold style with our latest bike seat
          covers — built for performance, crafted for riders who demand more.
        </p>

        {/* ✅ Category Buttons */}
        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
          {[
            { name: "Parachute", image: "/parachute.png", href: "/category/parachute" },
            { name: "Rexine", image: "/rexine.png", href: "/category/rexine" },
          ].map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={item.href}
                className="
                  flex items-center justify-start gap-3
                  w-[200px] sm:w-[220px] md:w-[240px]
                  h-[65px]
                  bg-white/10 border border-white/20 
                  text-white rounded-full 
                  hover:bg-white/20 transition-all duration-300
                  backdrop-blur-md shadow-lg relative overflow-hidden
                "
              >
                {/* Circle image — fills the left side exactly */}
                <div
                  className="
                    absolute left-0 top-1/2 -translate-y-1/2
                    w-[65px] h-[65px] rounded-full overflow-hidden
                  "
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>

                {/* Text aligned beside image */}
                <span className="text-sm font-medium pl-[80px]">{item.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ✅ Right Side (Product Image) */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9 }}
        className="flex-1 flex justify-center items-center w-full"
      >
        <Image
          src="/banner.png"
          alt="Bin Watan Bike Seat Cover"
          width={650}
          height={500}
          priority
          className="
            w-[90%] sm:w-[70%] md:w-[85%] lg:w-[80%]
            h-auto object-contain
            drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]
          "
        />
      </motion.div>
    </section>
  )
}
