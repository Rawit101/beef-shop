"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

interface Product {
    id: string
    name: string
    slug: string
    origin: string
    portion: string
    price: number
    old_price: number | null
    badge: string | null
    image_url: string
    category: string
    stock: number
    created_at: string
}

export default function AdminProducts() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)

    // Form state
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        origin: "",
        portion: "",
        price: "",
        old_price: "",
        badge: "",
        image_url: "",
        category: "steak",
        stock: "100",
    })

    useEffect(() => {
        checkAdminAndFetch()
    }, [])

    const checkAdminAndFetch = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            router.push("/login")
            return
        }
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
        if (profile?.role !== "admin") {
            router.push("/")
            return
        }
        fetchProducts()
    }

    const fetchProducts = async () => {
        const { data } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
        setProducts(data || [])
        setLoading(false)
    }

    const openAdd = () => {
        setEditProduct(null)
        setForm({
            name: "",
            slug: "",
            description: "",
            origin: "",
            portion: "",
            price: "",
            old_price: "",
            badge: "",
            image_url: "",
            category: "steak",
            stock: "100",
        })
        setShowModal(true)
    }

    const openEdit = (p: Product) => {
        setEditProduct(p)
        setForm({
            name: p.name,
            slug: p.slug,
            description: "",
            origin: p.origin || "",
            portion: p.portion || "",
            price: p.price.toString(),
            old_price: p.old_price?.toString() || "",
            badge: p.badge || "",
            image_url: p.image_url || "",
            category: p.category || "steak",
            stock: p.stock.toString(),
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        const payload = {
            name: form.name,
            slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
            description: form.description,
            origin: form.origin,
            portion: form.portion,
            price: parseFloat(form.price),
            old_price: form.old_price ? parseFloat(form.old_price) : null,
            badge: form.badge || null,
            image_url: form.image_url,
            category: form.category,
            stock: parseInt(form.stock),
        }

        if (editProduct) {
            await supabase.from("products").update(payload).eq("id", editProduct.id)
        } else {
            await supabase.from("products").insert(payload)
        }

        setShowModal(false)
        fetchProducts()
    }

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            await supabase.from("products").delete().eq("id", id)
            fetchProducts()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <span className="material-icons animate-spin text-4xl text-primary">
                    autorenew
                </span>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background-light">
            {/* Admin Nav */}
            <nav className="sticky top-0 z-50 bg-charcoal text-white">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="flex items-center gap-3">
                            <span className="material-icons text-primary">restaurant</span>
                            <span className="text-lg font-bold tracking-tighter uppercase">
                                Prime<span className="text-primary">Cut</span>
                            </span>
                        </Link>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2">
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-xs uppercase tracking-widest text-gray-400">
                        <Link href="/admin" className="hover:text-white transition-colors">
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="hover:text-white transition-colors"
                        >
                            Orders
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight">Products</h1>
                    <button
                        onClick={openAdd}
                        className="bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                    >
                        <span className="material-icons text-lg">add</span>
                        Add Product
                    </button>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl border border-primary/5 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-primary/5">
                                <th className="text-left text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-4">
                                    Product
                                </th>
                                <th className="text-left text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-4">
                                    Category
                                </th>
                                <th className="text-left text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-4">
                                    Price
                                </th>
                                <th className="text-left text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-4">
                                    Stock
                                </th>
                                <th className="text-right text-xs font-bold uppercase tracking-widest text-gray-400 px-6 py-4">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b border-primary/5 hover:bg-primary/[0.02] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.image_url}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{p.name}</p>
                                                {p.badge && (
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">
                                                        {p.badge}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                                        {p.category}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-sm">
                                        ฿{p.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={`font-semibold ${p.stock < 10 ? "text-red-500" : "text-green-600"
                                                }`}
                                        >
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openEdit(p)}
                                            className="text-gray-400 hover:text-primary transition-colors mr-3"
                                        >
                                            <span className="material-icons text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-icons text-lg">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editProduct ? "Edit Product" : "Add Product"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Name
                                </label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Price
                                    </label>
                                    <input
                                        value={form.price}
                                        onChange={(e) =>
                                            setForm({ ...form, price: e.target.value })
                                        }
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Stock
                                    </label>
                                    <input
                                        value={form.stock}
                                        onChange={(e) =>
                                            setForm({ ...form, stock: e.target.value })
                                        }
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Origin
                                    </label>
                                    <input
                                        value={form.origin}
                                        onChange={(e) =>
                                            setForm({ ...form, origin: e.target.value })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Portion
                                    </label>
                                    <input
                                        value={form.portion}
                                        onChange={(e) =>
                                            setForm({ ...form, portion: e.target.value })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) =>
                                            setForm({ ...form, category: e.target.value })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                    >
                                        <option value="steak">Steak</option>
                                        <option value="wagyu">Wagyu</option>
                                        <option value="bundle">Bundle</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Badge
                                    </label>
                                    <input
                                        value={form.badge}
                                        onChange={(e) =>
                                            setForm({ ...form, badge: e.target.value })
                                        }
                                        placeholder="e.g. A5 GRADE"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                                    Image URL
                                </label>
                                <input
                                    value={form.image_url}
                                    onChange={(e) =>
                                        setForm({ ...form, image_url: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 border border-gray-200 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                            >
                                {editProduct ? "Save Changes" : "Add Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
