"use client"

import { Product } from "@/types/product"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type Props = {
  category: string
  products: Product[]
  isCurrentCategory?: boolean
}

function RelatedProductImage({ product }: { product: Product }) {
  const image = product.image || product.colors[0]?.image

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-[#f4f4f2]"
    >
      <Image
        src={image}
        alt={product.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        sizes="(min-width: 1024px) 25vw, 50vw"
      />
      <p className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-950 shadow-sm backdrop-blur">
        {product.name}
      </p>
    </Link>
  )
}

export default function ProductCategoryRow({
  category,
  products,
  isCurrentCategory = false,
}: Props) {
  if (products.length === 0) return null

  const categoryHref = `/category/${encodeURIComponent(category)}`

  return (
    <div className="mb-14 last:mb-0">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {isCurrentCategory && (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
              Same collection
            </p>
          )}
          <h3 className="mt-1 font-serif text-2xl tracking-tight text-slate-950 sm:text-3xl">
            {isCurrentCategory ? `More ${category}` : category}
          </h3>
        </div>
        <Link
          href={categoryHref}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-orange-500 sm:inline-flex"
        >
          View all
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {products.length > 2 && (
        <p className="mb-3 text-xs font-medium text-slate-400 lg:hidden">
          Swipe to see more
        </p>
      )}

      <div className="category-scroll -mx-6 overflow-x-auto px-6 pb-2 lg:mx-0 lg:px-0">
        <div className="flex snap-x snap-mandatory gap-4 lg:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(50%-8px)] lg:w-[calc(25%-18px)] xl:w-[calc(25%-18px)]"
            >
              <RelatedProductImage product={product} />
            </div>
          ))}
        </div>
      </div>

      <Link
        href={categoryHref}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition-colors hover:text-orange-500 sm:hidden"
      >
        View all {category}
        <ChevronRight className="size-4" />
      </Link>
    </div>
  )
}
