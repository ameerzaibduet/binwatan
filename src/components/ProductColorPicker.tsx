"use client"

import Image from "next/image"
import clsx from "clsx"
import { Check } from "lucide-react"
import { colorMap } from "@/lib/color-map"

type ColorOption = {
  name: string
  image: string
  default?: boolean
}

type Props = {
  colors: ColorOption[]
  selected: string
  onSelect: (name: string) => void
  label?: string
}

export default function ProductColorPicker({
  colors,
  selected,
  onSelect,
  label = "Color",
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
          {selected}
        </span>
      </div>

      {colors.length > 4 && (
        <p className="mb-2 text-xs font-medium text-slate-400">Swipe for more colors</p>
      )}

      <div className="category-scroll -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {colors.map((color) => {
          const isSelected = selected === color.name
          const swatch = colorMap[color.name] || "#e5e7eb"

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelect(color.name)}
              className={clsx(
                "group relative w-[92px] shrink-0 snap-start overflow-hidden rounded-xl border text-left transition-all duration-200",
                isSelected
                  ? "border-orange-400 bg-white shadow-md shadow-orange-100 ring-2 ring-orange-400/15"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
              )}
            >
              <div className="relative h-16 overflow-hidden bg-slate-100">
                <Image
                  src={color.image}
                  alt={`${color.name} cover`}
                  fill
                  className={clsx(
                    "object-cover transition-transform duration-300",
                    isSelected ? "scale-100" : "group-hover:scale-105"
                  )}
                  sizes="92px"
                />
                <div
                  className={clsx(
                    "absolute inset-0 transition-opacity duration-200",
                    isSelected
                      ? "bg-gradient-to-t from-orange-500/20 via-transparent to-transparent opacity-100"
                      : "opacity-0 group-hover:opacity-100 bg-gradient-to-t from-slate-900/10 to-transparent"
                  )}
                />
                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-orange-500 text-white shadow-lg">
                    <Check className="size-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-2 py-2">
                <span
                  className={clsx(
                    "size-3.5 shrink-0 rounded-full border border-white shadow ring-1",
                    isSelected ? "ring-orange-300" : "ring-slate-200"
                  )}
                  style={{ backgroundColor: swatch }}
                />
                <span
                  className={clsx(
                    "truncate text-xs font-semibold capitalize",
                    isSelected ? "text-slate-900" : "text-slate-600"
                  )}
                >
                  {color.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
