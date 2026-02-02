"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandGroup,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { CITIES } from "@/lib/cities" // Ensure this path is correct

export default function CreateManualOrder() {
  const [account, setAccount] = useState("Khan Zaib")
  const [referenceId, setReferenceId] = useState("444")
  const [cityOpen, setCityOpen] = useState(false)

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    cityName: "", // This will be handled by the Popover
    invoicePayment: "",
    items: 1,
    weight: 0.5,
  })

  const submit = async () => {
    // Basic validation for City
    if (!form.cityName) {
      alert("Please select a city")
      return
    }

    const res = await fetch("/api/postex/manual-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        postexAccount: account,
        referenceId,
        orderRefNumber: `WA-${Date.now()}`,
      }),
    })

    const data = await res.json()

    if (data.success) {
      alert(`✅ Order Created\nTracking: ${data.trackingNumber}`)
      setForm({
        customerName: "",
        customerPhone: "",
        deliveryAddress: "",
        cityName: "",
        invoicePayment: "",
        items: 1,
        weight: 0.5,
      })
    } else {
      alert(`❌ Order creation failed\n${data.error || ""}`)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-2xl">
        
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-end border-l-4 border-yellow-400 pl-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              <span className="text-black">PostEx</span>{" "}
              <span className="text-gray-400">Manual</span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-bold tracking-[0.3em] uppercase">
              Shipment Creation Terminal
            </p>
          </div>
          <div>
            <span className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">
              Ready
            </span>
          </div>
        </div>

        {/* Account & Reference Selection */}
        <div className="grid grid-cols-2 gap-4 mb-2 ">
          <div className="flex flex-col gap-1">
            <label className="text-black text-[11px] font-black uppercase ml-1">Account</label>
            <select
              value={account}
              onChange={e => setAccount(e.target.value)}
              className="w-full bg-zinc-100 text-black font-bold p-3 rounded-xl border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none cursor-pointer transition-all"
            >
              <option>Khan Zaib</option>
              <option>Nasir</option>
              <option>Usman</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-black text-[11px] font-black uppercase ml-1">Reference</label>
            <select
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              className="w-full bg-zinc-100 text-black font-bold p-3 rounded-xl border-2 border-transparent focus:border-yellow-400 focus:bg-white outline-none cursor-pointer transition-all"
            >
              <option>444</option>
              <option>333</option>
              <option>222</option>
              <option>999</option>
            </select>
          </div>
        </div>

        <hr className="border-zinc-100 mb-8" />

        {/* Input Field Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {Object.entries(form).map(([key, value]) => {
            const isCityField = key === "cityName"
            const fullWidth = key === "deliveryAddress" || key === "customerName"

            return (
              <div key={key} className={`${fullWidth ? "col-span-2" : "col-span-1"} flex flex-col gap-1`}>
                <label className="text-zinc-400 text-[10px] font-bold uppercase ml-1">
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
                
                {isCityField ? (
                  /* Searchable City Dropdown */
                  <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        role="combobox"
                        className="w-full justify-between bg-zinc-50 border-2 border-zinc-100 hover:bg-white hover:border-yellow-400 h-12 rounded-xl text-black font-semibold text-sm px-3"
                      >
                        {form.cityName || "Search city..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl rounded-xl border-zinc-100">
                      <Command className="rounded-xl">
                        <CommandInput placeholder="Search city..." className="h-12" />
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandList className="max-h-64">
                          <CommandGroup>
                            {CITIES.map((c) => (
                              <CommandItem
                                key={c}
                                onSelect={() => {
                                  setForm({ ...form, cityName: c })
                                  setCityOpen(false)
                                }}
                                className="flex items-center justify-between py-3 cursor-pointer"
                              >
                                {c}
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4 text-yellow-500",
                                    form.cityName === c ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  /* Regular Text/Number Inputs */
                  <input
                    type={typeof value === "number" ? "number" : "text"}
                    placeholder={key.replace(/([A-Z])/g, " $1")}
                    value={value as any}
                    onChange={e => {
                      const val = typeof value === "number" ? Number(e.target.value) : e.target.value
                      setForm({ ...form, [key]: val })
                    }}
                    className="w-full bg-zinc-50 text-black font-semibold p-3 rounded-xl border-2 border-zinc-100 focus:border-yellow-400 focus:bg-white outline-none transition-all placeholder:text-zinc-200 text-sm"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Submit Button */}
        <div className="pt-10">
          <button
            onClick={submit}
            className="group relative w-full h-16 bg-black rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_10px_30px_rgba(250,204,21,0.2)] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative z-10 text-white group-hover:text-black font-black text-sm uppercase tracking-[0.3em] transition-colors duration-300">
              Create Shipment
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}