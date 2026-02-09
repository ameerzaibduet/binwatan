"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"
import { CITIES } from "@/lib/cities"

export default function CreateManualOrder() {
  const [account, setAccount] = useState("Khan Zaib")
  const [referenceId, setReferenceId] = useState("444")
  const [cityOpen, setCityOpen] = useState(false)

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    cityName: "",
    invoicePayment: "",
    orderDetail: "",
    items: 1,
    weight: 0.5,
  })

  const submit = async () => {
    if (!form.cityName) return alert("Please select city")

    const res = await fetch("/api/postex/manual-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        postexAccount: account,
        referenceId,
        orderRefNumber: `MAN-${Date.now()}`,
      }),
    })

    const data = await res.json()
    if (!data.success) return alert(data.error)

    alert(`✅ Order Created\nTracking: ${data.trackingNumber}`)
    setForm({
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      cityName: "",
      invoicePayment: "",
      orderDetail: "",
      items: 1,
      weight: 0.5,
    })
  }

  return (


    <div className="h-screen w-full bg-white  items-center justify-center">

      <button
  onClick={async () => {

    if (!confirm("Sync orders with PostEx?")) return

    const res = await fetch("/api/postex/sync-orders", {
      method: "POST",
    })

    const data = await res.json()

    if (!data.success) {
      alert("❌ " + data.error)
      return
    }

    alert("✅ " + data.message)
  }}

  className="h-12 bg-orange-400 text-white font-bold rounded-xl hover:bg-orange-600 transition mb-6 px-4"
>
  SYNC ORDERS
</button>


      <div className="w-full max-w-3xl grid gap-4">

        {/* HEADER */}
        <div className="flex justify-between items-end border-l-4 border-yellow-400 pl-4">
          <div>
            <h1 className="text-3xl font-black uppercase">PostEx Manual</h1>
            <p className="text-[10px] text-zinc-400 tracking-widest">
              SHIPMENT CREATION
            </p>
          </div>
          <span className="bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded">
            READY
          </span>
        </div>

        {/* ACCOUNT */}
        <div className="grid grid-cols-2 gap-4">
          <select
            value={account}
            onChange={e => setAccount(e.target.value)}
            className="input"
          >
            <option>Khan Zaib</option>
            <option>Nasir</option>
            <option>Usman</option>
          </select>

          <select
            value={referenceId}
            onChange={e => setReferenceId(e.target.value)}
            className="input"
          >
            <option>444</option>
            <option>333</option>
            <option>222</option>
            <option>999</option>
          </select>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-2 gap-3">
          <input className="input col-span-2" placeholder="Customer Name"
            value={form.customerName}
            onChange={e => setForm({ ...form, customerName: e.target.value })}
          />

          <input className="input" placeholder="Customer Phone"
            value={form.customerPhone}
            onChange={e => setForm({ ...form, customerPhone: e.target.value })}
          />

          <input className="input" placeholder="Invoice Amount"
            value={form.invoicePayment}
            onChange={e => setForm({ ...form, invoicePayment: e.target.value })}
          />

          <input className="input col-span-2" placeholder="Delivery Address"
            value={form.deliveryAddress}
            onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
          />

          {/* CITY */}
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="input col-span-2 justify-between">
                {form.cityName || "Select City"}
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search city..." />
                <CommandList>
                  <CommandGroup>
                    {CITIES.map(city => (
                      <CommandItem
                        key={city}
                        onSelect={() => {
                          setForm({ ...form, cityName: city })
                          setCityOpen(false)
                        }}
                      >
                        {city}
                        {form.cityName === city && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <input className="input col-span-2" placeholder="Order Detail"
            value={form.orderDetail}
            onChange={e => setForm({ ...form, orderDetail: e.target.value })}
          />

          <input className="input" type="number" placeholder="Items"
            value={form.items}
            onChange={e => setForm({ ...form, items: Number(e.target.value) })}
          />

          <input className="input" type="number" step="0.1" placeholder="Weight (kg)"
            value={form.weight}
            onChange={e => setForm({ ...form, weight: Number(e.target.value) })}
          />
        </div>

        {/* SUBMIT */}
        <button
          onClick={submit}
          className="h-14 bg-black text-white font-black rounded-xl hover:bg-yellow-400 hover:text-black transition"
        >
          CREATE SHIPMENT
        </button>
      </div>
    </div>
  )
}
