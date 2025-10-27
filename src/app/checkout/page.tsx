"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/use-cart"
import { supabase } from "@/lib/supabase"
import { cities } from "@/lib/cities"
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

  const [hydrated, setHydrated] = useState(false)
  const [name, setName] = useState("")
  const [number, setNumber] = useState("")
  const [email, setEmail] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)

  useEffect(() => setHydrated(true), [])
  if (!hydrated) return null

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (!name || !number || !city || !address || cart.length === 0) {
      alert("Please fill all required fields and make sure your cart is not empty.")
      return
    }

    setLoading(true)

    const order = {
      name,
      phone: number,
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
      alert("Something went wrong while placing the order.")
      setLoading(false)
      return
    }

    clearCart()
    router.push("/order-success")
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* ✅ Customer Details */}
      <div className="grid gap-4 mb-8">
        <div>
          <Label>Your Name *</Label>
          <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Phone Number *</Label>
          <Input placeholder="03XXXXXXXXX" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
   

        {/* ✅ Searchable City */}
        <div>
          <Label>City *</Label>
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn("w-full justify-between", !city && "text-muted-foreground")}
              >
                {city || "Select your city"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" className="w-full p-0 max-h-72 overflow-y-auto z-[100]">
              <Command>
                <CommandInput placeholder="Search city..." className="h-9" />
                <CommandList>
                  <CommandGroup>
                    {cities.map((c) => (
                      <CommandItem
                        key={c}
                        value={c}
                        onSelect={(value) => {
                          setCity(value)
                          setCityOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", city === c ? "opacity-100" : "opacity-0")}
                        />
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
          <Label>Complete Address *</Label>
          <Input
            placeholder="Street, Area, Nearby Landmark"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
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
                      <span className="ml-2">| Color: <strong>{item.color}</strong></span>
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


/*password: aV*r&QW-zTW7?-s*/
