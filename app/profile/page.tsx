"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"
import { useLanguage } from "../../lib/i18n"

interface OrderItem {
    id: string
    product_name: string
    quantity: number
    unit_price: number
    product_id: string | null
    products?: {
        image_url: string
        portion: string
        slug: string
    } | null
}

interface Order {
    id: string
    status: string
    subtotal: number
    shipping: number
    tax: number
    total: number
    first_name: string
    last_name: string
    address: string
    city: string
    postcode: string
    delivery_method: string
    payment_method: string
    tracking_number: string | null
    created_at: string
    order_items: OrderItem[]
}

interface SavedAddress {
    id: string
    label: string
    first_name: string
    last_name: string
    address: string
    city: string
    postcode: string
    is_default: boolean
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    pending: { color: "text-amber-600", bg: "bg-amber-50", icon: "schedule", label: "Pending" },
    confirmed: { color: "text-blue-600", bg: "bg-blue-50", icon: "check_circle", label: "Confirmed" },
    shipped: { color: "text-purple-600", bg: "bg-purple-50", icon: "local_shipping", label: "Shipped" },
    delivered: { color: "text-green-600", bg: "bg-green-50", icon: "inventory", label: "Delivered" },
    cancelled: { color: "text-red-600", bg: "bg-red-50", icon: "cancel", label: "Cancelled" },
}

const EMPTY_ADDR = { label: "Home", first_name: "", last_name: "", address: "", city: "", postcode: "" }

export default function ProfilePage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [user, setUser] = useState<{ email?: string; full_name?: string } | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
    const [copiedTracking, setCopiedTracking] = useState<string | null>(null)

    // Tab state
    const [activeTab, setActiveTab] = useState<"orders" | "addresses">("orders")

    // Saved addresses state
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
    const [showAddrForm, setShowAddrForm] = useState(false)
    const [editingAddr, setEditingAddr] = useState<SavedAddress | null>(null)
    const [addrForm, setAddrForm] = useState(EMPTY_ADDR)

    const copyTrackingNumber = (e: React.MouseEvent, trackingNumber: string) => {
        e.stopPropagation()
        navigator.clipboard.writeText(trackingNumber)
        setCopiedTracking(trackingNumber)
        setTimeout(() => setCopiedTracking(null), 2000)
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        if (!isSupabaseConfigured()) {
            setLoading(false)
            return
        }

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
            router.push("/login")
            return
        }

        // Get profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", authUser.id)
            .single()

        setUser({
            email: authUser.email,
            full_name: profile?.full_name || authUser.email,
        })

        // Get orders with items
        const { data: ordersData, error } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (
                    id,
                    product_name,
                    quantity,
                    unit_price,
                    product_id,
                    products ( image_url, portion, slug )
                )
            `)
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Fetch orders error:", error)
        }

        if (ordersData) {
            setOrders(ordersData as Order[])
        }

        // Get saved addresses
        const { data: addrData } = await supabase
            .from("saved_addresses")
            .select("*")
            .eq("user_id", authUser.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false })

        if (addrData) {
            setSavedAddresses(addrData as SavedAddress[])
        }

        setLoading(false)
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const toggleOrder = (id: string) => {
        setExpandedOrder(expandedOrder === id ? null : id)
    }

    // --- Address CRUD ---
    const openAddForm = () => {
        setEditingAddr(null)
        setAddrForm(EMPTY_ADDR)
        setShowAddrForm(true)
    }

    const openEditForm = (addr: SavedAddress) => {
        setEditingAddr(addr)
        setAddrForm({
            label: addr.label,
            first_name: addr.first_name,
            last_name: addr.last_name,
            address: addr.address,
            city: addr.city,
            postcode: addr.postcode,
        })
        setShowAddrForm(true)
    }

    const saveAddress = async () => {
        if (!isSupabaseConfigured()) return
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        if (editingAddr) {
            await supabase
                .from("saved_addresses")
                .update(addrForm)
                .eq("id", editingAddr.id)
        } else {
            await supabase
                .from("saved_addresses")
                .insert({ ...addrForm, user_id: authUser.id })
        }
        setShowAddrForm(false)
        loadData()
    }

    const deleteAddress = async (id: string) => {
        if (!isSupabaseConfigured()) return
        await supabase.from("saved_addresses").delete().eq("id", id)
        setSavedAddresses(prev => prev.filter(a => a.id !== id))
    }

    const setDefaultAddress = async (id: string) => {
        if (!isSupabaseConfigured()) return
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return
        await supabase
            .from("saved_addresses")
            .update({ is_default: false })
            .eq("user_id", authUser.id)
        await supabase
            .from("saved_addresses")
            .update({ is_default: true })
            .eq("id", id)
        loadData()
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-[60vh] flex items-center justify-center">
                    <span className="material-icons animate-spin text-4xl text-primary">
                        autorenew
                    </span>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-background-light">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-1">
                                My Account
                            </p>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                {activeTab === "orders" ? t.addresses.orderHistory : t.addresses.title}
                            </h1>
                            {user && (
                                <p className="text-sm text-gray-400 mt-1">
                                    Welcome back, {user.full_name}
                                </p>
                            )}
                        </div>

                        <Link
                            href="/order-tracking"
                            className="flex items-center gap-2 bg-charcoal text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors self-start"
                        >
                            <span className="material-icons text-base">local_shipping</span>
                            Track Current Order
                        </Link>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8">
                        <button
                            onClick={() => setActiveTab("orders")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "orders"
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary"
                                }`}
                        >
                            <span className="material-icons text-base">receipt_long</span>
                            {t.addresses.orderHistory}
                        </button>
                        <button
                            onClick={() => setActiveTab("addresses")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "addresses"
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary"
                                }`}
                        >
                            <span className="material-icons text-base">location_on</span>
                            {t.addresses.title}
                        </button>
                    </div>

                    {/* ═══ Orders Tab ═══ */}
                    {activeTab === "orders" && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">Total Orders</p>
                                    <p className="text-2xl font-extrabold">{orders.length}</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">Total Spent</p>
                                    <p className="text-2xl font-extrabold">
                                        ${orders.reduce((s, o) => s + Number(o.total), 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">Delivered</p>
                                    <p className="text-2xl font-extrabold text-green-600">
                                        {orders.filter((o) => o.status === "delivered").length}
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">In Progress</p>
                                    <p className="text-2xl font-extrabold text-primary">
                                        {orders.filter((o) => ["pending", "confirmed", "shipped"].includes(o.status)).length}
                                    </p>
                                </div>
                            </div>

                            {/* Orders List */}
                            {orders.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                                    <span className="material-icons text-6xl text-gray-200 mb-4">receipt_long</span>
                                    <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                                    <p className="text-gray-400 mb-6">Start exploring our premium selection of beef cuts.</p>
                                    <Link href="/products" className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                                        Browse Products
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => {
                                        const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                                        const isExpanded = expandedOrder === order.id

                                        return (
                                            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
                                                <button onClick={() => toggleOrder(order.id)} className="w-full px-6 py-5 flex items-center justify-between text-left">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center`}>
                                                            <span className={`material-icons text-xl ${status.color}`}>{status.icon}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-0.5">
                                                                <p className="font-bold text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                                                                    {status.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400">
                                                                {formatDate(order.created_at)} • {order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""}
                                                                {order.tracking_number && (
                                                                    <>
                                                                        {" "}
                                                                        <span
                                                                            onClick={(e) => copyTrackingNumber(e, order.tracking_number!)}
                                                                            className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-charcoal/5 hover:bg-primary/10 rounded text-[10px] font-bold tracking-wider text-charcoal cursor-pointer transition-colors"
                                                                            title="Click to copy"
                                                                        >
                                                                            <span className="material-icons text-[10px]">local_shipping</span>
                                                                            {order.tracking_number}
                                                                            <span className="material-icons text-[10px] ml-0.5">
                                                                                {copiedTracking === order.tracking_number ? "check" : "content_copy"}
                                                                            </span>
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-lg font-extrabold">${Number(order.total).toFixed(2)}</p>
                                                        <span className={`material-icons text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-gray-100 px-6 py-5">
                                                        <div className="space-y-3 mb-6">
                                                            {order.order_items.map((item) => (
                                                                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                                                        {item.products?.image_url ? (
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            <img className="w-full h-full object-cover" src={item.products.image_url} alt={item.product_name} />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <span className="material-icons text-gray-400">image</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-sm truncate">{item.product_name}</p>
                                                                        <p className="text-xs text-gray-400">{item.products?.portion || "—"} × {item.quantity}</p>
                                                                    </div>
                                                                    <p className="font-bold text-sm text-primary">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                                                            <div>
                                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Subtotal</p>
                                                                <p className="font-semibold text-sm">${Number(order.subtotal).toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Shipping</p>
                                                                <p className="font-semibold text-sm">${Number(order.shipping).toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Tax</p>
                                                                <p className="font-semibold text-sm">${Number(order.tax).toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Total</p>
                                                                <p className="font-bold text-primary">${Number(order.total).toFixed(2)}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col md:flex-row gap-4 text-sm">
                                                            <div className="flex-1 p-4 bg-gray-50 rounded-xl">
                                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">Shipping To</p>
                                                                <p className="font-semibold">{order.first_name} {order.last_name}</p>
                                                                <p className="text-gray-500 text-xs">{order.address}, {order.city} {order.postcode}</p>
                                                            </div>
                                                            <div className="flex-1 p-4 bg-gray-50 rounded-xl">
                                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">Delivery Method</p>
                                                                <p className="font-semibold capitalize">{order.delivery_method}</p>
                                                            </div>
                                                            <div className="flex-1 p-4 bg-gray-50 rounded-xl">
                                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">Payment</p>
                                                                <p className="font-semibold capitalize">{order.payment_method}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ═══ Addresses Tab ═══ */}
                    {activeTab === "addresses" && (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-sm text-gray-500">
                                    {savedAddresses.length}/5 {t.addresses.savedAddresses}
                                </p>
                                <button
                                    onClick={openAddForm}
                                    disabled={savedAddresses.length >= 5}
                                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="material-icons text-base">add</span>
                                    {savedAddresses.length >= 5 ? t.addresses.maxReached : t.addresses.addNew}
                                </button>
                            </div>

                            {showAddrForm && (
                                <div className="bg-white rounded-2xl border border-primary/20 p-6 mb-6 shadow-lg">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="material-icons text-primary text-xl">edit_location_alt</span>
                                        {editingAddr ? t.addresses.editAddress : t.addresses.addNew}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.addresses.labelField}</label>
                                            <input value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all" placeholder={t.addresses.labelPlaceholder} />
                                        </div>
                                        <div></div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.addresses.firstName}</label>
                                            <input value={addrForm.first_name} onChange={e => setAddrForm(f => ({ ...f, first_name: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.addresses.lastName}</label>
                                            <input value={addrForm.last_name} onChange={e => setAddrForm(f => ({ ...f, last_name: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.addresses.address}</label>
                                            <input value={addrForm.address} onChange={e => setAddrForm(f => ({ ...f, address: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.addresses.city}</label>
                                            <input value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t.addresses.postcode}</label>
                                            <input value={addrForm.postcode} onChange={e => setAddrForm(f => ({ ...f, postcode: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={saveAddress} disabled={!addrForm.first_name || !addrForm.last_name || !addrForm.address || !addrForm.city} className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
                                            {t.addresses.save}
                                        </button>
                                        <button onClick={() => setShowAddrForm(false)} className="px-6 py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                            {t.addresses.cancel}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {savedAddresses.length === 0 && !showAddrForm ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                                    <span className="material-icons text-6xl text-gray-200 mb-4">location_off</span>
                                    <h3 className="text-xl font-bold mb-2">{t.addresses.noAddresses}</h3>
                                    <p className="text-gray-400 mb-6">{t.addresses.addNew}</p>
                                    <button onClick={openAddForm} className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                                        <span className="material-icons text-base mr-1 align-middle">add</span>
                                        {t.addresses.addNew}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {savedAddresses.map((addr) => (
                                        <div key={addr.id} className={`bg-white rounded-2xl border p-5 transition-shadow hover:shadow-md ${addr.is_default ? "border-primary/30 ring-1 ring-primary/10" : "border-gray-100"}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons text-primary text-lg">location_on</span>
                                                    <span className="font-bold text-sm">{addr.label}</span>
                                                    {addr.is_default && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                            {t.addresses.defaultBadge}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold">{addr.first_name} {addr.last_name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{addr.address}, {addr.city} {addr.postcode}</p>
                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                                                <button onClick={() => openEditForm(addr)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary transition-colors">
                                                    <span className="material-icons text-sm">edit</span>
                                                    {t.addresses.editAddress}
                                                </button>
                                                {!addr.is_default && (
                                                    <button onClick={() => setDefaultAddress(addr.id)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary transition-colors">
                                                        <span className="material-icons text-sm">star_outline</span>
                                                        {t.addresses.setDefault}
                                                    </button>
                                                )}
                                                <button onClick={() => deleteAddress(addr.id)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors ml-auto">
                                                    <span className="material-icons text-sm">delete_outline</span>
                                                    {t.addresses.deleteAddress}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </>
    )
}
