"use client"

import { useEffect, useState } from "react"
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
import { useCourierProvider } from "@/hooks/useCourierProvider"
import { syncAllManualOrders } from "@/lib/courier/sync-all"

type PickupLocation = {
  uid: string
  locationId: string
  address: string
  area: string
  city: string
}

export default function CreateManualOrder() {
  const { provider } = useCourierProvider()
  const [account, setAccount] = useState("Khan Zaib")
  const [referenceId, setReferenceId] = useState("444")
  const [cityOpen, setCityOpen] = useState(false)
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([])
  const [pickupLocationId, setPickupLocationId] = useState("")
  const [syncing, setSyncing] = useState(false)

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

  useEffect(() => {
    if (provider !== "nextstep") return

    fetch("/api/nextstep/pickup-locations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPickupLocations(data.locations || [])
          if (data.locations?.[0]?.locationId) {
            setPickupLocationId(data.locations[0].locationId)
          }
        }
      })
      .catch(() => {
        alert("Failed to load NextStep pickup locations")
      })
  }, [provider])

  const submit = async () => {
    if (!form.cityName) return alert("Please select city")
    if (provider === "nextstep" && !pickupLocationId) {
      return alert("Please select a NextStep pickup location")
    }

    const endpoint =
      provider === "nextstep" ? "/api/nextstep/manual-create" : "/api/postex/manual-create"

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        postexAccount: account,
        referenceId,
        orderRefNumber: `MAN-${Date.now()}`,
        pickupLocationId,
        allowOpen: true,
        transactionNotes: "Allowed To Open",
      }),
    })

    const data = await res.json()
    if (!data.success) return alert(data.error || data.statusMessage)

    alert(`✅ Order Created (${provider})\nTracking: ${data.trackingNumber}`)
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

  const handleSync = async () => {
    if (!confirm("Sync active parcels from PostEx and NextStep?")) return

    setSyncing(true)
    try {
      const result = await syncAllManualOrders()
      if (!result.success) {
        alert(`❌ Sync issue\n${result.message}`)
        return
      }
      alert(`✅ ${result.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="h-screen w-full bg-white items-center justify-center">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="mb-6 h-12 rounded-xl bg-orange-400 px-4 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
      >
        {syncing ? "SYNCING..." : "SYNC ORDERS"}
      </button>

      <div className="grid w-full max-w-3xl gap-4">
        <div className="flex items-end justify-between border-l-4 border-yellow-400 pl-4">
          <div>
            <h1 className="text-3xl font-black uppercase">
              {provider === "nextstep" ? "NextStep Manual" : "PostEx Manual"}
            </h1>
            <p className="text-[10px] tracking-widest text-zinc-400">SHIPMENT CREATION</p>
          </div>
          <span className="rounded bg-yellow-400 px-3 py-1 text-xs font-black text-black">
            {provider.toUpperCase()}
          </span>
        </div>

        {provider === "nextstep" ? (
          <select
            value={pickupLocationId}
            onChange={(e) => setPickupLocationId(e.target.value)}
            className="input"
          >
            <option value="">Select Pickup Location</option>
            {pickupLocations.map((location) => (
              <option key={location.uid} value={location.locationId}>
                {location.city} - {location.area || location.address} ({location.uid})
              </option>
            ))}
          </select>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="input"
            >
              <option>Khan Zaib</option>
              <option>Nasir</option>
              <option>Usman</option>
            </select>

            <select
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="input"
            >
              <option>444</option>
              <option>333</option>
              <option>222</option>
              <option>999</option>
            </select>
          </div>
        )}

        {provider === "nextstep" && (
          <select
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            className="input"
          >
            <option>444</option>
            <option>333</option>
            <option>222</option>
            <option>999</option>
          </select>
        )}

        <div className="grid grid-cols-2 gap-3">
          <input
            className="input col-span-2"
            placeholder="Customer Name"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          />

          <input
            className="input"
            placeholder="Customer Phone"
            value={form.customerPhone}
            onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
          />

          <input
            className="input"
            placeholder="Invoice Amount"
            value={form.invoicePayment}
            onChange={(e) => setForm({ ...form, invoicePayment: e.target.value })}
          />

          <input
            className="input col-span-2"
            placeholder="Delivery Address"
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
          />

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
                    {CITIES.map((city) => (
                      <CommandItem
                        key={city}
                        onSelect={() => {
                          setForm({ ...form, cityName: city })
                          setCityOpen(false)
                        }}
                      >
                        {city}
                        {form.cityName === city && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <input
            className="input col-span-2"
            placeholder="Order Detail"
            value={form.orderDetail}
            onChange={(e) => setForm({ ...form, orderDetail: e.target.value })}
          />

          <input
            className="input"
            type="number"
            placeholder="Items"
            value={form.items}
            onChange={(e) => setForm({ ...form, items: Number(e.target.value) })}
          />

          <input
            className="input"
            type="number"
            step="0.1"
            placeholder="Weight (kg)"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
          />
        </div>

        <button
          onClick={submit}
          className="h-14 rounded-xl bg-black font-black text-white transition hover:bg-yellow-400 hover:text-black"
        >
          CREATE SHIPMENT
        </button>
      </div>
    </div>
  )
}
