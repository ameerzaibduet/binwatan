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

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const router = useRouter()

  // ✅ State management
  const [hydrated, setHydrated] = useState(false)
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [bike70, setBike70] = useState(false)
  const [bike125, setBike125] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // ✅ Dynamic PostEx cities
  const [cities, setCities] = useState<string[]>([])
  const [loadingCities, setLoadingCities] = useState(true)

  useEffect(() => setHydrated(true), [])

  // ✅ Fetch PostEx operational cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("/api/postex/operational-cities")
        const data = await res.json()

        if (data?.dist) {
          const cityNames = data.dist.map(
            (item: { operationalCityName: string }) => item.operationalCityName
          )
          setCities(cityNames)
        } else {
          console.error("Unexpected response:", data)
        }
      } catch (err) {
        console.error("Error fetching PostEx cities:", err)
      } finally {
        setLoadingCities(false)
      }
    }

    fetchCities()
  }, [])

  if (!hydrated) {
    return <div className="text-center py-10 text-gray-500">Loading checkout page...</div>
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // ✅ Validate & Place Order
  const handlePlaceOrder = async () => {
    setErrorMsg("")

    if (!name || !number || !city || !address || cart.length === 0) {
      setErrorMsg("Please fill all required fields and make sure your cart is not empty.")
      return
    }

    // ✅ Validate number format (03XXXXXXXXX, 92XXXXXXXXXX, or +923XXXXXXXXX)
    const phoneRegex = /^(?:\+92|92|0)3\d{9}$/
    if (!phoneRegex.test(number)) {
      setErrorMsg("Please enter a valid Pakistani mobile number (e.g., 03XXXXXXXXX or +923XXXXXXXXX).")
      return
    }

    // ✅ Normalize number to 03XXXXXXXXX format before saving
    let normalizedNumber = number
    if (number.startsWith("+92")) normalizedNumber = "0" + number.slice(3)
    else if (number.startsWith("92")) normalizedNumber = "0" + number.slice(2)

    setLoading(true)

    const order = {
      name,
      phone: normalizedNumber,
      email: email || null,
      city,
      address,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        color: item.color ?? null,
      })),
      total,
      dispatched: false,
    }

    const { error } = await supabase.from("orders").insert([order])
    if (error) {
      console.error("Supabase insert error:", error)
      setErrorMsg("Something went wrong while placing the order.")
      setLoading(false)
      return
    }

    clearCart()
    router.push("/order-success")
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* ✅ Error Message */}
      {errorMsg && (
        <div className="mb-4 text-red-600 bg-red-100 border border-red-200 p-3 rounded-md text-sm">
          {errorMsg}
        </div>
      )}

      {/* ✅ Customer Details */}
      <div className="grid gap-4 mb-8">
        <div>
          <Label>Your Name *</Label>
          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label>Phone Number *</Label>
          <Input
            placeholder="03XXXXXXXXX or +923XXXXXXXXX"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d+]/g, ""))}
            maxLength={13}
          />
          {number && !/^(?:\+92|92|0)3\d{9}$/.test(number) && (
            <p className="text-xs text-red-500 mt-1">
              Enter valid Pakistani number (e.g. 03XXXXXXXXX or +923XXXXXXXXX)
            </p>
          )}
        </div>

        {/* ✅ Dynamic City Dropdown */}
        <div>
          <Label>City *</Label>
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn("w-full justify-between", !city && "text-muted-foreground")}
              >
                {city || (loadingCities ? "Loading cities..." : "Select your city")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              side="bottom"
              align="start"
              className="w-full p-0 max-h-72 overflow-y-auto z-[100]"
            >
              <Command>
                <CommandInput placeholder="Search city..." className="h-9" />
                <CommandList>
                  <CommandGroup>
                    {loadingCities ? (
                      <CommandItem disabled>Loading cities...</CommandItem>
                    ) : cities.length === 0 ? (
                      <CommandItem disabled>No cities found</CommandItem>
                    ) : (
                      cities.map((c) => (
                        <CommandItem
                          key={c}
                          value={c}
                          onSelect={(value) => {
                            setCity(value)
                            setCityOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              city === c ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c}
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Complete Address *</Label>
          <Input
            placeholder="Street, Area, Nearby Landmark"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* ✅ Optional Bike Cover */}
        <div>
          <Label>Select Bike Cover Type (optional)</Label>
          <div className="flex flex-col gap-2 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bike70}
                onChange={(e) => setBike70(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span>70 CC Bike Cover</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bike125}
                onChange={(e) => setBike125(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span>125 CC Bike Cover</span>
            </label>
          </div>
        </div>
      </div>

      {/* ✅ Cart Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Cart Summary</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <ul className="mb-4 divide-y">
            {cart.map((item) => (
              <li key={item.id + item.color} className="py-3 flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} × PKR {item.price}
                    {item.color && (
                      <span className="ml-2">
                        | Color: <strong>{item.color}</strong>
                      </span>
                    )}
                  </p>
                </div>
                <p className="font-semibold">PKR {item.price * item.quantity}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-between items-center font-bold text-lg mb-6">
          <span>Total:</span>
          <span>PKR {total}</span>
        </div>

        <Button className="w-full" disabled={loading} onClick={handlePlaceOrder}>
          {loading ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </div>
  )
}
