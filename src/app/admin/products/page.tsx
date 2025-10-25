"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin")
    if (isAdmin === "true") {
      setAuthorized(true)
      const saved = JSON.parse(localStorage.getItem("products") || "[]")
      setProducts(saved)
    } else {
      router.push("/admin/login")
    }
    setLoading(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "")

    setUploading(true)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await res.json()
    setForm((prev) => ({ ...prev, image: data.secure_url }))
    setUploading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category || !form.image) return

    const newProduct = {
      id: Date.now().toString(),
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      image: form.image,
      description: form.description,
    }

    const updated = [newProduct, ...products]
    setProducts(updated)
    localStorage.setItem("products", JSON.stringify(updated))

    setForm({ name: "", price: "", category: "", image: "", description: "" })
  }

  const handleDelete = (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this product?")
    if (confirmed) {
      const updated = products.filter((p) => p.id !== id)
      setProducts(updated)
      localStorage.setItem("products", JSON.stringify(updated))
    }
  }

  const handleEdit = (product: any) => {
    setForm({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      description: product.description,
    })
    const updated = products.filter((p) => p.id !== product.id)
    setProducts(updated)
    localStorage.setItem("products", JSON.stringify(updated))
  }

  if (loading) return <LoadingSpinner message="Loading admin panel..." />
  if (!authorized) return null

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button
          variant="destructive"
          onClick={() => {
            localStorage.removeItem("isAdmin")
            router.push("/admin/login")
          }}
        >
          Logout
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-xl border p-6 rounded-lg shadow-md"
      >
        <h2 className="text-xl font-semibold">Add / Edit Product</h2>
        <Input name="name" placeholder="Product name" value={form.name} onChange={handleChange} />
        <Input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} />
        <Input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
        <div className="space-y-2">
          <input type="file" onChange={handleImageUpload} />
          {uploading ? (
            <p className="text-sm text-gray-500">Uploading...</p>
          ) : form.image ? (
            <img src={form.image} alt="Preview" className="w-32 h-32 object-cover rounded-md border" />
          ) : null}
        </div>
        <textarea
          name="description"
          placeholder="Description"
          className="w-full p-2 border rounded-md text-sm"
          value={form.description}
          onChange={handleChange}
        ></textarea>
        <Button type="submit" className="w-full">
          Save Product
        </Button>
      </form>

      {products.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Product List</h2>
          <table className="w-full table-auto border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Price</th>
                <th className="border px-2 py-1">Category</th>
                <th className="border px-2 py-1">Image</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="border px-2 py-1">{p.name}</td>
                  <td className="border px-2 py-1">PKR {p.price}</td>
                  <td className="border px-2 py-1">{p.category}</td>
                  <td className="border px-2 py-1">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
