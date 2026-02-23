"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"

interface Stats {
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
}

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<Stats>({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAdminAndFetchStats()
    }, [])

    const checkAdminAndFetchStats = async () => {
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

        // Fetch stats
        const [productsRes, ordersRes] = await Promise.all([
            supabase.from("products").select("id", { count: "exact" }),
            supabase.from("orders").select("id, total, status"),
        ])

        const orders = ordersRes.data || []
        setStats({
            totalProducts: productsRes.count || 0,
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
            pendingOrders: orders.filter((o) => o.status === "pending").length,
        })
        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    const statCards = [
        {
            label: "Total Products",
            value: stats.totalProducts,
            icon: "inventory_2",
            color: "bg-blue-500/10 text-blue-600",
        },
        {
            label: "Total Orders",
            value: stats.totalOrders,
            icon: "receipt_long",
            color: "bg-green-500/10 text-green-600",
        },
        {
            label: "Revenue",
            value: `฿${stats.totalRevenue.toFixed(2)}`,
            icon: "payments",
            color: "bg-primary/10 text-primary",
        },
        {
            label: "Pending Orders",
            value: stats.pendingOrders,
            icon: "pending_actions",
            color: "bg-amber-500/10 text-amber-600",
        },
    ]

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
                        <span className="material-icons text-primary">restaurant</span>
                        <span className="text-lg font-bold tracking-tighter uppercase">
                            Prime<span className="text-primary">Cut</span>
                        </span>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2">
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                        >
                            View Store
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-xs uppercase tracking-widest text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                        >
                            <span className="material-icons text-sm">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-extrabold tracking-tight mb-8">
                    Dashboard
                </h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {statCards.map((s) => (
                        <div
                            key={s.label}
                            className="bg-white rounded-2xl p-6 border border-primary/5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}
                                >
                                    <span className="material-icons">{s.icon}</span>
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold">{s.value}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">
                                {s.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        href="/admin/products"
                        className="group bg-white rounded-2xl p-8 border border-primary/5 hover:shadow-xl transition-all flex items-center gap-6"
                    >
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-icons text-3xl">inventory_2</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Manage Products</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Add, edit, or remove products from your catalog
                            </p>
                        </div>
                        <span className="material-icons ml-auto text-gray-300 group-hover:text-primary transition-colors">
                            arrow_forward
                        </span>
                    </Link>

                    <Link
                        href="/admin/orders"
                        className="group bg-white rounded-2xl p-8 border border-primary/5 hover:shadow-xl transition-all flex items-center gap-6"
                    >
                        <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <span className="material-icons text-3xl">receipt_long</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Manage Orders</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                View and update order statuses
                            </p>
                        </div>
                        <span className="material-icons ml-auto text-gray-300 group-hover:text-green-600 transition-colors">
                            arrow_forward
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
