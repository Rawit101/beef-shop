"use client"

import { useState } from "react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"

/* ─── Types ─── */
interface OrderItem {
    id: string
    product_name: string
    quantity: number
    unit_price: number
}

interface OrderData {
    id: string
    status: string
    total: number
    first_name: string
    last_name: string
    city: string
    delivery_method: string
    tracking_number: string
    created_at: string
    order_items: OrderItem[]
}

/* ─── Status / step mapping ─── */
const STEP_MAP: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    shipped: 2,
    delivered: 3,
}

const STEPS = [
    { label: "Order Confirmed", icon: "check" },
    { label: "Aged & Prepared", icon: "restaurant" },
    { label: "In Transit (Cold Chain)", icon: "local_shipping" },
    { label: "Delivered", icon: "inventory" },
]

const HANDLING = [
    {
        icon: "ac_unit",
        title: "Immediate Refrigeration",
        desc: "Remove from the courier box immediately. Keep vacuum-sealed and store in the coldest part of your refrigerator (32°F – 36°F).",
    },
    {
        icon: "water_drop",
        title: "The Perfect Thaw",
        desc: "If frozen, thaw in the refrigerator for 24-48 hours. Never use a microwave or hot water, it damages the fat marbling structure.",
    },
    {
        icon: "thermostat",
        title: "Room Temp Tempering",
        desc: "Remove from the fridge 30-45 minutes before searing. Bringing the meat to room temperature ensures an even, perfect cook.",
    },
]

export default function OrderTrackingPage() {
    const [trackingInput, setTrackingInput] = useState("")
    const [order, setOrder] = useState<OrderData | null>(null)
    const [searching, setSearching] = useState(false)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    const copyTracking = () => {
        if (!order) return
        navigator.clipboard.writeText(order.tracking_number)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const searchOrder = async () => {
        const input = trackingInput.trim()
        if (!input) {
            setError("Please enter a tracking number")
            return
        }

        setSearching(true)
        setError("")
        setOrder(null)

        if (!isSupabaseConfigured()) {
            // Demo fallback
            await new Promise((r) => setTimeout(r, 800))
            setOrder({
                id: "demo-order-id",
                status: "shipped",
                total: 209.0,
                first_name: "John",
                last_name: "D.",
                city: "Bangkok",
                delivery_method: "express",
                tracking_number: input,
                created_at: new Date().toISOString(),
                order_items: [
                    { id: "1", product_name: "A5 Wagyu Ribeye", quantity: 1, unit_price: 129.0 },
                    { id: "2", product_name: "Grand Tomahawk Steak", quantity: 1, unit_price: 145.0 },
                ],
            })
            setSearching(false)
            return
        }

        const { data, error: fetchError } = await supabase
            .from("orders")
            .select(`
                id, status, total, first_name, last_name, city,
                delivery_method, tracking_number, created_at,
                order_items ( id, product_name, quantity, unit_price )
            `)
            .eq("tracking_number", input)
            .single()

        if (fetchError || !data) {
            setError("No order found with this tracking number. Please check and try again.")
            setSearching(false)
            return
        }

        setOrder(data as OrderData)
        setSearching(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") searchOrder()
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })

    const activeStepIdx = order ? (STEP_MAP[order.status] ?? 0) : -1

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-background-light">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

                    {/* ═══════════════════════════════════════════ */}
                    {/* SEARCH SCREEN                              */}
                    {/* ═══════════════════════════════════════════ */}
                    {!order && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh]">
                            {/* Icon */}
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <span className="material-icons text-4xl text-primary">local_shipping</span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center mb-2">
                                Track Your Order
                            </h1>
                            <p className="text-gray-400 text-sm mb-8 text-center max-w-md">
                                Enter your tracking number to see real-time updates on your premium delivery.
                            </p>

                            {/* Input */}
                            <div className="w-full max-w-lg">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xl">
                                            search
                                        </span>
                                        <input
                                            type="text"
                                            value={trackingInput}
                                            onChange={(e) => { setTrackingInput(e.target.value); setError("") }}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. CC-992-881-024"
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-lg font-medium tracking-wider placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={searchOrder}
                                        disabled={searching}
                                        className="px-8 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {searching ? (
                                            <span className="material-icons animate-spin text-xl">autorenew</span>
                                        ) : (
                                            "Track"
                                        )}
                                    </button>
                                </div>

                                {error && (
                                    <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
                                        <span className="material-icons text-base">error_outline</span>
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* Hint */}
                            <p className="mt-6 text-xs text-gray-400 text-center">
                                Your tracking number is in the format <span className="font-bold text-charcoal">CC-XXX-XXX-XXX</span> and can be found in your order confirmation email or{" "}
                                <a href="/profile" className="text-primary font-bold hover:underline">order history</a>.
                            </p>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════ */}
                    {/* ORDER DETAILS                              */}
                    {/* ═══════════════════════════════════════════ */}
                    {order && (
                        <>
                            {/* Back button */}
                            <button
                                onClick={() => { setOrder(null); setTrackingInput("") }}
                                className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary transition-colors mb-6"
                            >
                                <span className="material-icons text-base">arrow_back</span>
                                Track another order
                            </button>

                            {/* ─── Header ─── */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-10">
                                <div>
                                    <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-1">
                                        Order Tracking
                                    </p>
                                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                        Order for {order.first_name} {order.last_name}
                                    </h1>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Placed on {formatDate(order.created_at)}
                                    </p>
                                </div>

                                <div className="flex-shrink-0 border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-4 bg-white">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase">
                                            Tracking Number
                                        </p>
                                        <p className="text-lg font-bold tracking-wide">
                                            {order.tracking_number}
                                        </p>
                                    </div>
                                    <button
                                        onClick={copyTracking}
                                        className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-primary/10 flex items-center justify-center transition-colors"
                                        title="Copy tracking number"
                                    >
                                        <span className="material-icons text-lg text-gray-500">
                                            {copied ? "check" : "content_copy"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* ─── Progress Stepper ─── */}
                            <div className="bg-white rounded-2xl border border-gray-100 px-6 py-8 mb-8">
                                <div className="flex items-start justify-between relative">
                                    <div className="absolute top-5 left-0 right-0 h-[3px] bg-gray-200 z-0" />
                                    <div
                                        className="absolute top-5 left-0 h-[3px] bg-primary z-[1] transition-all duration-700"
                                        style={{
                                            width: `${(activeStepIdx / (STEPS.length - 1)) * 100}%`,
                                        }}
                                    />

                                    {STEPS.map((step, i) => (
                                        <div
                                            key={i}
                                            className="relative z-10 flex flex-col items-center text-center"
                                            style={{ width: `${100 / STEPS.length}%` }}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-base mb-3 transition-all ${i <= activeStepIdx
                                                    ? i === activeStepIdx
                                                        ? "bg-primary ring-4 ring-primary/20 tracking-pulse"
                                                        : "bg-primary"
                                                    : "bg-gray-300"
                                                    }`}
                                            >
                                                <span className="material-icons text-lg">
                                                    {i < activeStepIdx
                                                        ? "check"
                                                        : i === activeStepIdx
                                                            ? step.icon
                                                            : "radio_button_unchecked"}
                                                </span>
                                            </div>
                                            <p className={`text-xs font-bold uppercase tracking-wide ${i <= activeStepIdx ? "text-charcoal" : "text-gray-400"}`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ─── Delivery + Activity ─── */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">
                                {/* Map card */}
                                <div className="lg:col-span-3 relative rounded-2xl overflow-hidden min-h-[380px] delivery-map-bg">
                                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                                        <span className="self-start bg-charcoal/80 backdrop-blur text-white text-[11px] font-bold tracking-[0.12em] uppercase px-4 py-2 rounded-lg">
                                            Live Delivery Status
                                        </span>

                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="relative">
                                                <span className="material-icons text-primary text-5xl drop-shadow-lg">
                                                    location_on
                                                </span>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-sm" />
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div className="bg-charcoal/80 backdrop-blur rounded-xl px-5 py-3 flex items-center gap-3">
                                                <span className="material-icons text-blue-400 text-xl">thermostat</span>
                                                <div>
                                                    <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">Internal Package Temp</p>
                                                    <p className="text-white text-xl font-bold">
                                                        34.2° F <span className="text-green-400 text-xs font-semibold ml-1">Stable</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-charcoal/80 backdrop-blur rounded-xl px-5 py-3 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm">MJ</div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cold Chain Courier</p>
                                                    <p className="text-white font-bold">Marcus J.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity log */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                                    <h3 className="text-lg font-extrabold mb-6">Order Items</h3>

                                    <div className="space-y-3 mb-6">
                                        {order.order_items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="font-bold text-sm">{item.product_name}</p>
                                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-bold text-sm text-primary">
                                                    ฿{(Number(item.unit_price) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
                                        <span className="text-sm font-bold">Total</span>
                                        <span className="text-xl font-extrabold text-primary">฿{Number(order.total).toFixed(2)}</span>
                                    </div>

                                    <button className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors">
                                        <span className="material-icons text-base">receipt_long</span>
                                        Download Full Invoice
                                    </button>
                                </div>
                            </div>

                            {/* ─── Handling Your Selection ─── */}
                            <div className="mb-14">
                                <h2 className="text-2xl font-extrabold mb-1">Handling Your Selection</h2>
                                <p className="text-sm text-gray-400 mb-8">
                                    Follow these steps to ensure the peak flavor profile of your luxury cuts.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {HANDLING.map((h, i) => (
                                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                                                <span className="material-icons text-primary text-2xl">{h.icon}</span>
                                            </div>
                                            <h3 className="font-bold text-base mb-2">{h.title}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">{h.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ─── Concierge Banner ─── */}
                            <div className="bg-charcoal rounded-2xl px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-white text-xl font-extrabold mb-1">Need assistance with your order?</h3>
                                    <p className="text-gray-400 text-sm">Our concierge master butchers are available for prep and cooking advice.</p>
                                </div>
                                <div className="flex gap-3 flex-shrink-0">
                                    <button className="bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors">
                                        Contact Concierge
                                    </button>
                                    <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors border border-white/10">
                                        FAQs
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </>
    )
}
