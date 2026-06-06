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
import { ChevronsUpDown, MapPin } from "lucide-react"
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
  const [errorMsg, setErrorMsg] = useState("")
  const [cityOpen, setCityOpen] = useState(false)

  // Bikes
  const [bike70, setBike70] = useState(false)
  const [bike100, setBike100] = useState(false)
  const [bike110, setBike110] = useState(false)
  const [bike125, setBike125] = useState(false)
  const [bike150, setBike150] = useState(false)

  // GPS LOCATION
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => setHydrated(true), [])

  if (!hydrated) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading checkout...
      </div>
    )
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // GPS function
  const getLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("GPS not supported")
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setLocationLoading(false)
      },
      () => {
        setErrorMsg("Please allow location access")
        setLocationLoading(false)
      }
    )
  }

  const handlePlaceOrder = async () => {
    setErrorMsg("")

    if (!name || !number || !city || !address || cart.length === 0) {
      setErrorMsg("Please fill all required fields.")
      return
    }

    const phoneRegex = /^(?:\+92|92|0)3\d{9}$/
    if (!phoneRegex.test(number)) {
      setErrorMsg("Invalid phone number")
      return
    }

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
      bike_specifications: selectedBikes.join(", "),
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
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
      setErrorMsg("Order failed. Try again.")
      setLoading(false)
      return
    }

    clearCart()
    router.push("/order-success")
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white min-h-screen">

      <h1 className="text-3xl font-black mb-8 uppercase">
        Checkout
      </h1>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">

        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />

        <Input placeholder="Phone Number" value={number} onChange={(e) => setNumber(e.target.value)} />

        <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />

        {/* CITY */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {city || "Select City"}
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search city..." />
              <CommandList>
                <CommandGroup>
                  {CITIES.map((c) => (
                    <CommandItem
                      key={c}
                      onSelect={() => {
                        setCity(c)
                        setCityOpen(false)
                      }}
                    >
                      {c}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input placeholder="Complete Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        {/* GPS */}
        <div>
          <Button
  type="button"
  variant="outline"
  onClick={getLocation}
  className={`w-full flex gap-2 transition-all ${
    location
      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
      : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
  }`}
>
  <MapPin className="w-4 h-4" />
  {locationLoading
    ? "Getting Location..."
    : location
    ? "Location Captured ✓"
    : "Share My Location"}
</Button>

          {location && (
            <p className="text-green-600 text-xs mt-2">
              GPS saved successfully
            </p>
          )}
        </div>

        {/* BIKE SELECTION */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "70cc", state: bike70, set: setBike70 },
            { label: "100cc", state: bike100, set: setBike100 },
            { label: "110cc", state: bike110, set: setBike110 },
            { label: "125cc", state: bike125, set: setBike125 },
            { label: "150cc", state: bike150, set: setBike150 },
          ].map((b) => (
            <label key={b.label} className="flex gap-2 border p-2 rounded-xl">
              <input
                type="checkbox"
                checked={b.state}
                onChange={(e) => b.set(e.target.checked)}
              />
              {b.label}
            </label>
          ))}
        </div>

        {/* TOTAL */}
        <div className="p-4 bg-black text-white rounded-xl flex justify-between">
          <span>Total</span>
          <span>PKR {total}</span>
        </div>

        {/* BUTTON */}
        <Button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-6"
        >
          {loading ? "Placing Order..." : "Confirm Order"}
        </Button>

      </div>
    </div>
  )
}