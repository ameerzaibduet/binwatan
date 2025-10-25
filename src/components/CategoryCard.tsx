"use client"

import Link from "next/link"

type Props = {
  category: string
}

export default function CategoryCard({ category }: Props) {
  return (
    <Link href={`/category/${category}`} className="group">
      <div
        className="
          relative overflow-hidden rounded-xl bg-white/30 backdrop-blur-md border border-gray-200 
          shadow-md p-6 text-center transition-all duration-300 ease-in-out
          hover:scale-105 hover:shadow-xl hover:bg-white/40
          active:scale-95 active:shadow-inner cursor-pointer
        "
      >
        <div
          className="
            text-2xl font-bold text-gray-800 group-hover:text-blue-600
            capitalize tracking-wide transition-colors
          "
        >
          {category}
        </div>

        {/* Decorative blur blobs */}
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition" />
        <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-100 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition" />
      </div>
    </Link>
  )
}
