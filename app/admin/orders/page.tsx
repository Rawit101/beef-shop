"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

interface Order {
    id: string
    user_id: string
    status: string
    subtotal: number
    shipping: number
    tax: number
    total: number
    first_name: string
    last_name: string
    address: string
    city: string
    delivery_method: string
    created_at: string
}

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
}

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"]

export default function AdminOrders() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [orderItems, setOrderItems] = useState<
        Record<string, { product_name: string; quantity: number; unit_price: number }[]>
    >({})

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
        fetchOrders()
    }

    const fetchOrders = async () => {
        const { data } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
        setOrders(data || [])
        setLoading(false)
    }

    const updateStatus = async (orderId: string, newStatus: string) => {
        await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId)
        fetchOrders()
    }

    const toggleExpand = async (orderId: string) => {
        if (expandedId === orderId) {
            setExpandedId(null)
            return
        }
        setExpandedId(orderId)
        if (!orderItems[orderId]) {
            const { data } = await supabase
                .from("order_items")
                .select("product_name, quantity, unit_price")
                .eq("order_id", orderId)
            setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }))
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
                            href="/admin/products"
                            className="hover:text-white transition-colors"
                        >
                            Products
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-extrabold tracking-tight mb-8">Orders</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-16 text-center border border-primary/5">
                        <span className="material-icons text-5xl text-gray-300 mb-4">
                            receipt_long
                        </span>
                        <p className="text-gray-400 text-lg">No orders yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-primary/5 overflow-hidden"
                            >
                                {/* Order Row */}
                                <div
                                    onClick={() => toggleExpand(order.id)}
                                    className="flex items-center gap-6 px-6 py-5 cursor-pointer hover:bg-primary/[0.02] transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-bold text-sm">
                                                #{order.id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100"
                                                    }`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {order.first_name} {order.last_name} •{" "}
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-extrabold">
                                            ฿{Number(order.total).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                                            {order.delivery_method === "express"
                                                ? "Express"
                                                : "Standard"}
                                        </p>
                                    </div>
                                    <span
                                        className={`material-icons text-gray-300 transition-transform ${expandedId === order.id ? "rotate-180" : ""
                                            }`}
                                    >
                                        expand_more
                                    </span>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === order.id && (
                                    <div className="px-6 pb-6 border-t border-primary/5 pt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                                                    Subtotal
                                                </p>
                                                <p className="font-semibold">
                                                    ฿{Number(order.subtotal).toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                                                    Shipping
                                                </p>
                                                <p className="font-semibold">
                                                    ฿{Number(order.shipping).toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                                                    Tax
                                                </p>
                                                <p className="font-semibold">
                                                    ฿{Number(order.tax).toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                                                    Address
                                                </p>
                                                <p className="font-semibold text-sm">
                                                    {order.address}, {order.city}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        {orderItems[order.id] && (
                                            <div className="mb-6">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">
                                                    Items
                                                </p>
                                                <div className="space-y-2">
                                                    {orderItems[order.id].map((item, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex justify-between text-sm"
                                                        >
                                                            <span>
                                                                {item.product_name} × {item.quantity}
                                                            </span>
                                                            <span className="font-semibold">
                                                                $
                                                                {(
                                                                    Number(item.unit_price) * item.quantity
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Status Update */}
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mr-2">
                                                Update:
                                            </p>
                                            {STATUS_FLOW.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => updateStatus(order.id, s)}
                                                    disabled={order.status === s}
                                                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${order.status === s
                                                        ? STATUS_COLORS[s] + " cursor-default"
                                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => updateStatus(order.id, "cancelled")}
                                                disabled={order.status === "cancelled"}
                                                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all ml-auto"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
