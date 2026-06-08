"use client"

import { COURIER_PROVIDERS, type CourierProvider } from "@/lib/courier/types"
import { useCourierProvider } from "@/hooks/useCourierProvider"
import clsx from "clsx"

type Props = {
  className?: string
  compact?: boolean
}

export default function CourierProviderSelector({ className, compact = false }: Props) {
  const { provider, setProvider, ready } = useCourierProvider()

  if (!ready) return null

  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm",
        compact ? "p-2" : "p-4",
        className
      )}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
        Courier Provider
      </p>
      <div className="flex gap-2">
        {COURIER_PROVIDERS.map((item) => {
          const active = provider === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setProvider(item.id as CourierProvider)}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                active
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Selected once here, then used for booking and tracking sync.
      </p>
    </div>
  )
}
