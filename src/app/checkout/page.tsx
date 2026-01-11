"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/use-cart"
import { supabase } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { CITIES } from "@/lib/cities"

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const router = useRouter()

  const [hydrated, setHydrated] = useState(false)
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  /** ✅ STATE FOR ALL BIKE TYPES */
  const [bike70, setBike70] = useState(false)
  const [bike100, setBike100] = useState(false)
  const [bike110, setBike110] = useState(false)
  const [bike125, setBike125] = useState(false)
  const [bike150, setBike150] = useState(false)

  const ttqTrack = (eventName: string, params: Record<string, any> = {}) => {
    if (typeof window !== "undefined" && (window as any).ttq) {
      ;(window as any).ttq.track(eventName, params)
    }
  }

  useEffect(() => setHydrated(true), [])

  if (!hydrated) {
    return <div className="text-center py-10 text-gray-500">Loading checkout...</div>
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handlePlaceOrder = async () => {
    setErrorMsg("")

    if (!name || !number || !city || !address || cart.length === 0) {
      setErrorMsg("Please fill all required fields.")
      return
    }

    const phoneRegex = /^(?:\+92|92|0)3\d{9}$/
    if (!phoneRegex.test(number)) {
      setErrorMsg("Please enter a valid Pakistani mobile number.")
      return
    }

    // Prepare Bike Specification Data
    const selectedBikes = []
    if (bike70) selectedBikes.push("70cc")
    if (bike100) selectedBikes.push("100cc")
    if (bike110) selectedBikes.push("110cc")
    if (bike125) selectedBikes.push("125cc")
    if (bike150) selectedBikes.push("150cc")

    setLoading(true)

    const order = {
      name,
      phone: number,
      email: email || null,
      city,
      address,
      // ✅ Added bike_specifications to the database payload
      bike_specifications: selectedBikes.join(", "), 
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color ?? null,
      })),
      total,
      dispatched: false,
    }

    const { error } = await supabase.from("orders").insert([order])

    if (error) {
      setErrorMsg("Order failed. Please try again.")
      setLoading(false)
      return
    }

    ttqTrack("CompletePayment", { value: total, currency: "PKR" })
    clearCart()
    router.push("/order-success")
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Checkout</h1>

      {errorMsg && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-6 mb-10">
        {/* Basic Info Fields (Name, Phone, City, Address) ... Same as before */}
        <section className="space-y-4">
            <div>
                <Label className="font-bold uppercase text-[10px] tracking-widest text-zinc-400">Your Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div>
                <Label className="font-bold uppercase text-[10px] tracking-widest text-zinc-400">Phone Number *</Label>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} className="rounded-xl h-12" />
            </div>
            <div>
                <Label className="font-bold uppercase text-[10px] tracking-widest text-zinc-400">City *</Label>
                {/* Popover logic for city search remains the same */}
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-12 rounded-xl">
                            {city || "Select City"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 max-h-72 overflow-y-auto">
                        <Command>
                            <CommandInput placeholder="Search city..." />
                            <CommandList>
                                <CommandGroup>
                                    {CITIES.map((c) => (
                                        <CommandItem key={c} onSelect={() => { setCity(c); setCityOpen(false); }}>
                                            {c}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <div>
                <Label className="font-bold uppercase text-[10px] tracking-widest text-zinc-400">Complete Address *</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl h-12" />
            </div>
        </section>

        {/* ✅ UPDATED BIKE SELECTION SECTION */}
        <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
          <Label className="font-black uppercase text-[11px] tracking-[0.2em] text-orange-700 mb-4 block">
            Select Your Bike Type
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: "70", label: "70 CC", state: bike70, setter: setBike70 },
              { id: "100", label: "100 CC", state: bike100, setter: setBike100 },
              { id: "110", label: "110 CC", state: bike110, setter: setBike110 },
              { id: "125", label: "125 CC", state: bike125, setter: setBike125 },
              { id: "150", label: "150 CC", state: bike150, setter: setBike150 },
            ].map((bike) => (
              <label 
                key={bike.id} 
                className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    bike.state ? "border-orange-700 bg-white shadow-md" : "border-zinc-200 bg-transparent hover:border-zinc-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={bike.state}
                  onChange={(e) => bike.setter(e.target.checked)}
                  className="w-5 h-5 accent-orange-700"
                />
                <span className={cn("text-sm font-bold", bike.state ? "text-orange-700" : "text-zinc-500")}>
                  {bike.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Summary & Total remains the same */}
      <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl">
        <h2 className="text-xl font-black uppercase tracking-widest mb-6">Order Summary</h2>
        <div className="space-y-4 mb-8">
            {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="opacity-70">{item.name} x{item.quantity}</span>
                    <span className="font-bold">Rs. {item.price * item.quantity}</span>
                </div>
            ))}
            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-lg font-black uppercase">Total</span>
                <span className="text-2xl font-black text-orange-500">PKR {total}</span>
            </div>
        </div>

        <Button
          className="w-full bg-orange-700 hover:bg-white hover:text-black py-8 rounded-2xl text-lg font-black uppercase tracking-widest transition-all"
          disabled={loading}
          onClick={handlePlaceOrder}
        >
          {loading ? "Processing..." : "Confirm Order"}
        </Button>
      </div>
    </div>
  )
}