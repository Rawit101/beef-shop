"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "../components/Navbar"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"
import { useLanguage } from "../../lib/i18n"

interface CartItem {
    id: string
    product_id: string
    quantity: number
    product: {
        name: string
        price: number
        image_url: string
        portion: string
    }
}

const fallbackItems: CartItem[] = [
    {
        id: "demo-1",
        product_id: "demo-1",
        quantity: 1,
        product: {
            name: "A5 Wagyu Ribeye - Miyazaki",
            price: 185.0,
            image_url:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCztoopOmBcI7RBJ1e1XSv0LF6_czCzZRFuRsiJ1MtR_37z16WFhSzFnaYCZctAhkL0J2yA_U_MZPsHDOeS1JA-icazTQ-KULdf-7SkmZIaMt4rOgXlKeCc0qCMCyYa-SVuRVSGJpJntAfoAgTKRI9rcFmy9h5XqgKzmkdSelzXsWa6CoTR6XInKWwZa6Ifsc_BGog-D-BFGHFg_SEflUw8WIdzo7FvZQPaG1NcpwYtvtFDtzc2XJkYC0CYMPGMno35ia3BIH_dkxcw",
            portion: "450g | Prime Steak",
        },
    },
]

export default function CheckoutPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [placing, setPlacing] = useState(false)
    const [delivery, setDelivery] = useState("express")
    const [paymentTab, setPaymentTab] = useState("card")
    const [orderSuccess, setOrderSuccess] = useState(false)
    const [modalMsg, setModalMsg] = useState<string | null>(null)

    // Shipping form
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const [postcode, setPostcode] = useState("")

    // Saved addresses
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
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
    const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null)

    useEffect(() => {
        fetchCart()
    }, [])

    const fetchCart = async () => {
        if (!isSupabaseConfigured()) {
            setCartItems(fallbackItems)
            setLoading(false)
            return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setCartItems([])
            setLoading(false)
            return
        }
        const { data, error } = await supabase
            .from("cart_items")
            .select("id, product_id, quantity, products(name, price, image_url, portion)")
            .eq("user_id", user.id)
        if (error) {
            console.error("Fetch cart error:", error)
        }
        if (data) {
            setCartItems(
                data.map((item: Record<string, unknown>) => ({
                    id: item.id as string,
                    product_id: item.product_id as string,
                    quantity: item.quantity as number,
                    product: item.products as CartItem["product"],
                }))
            )
        }

        // Load saved addresses
        const { data: addrData } = await supabase
            .from("saved_addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false })
        if (addrData && addrData.length > 0) {
            setSavedAddresses(addrData as SavedAddress[])
            // Auto-select default address
            const defaultAddr = addrData.find((a: SavedAddress) => a.is_default) || addrData[0]
            if (defaultAddr) {
                selectAddress(defaultAddr as SavedAddress)
            }
        }

        setLoading(false)
    }

    const selectAddress = (addr: SavedAddress) => {
        setSelectedAddrId(addr.id)
        setFirstName(addr.first_name)
        setLastName(addr.last_name)
        setAddress(addr.address)
        setCity(addr.city)
        setPostcode(addr.postcode)
    }

    const updateQty = async (id: string, delta: number) => {
        const item = cartItems.find((i) => i.id === id)
        if (!item) return
        const newQty = Math.max(1, item.quantity + delta)
        setCartItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
        )
        if (isSupabaseConfigured()) {
            await supabase.from("cart_items").update({ quantity: newQty }).eq("id", id)
        }
    }

    const removeItem = async (id: string) => {
        setCartItems((prev) => prev.filter((i) => i.id !== id))
        if (isSupabaseConfigured()) {
            await supabase.from("cart_items").delete().eq("id", id)
        }
    }

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    )
    const shipping = delivery === "express" ? 24.0 : 12.0
    const taxes = subtotal * 0.05
    const total = subtotal + shipping + taxes

    const placeOrder = async () => {
        if (!firstName || !lastName || !address || !city) {
            setModalMsg(t.checkout.fillFieldsWarning)
            return
        }
        if (cartItems.length === 0) {
            setModalMsg(t.checkout.emptyCartWarning)
            return
        }

        setPlacing(true)

        if (!isSupabaseConfigured()) {
            await new Promise((r) => setTimeout(r, 1500))
            setOrderSuccess(true)
            setPlacing(false)
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push("/login")
            return
        }

        // Generate tracking number
        const trackingNumber = `CC-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

        // Create order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_id: user.id,
                subtotal,
                shipping,
                tax: taxes,
                total,
                first_name: firstName,
                last_name: lastName,
                address,
                city,
                postcode,
                delivery_method: delivery,
                payment_method: paymentTab,
                tracking_number: trackingNumber,
            })
            .select()
            .single()

        if (orderError || !order) {
            setModalMsg(t.checkout.failedOrder)
            setPlacing(false)
            return
        }

        // Create order items
        const orderItems = cartItems.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
        }))

        await supabase.from("order_items").insert(orderItems)

        // Clear cart
        await supabase.from("cart_items").delete().eq("user_id", user.id)

        setPlacing(false)
        setOrderSuccess(true)
    }

    const steps = [
        { icon: "shopping_cart", label: t.checkout.cartStep, active: true },
        { icon: "local_shipping", label: t.checkout.shippingStep, active: false },
        { icon: "payments", label: t.checkout.paymentStep, active: false },
    ]

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

    if (orderSuccess) {
        return (
            <>
                <Navbar />
                <main className="max-w-2xl mx-auto px-6 py-24 text-center">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="material-icons text-white text-4xl">check</span>
                    </div>
                    <h1 className="text-4xl font-extrabold mb-4">{t.checkout.orderConfirmed}</h1>
                    <p className="text-lg text-slate-500 mb-2">
                        {t.checkout.thankYou.replace("{name}", firstName)}
                    </p>
                    <p className="text-sm text-slate-400 mb-8">
                        {delivery === "express"
                            ? t.checkout.expressArriving
                            : t.checkout.standardArriving}
                    </p>
                    <div className="bg-white border border-primary/10 rounded-2xl p-8 mb-8">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                    {t.checkout.subtotal}
                                </p>
                                <p className="font-semibold">฿{subtotal.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                    {t.checkout.shippingCost}
                                </p>
                                <p className="font-semibold">฿{shipping.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                    {t.checkout.taxes}
                                </p>
                                <p className="font-semibold">฿{taxes.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                    {t.checkout.total}
                                </p>
                                <p className="font-bold text-primary text-lg">฿{total.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/products"
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-red-700 transition-colors"
                        >
                            {t.checkout.continueShopping}
                        </Link>
                        <Link
                            href="/"
                            className="px-8 py-3 border-2 border-primary text-primary rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-white transition-all"
                        >
                            {t.checkout.home}
                        </Link>
                    </div>
                </main>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Progress Stepper */}
                <div className="flex justify-center mb-16">
                    <div className="flex items-center w-full max-w-2xl">
                        {steps.map((step, idx) => (
                            <div key={step.label} className="contents">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 ${step.active
                                            ? "border-primary bg-primary text-white"
                                            : "border-primary/20 bg-white"
                                            }`}
                                    >
                                        <span
                                            className={`material-icons text-sm ${step.active ? "" : "text-primary/40"
                                                }`}
                                        >
                                            {step.icon}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-xs font-bold uppercase tracking-widest ${step.active ? "text-primary" : "text-slate-400"
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="h-[2px] flex-1 bg-primary/20 mb-6" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Section: Review Items */}
                        <section>
                            <div className="flex items-end justify-between mb-6">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    {t.checkout.yourSelection}
                                </h2>
                                <span className="text-slate-400 text-sm italic">
                                    ({cartItems.length} {t.checkout.itemsInCart})
                                </span>
                            </div>

                            {cartItems.length === 0 ? (
                                <div className="bg-white border border-primary/5 rounded-xl p-16 text-center">
                                    <span className="material-icons text-5xl text-slate-200 mb-4">
                                        shopping_cart
                                    </span>
                                    <p className="text-slate-400 text-lg mb-4">{t.checkout.emptyCart}</p>
                                    <Link
                                        href="/products"
                                        className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                                    >
                                        {t.checkout.browseProducts}
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group flex items-center gap-6 p-4 bg-white border border-primary/5 rounded-xl hover:shadow-xl transition-all"
                                        >
                                            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    src={item.product.image_url}
                                                    alt={item.product.name}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h3 className="text-lg font-bold">{item.product.name}</h3>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-slate-300 hover:text-primary transition-colors"
                                                    >
                                                        <span className="material-icons text-xl">close</span>
                                                    </button>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {item.product.portion}
                                                </p>
                                                <div className="flex items-center gap-4 mt-6">
                                                    <div className="flex items-center border border-slate-200 rounded-lg">
                                                        <button
                                                            onClick={() => updateQty(item.id, -1)}
                                                            className="px-3 py-1 hover:bg-slate-50"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-1 text-sm font-medium">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQty(item.id, 1)}
                                                            className="px-3 py-1 hover:bg-slate-50"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <span className="text-xl font-bold text-primary">
                                                        $
                                                        {(item.product.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Section: Shipping & Delivery */}
                        {cartItems.length > 0 && (
                            <section className="space-y-8">
                                {/* Shipping Address */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center text-sm">
                                            1
                                        </span>
                                        {t.checkout.shippingAddress}
                                    </h2>

                                    {/* Saved Addresses Picker */}
                                    {savedAddresses.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex flex-wrap gap-3">
                                                {savedAddresses.map((addr) => (
                                                    <button
                                                        key={addr.id}
                                                        onClick={() => selectAddress(addr)}
                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${selectedAddrId === addr.id
                                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                                                            : "border-gray-200 hover:border-primary/30 text-gray-600"
                                                            }`}
                                                    >
                                                        <span className="material-icons text-base">
                                                            {selectedAddrId === addr.id ? "radio_button_checked" : "radio_button_unchecked"}
                                                        </span>
                                                        <span className="font-bold">{addr.label}</span>
                                                        <span className="text-gray-400">• {addr.first_name} {addr.last_name}</span>
                                                        {addr.is_default && (
                                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{t.checkout.defaultBadge}</span>
                                                        )}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        setSelectedAddrId(null)
                                                        setFirstName("")
                                                        setLastName("")
                                                        setAddress("")
                                                        setCity("")
                                                        setPostcode("")
                                                    }}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${selectedAddrId === null
                                                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                                                        : "border-gray-200 hover:border-primary/30 text-gray-600"
                                                        }`}
                                                >
                                                    <span className="material-icons text-base">add</span>
                                                    {t.checkout.newAddress}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                {t.checkout.firstName}
                                            </label>
                                            <input
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full bg-white border border-primary/10 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                                                placeholder={t.checkout.firstNamePlaceholder}
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                {t.checkout.lastName}
                                            </label>
                                            <input
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full bg-white border border-primary/10 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                                                placeholder={t.checkout.lastNamePlaceholder}
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                {t.checkout.addressLabel}
                                            </label>
                                            <input
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="w-full bg-white border border-primary/10 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                                                placeholder={t.checkout.addressPlaceholder}
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                {t.checkout.city}
                                            </label>
                                            <input
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                className="w-full bg-white border border-primary/10 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                                                placeholder={t.checkout.cityPlaceholder}
                                                type="text"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                {t.checkout.postcode}
                                            </label>
                                            <input
                                                value={postcode}
                                                onChange={(e) => setPostcode(e.target.value)}
                                                className="w-full bg-white border border-primary/10 rounded-lg px-4 py-3 focus:ring-primary focus:border-primary transition-all"
                                                placeholder={t.checkout.postcodePlaceholder}
                                                type="text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Cold-Chain Delivery */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center text-sm">
                                            2
                                        </span>
                                        {t.checkout.coldChainDelivery}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Express */}
                                        <label className="relative cursor-pointer group">
                                            <input
                                                checked={delivery === "express"}
                                                onChange={() => setDelivery("express")}
                                                className="peer sr-only"
                                                name="delivery"
                                                type="radio"
                                            />
                                            <div className="p-6 bg-white border-2 border-primary/5 rounded-xl peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="material-icons text-primary text-3xl">
                                                        ac_unit
                                                    </span>
                                                    <span className="text-sm font-bold text-primary">
                                                        {t.checkout.priority}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold">{t.checkout.nextDayCold}</h4>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {t.checkout.nextDayDesc}
                                                </p>
                                                <div className="mt-4 flex justify-between items-end">
                                                    <span className="text-xs text-slate-400 italic">
                                                        {t.checkout.deliveryTomorrow}
                                                    </span>
                                                    <span className="font-bold text-lg">฿24.00</span>
                                                </div>
                                            </div>
                                        </label>

                                        {/* Standard */}
                                        <label className="relative cursor-pointer group">
                                            <input
                                                checked={delivery === "standard"}
                                                onChange={() => setDelivery("standard")}
                                                className="peer sr-only"
                                                name="delivery"
                                                type="radio"
                                            />
                                            <div className="p-6 bg-white border-2 border-primary/5 rounded-xl peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="material-icons text-slate-400 text-3xl">
                                                        local_shipping
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-400">
                                                        {t.checkout.standard}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold">{t.checkout.standardCold}</h4>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {t.checkout.standardDesc}
                                                </p>
                                                <div className="mt-4 flex justify-between items-end">
                                                    <span className="text-xs text-slate-400 italic">
                                                        {t.checkout.deliveryDays}
                                                    </span>
                                                    <span className="font-bold text-lg">฿12.00</span>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Secure Payment */}
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center text-sm">
                                            3
                                        </span>
                                        {t.checkout.securePayment}
                                    </h2>
                                    <div className="bg-white border border-primary/5 rounded-xl overflow-hidden">
                                        {/* Payment Tabs */}
                                        <div className="flex border-b border-primary/5">
                                            <button
                                                onClick={() => setPaymentTab("card")}
                                                className={`flex-1 py-4 border-b-2 flex items-center justify-center gap-2 ${paymentTab === "card"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-transparent hover:bg-slate-50"
                                                    }`}
                                            >
                                                <span className="material-icons text-sm">
                                                    credit_card
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    Credit Card
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentTab("qr")}
                                                className={`flex-1 py-4 border-b-2 flex items-center justify-center gap-2 ${paymentTab === "qr"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-transparent hover:bg-slate-50"
                                                    }`}
                                            >
                                                <span className="material-icons text-sm">
                                                    qr_code_2
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    QR / Wallet
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setPaymentTab("bank")}
                                                className={`flex-1 py-4 border-b-2 flex items-center justify-center gap-2 ${paymentTab === "bank"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-transparent hover:bg-slate-50"
                                                    }`}
                                            >
                                                <span className="material-icons text-sm">
                                                    account_balance
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {t.checkout.bankTransfer}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Payment Content */}
                                        {paymentTab === "card" && (
                                            <div className="p-8 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                        {t.checkout.cardNumber}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            className="w-full bg-background-light border-transparent rounded-lg px-4 py-3 focus:ring-primary transition-all"
                                                            placeholder="0000 0000 0000 0000"
                                                            type="text"
                                                        />
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                                            <span className="text-xs text-slate-400 font-bold">
                                                                VISA
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-bold">
                                                                MC
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                            {t.checkout.expiryDate}
                                                        </label>
                                                        <input
                                                            className="w-full bg-background-light border-transparent rounded-lg px-4 py-3 focus:ring-primary transition-all"
                                                            placeholder="MM / YY"
                                                            type="text"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                            {t.checkout.cvv}
                                                        </label>
                                                        <input
                                                            className="w-full bg-background-light border-transparent rounded-lg px-4 py-3 focus:ring-primary transition-all"
                                                            placeholder="123"
                                                            type="text"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {paymentTab === "qr" && (
                                            <div className="p-8 text-center">
                                                <div className="inline-block bg-white border-2 border-primary/10 rounded-2xl p-4 mb-6 shadow-sm">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src="/images/mockup.png"
                                                        alt="QR Code for payment"
                                                        className="w-56 h-56 object-contain mx-auto"
                                                    />
                                                </div>
                                                <h4 className="font-bold text-lg mb-2">{t.checkout.scanToPay}</h4>
                                                <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
                                                    {t.checkout.scanDesc}
                                                </p>
                                                <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-lg text-sm font-bold">
                                                    <span className="material-icons text-base">info</span>
                                                    {t.checkout.amount}: ฿{total.toFixed(2)}
                                                </div>
                                            </div>
                                        )}

                                        {paymentTab === "bank" && (
                                            <div className="p-8">
                                                <div className="bg-background-light rounded-xl p-6 mb-6">
                                                    <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-4">
                                                        {t.checkout.transferDetails}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500">{t.checkout.bankName}</span>
                                                            <span className="text-sm font-bold">{t.checkout.bankNameValue}</span>
                                                        </div>
                                                        <div className="h-px bg-primary/5" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500">{t.checkout.accountName}</span>
                                                            <span className="text-sm font-bold">{t.checkout.accountNameValue}</span>
                                                        </div>
                                                        <div className="h-px bg-primary/5" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500">{t.checkout.accountNumber}</span>
                                                            <span className="text-sm font-bold font-mono">XXX-X-XXXXX-X</span>
                                                        </div>
                                                        <div className="h-px bg-primary/5" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-slate-500">{t.checkout.amount}</span>
                                                            <span className="text-sm font-bold text-primary">฿{total.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                    <span className="material-icons text-amber-500 text-xl mt-0.5">warning</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-amber-800 mb-1">{t.checkout.important}</p>
                                                        <p className="text-xs text-amber-700 leading-relaxed">
                                                            {t.checkout.transferDesc}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Order Summary (Sticky) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-6">
                            <div className="bg-white border border-primary/10 rounded-2xl p-8 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 pb-6 border-b border-primary/5">
                                    {t.checkout.orderSummary}
                                </h3>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-slate-500">
                                        <span>{t.checkout.subtotal}</span>
                                        <span className="font-medium">฿{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>
                                            {t.checkout.shippingCost} ({delivery === "express" ? t.checkout.priority : t.checkout.standard}
                                            )
                                        </span>
                                        <span className="font-medium">฿{shipping.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>{t.checkout.taxes}</span>
                                        <span className="font-medium">฿{taxes.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-primary/5 flex justify-between items-end">
                                        <span className="text-lg font-bold">{t.checkout.total}</span>
                                        <div className="text-right">
                                            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">
                                                {t.checkout.secureTransaction}
                                            </p>
                                            <span className="text-3xl font-bold tracking-tighter">
                                                ฿{total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 bg-background-light border-transparent rounded-lg px-4 py-2 text-sm focus:ring-primary"
                                            placeholder={t.checkout.discountCode}
                                            type="text"
                                        />
                                        <button className="px-4 py-2 border border-primary text-primary text-xs font-bold uppercase rounded-lg hover:bg-primary hover:text-white transition-all">
                                            {t.checkout.apply}
                                        </button>
                                    </div>
                                    <button
                                        onClick={placeOrder}
                                        disabled={placing || cartItems.length === 0}
                                        className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {placing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="material-icons animate-spin text-base">
                                                    autorenew
                                                </span>
                                                {t.checkout.processing}
                                            </span>
                                        ) : (
                                            t.checkout.placeOrder
                                        )}
                                    </button>
                                </div>

                                {/* Payment Icons */}
                                <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        className="h-6 object-contain"
                                        alt="Visa payment icon"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDerAP7l4hrXjPKOjx6EIHV5uIzrlJpGMB4A3drAvooHdGfsUuvrva7nJh_9ddg0544Q0UeFQKeoxJ7v4pUhfaQzXoMCtYxlA9Aj6fJJe2qH53bnDe5miIJPkw1kXo9Ks8GukR-6sZGQ0nVDq5bv2SwvuP5Sd-v6RGn896Nz9f28VKxrN2BWdvLOx5S3oR00R2ADFDxSxHoI4Asx_20mAC-6DZt88UN95VTeLnTMYUzQt3xqbCYB64nILB_Mp2qnCaRN6uZYebPppIl"
                                    />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        className="h-6 object-contain"
                                        alt="Mastercard payment icon"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlKemgh30gZx6BEZi5dzjYLOyNxuxcV5zrwqwR8zdX16p1UWiZj4d74Ef2AP4sv0_4t50R0aB20CaYoaXNSyZG_MuqwjxZOjBPafxM2IIs21F40fiCI6iK_BcqgKX2zZDM3fghaPDSHin75oU7I2VLAvDoU2zzmIm24Eu9nyfkQgpx0pWMf4hvki1gHnuFg22uODubF8kPk2BTUl2SDv7ky3Hxqt5X9lJ-apCk_KeQAyt9t41rsj5fr-EBpNwmlf6OWk_x50Iy_hSS"
                                    />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        className="h-8 object-contain"
                                        alt="Stripe secure payment icon"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPVC_kRAPv5ARfVffNHkRgiy1fn800N35LoPOGIoaqHyOx4Gcu-DfG6D9wvQqyzKiSxcKVO5udYEh5MUfGBG1rWi5bX3pnl6K8TFvxUkm-yOIWc6H9Ap1Y-LVepJcjv-XrWRfdDMzW39IkdCH9uGSdNd9pm21CavzDRoOq5meqDOB7q5R9BOF5huwJY7vqwwXAWO9VjxAhkf6yDbhf0Mdhunm99PcT8BiX5n_rQIf7YW5kNjJAbFqiBQBdzFhREFe7bs7HlOjNVakT"
                                    />
                                </div>
                            </div>

                            {/* Trust Cards */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl border border-primary/5">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                                        <span className="material-icons text-xl">
                                            verified_user
                                        </span>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-bold uppercase">
                                            {t.checkout.qualityGuaranteed}
                                        </h5>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                            {t.checkout.certified}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl border border-primary/5">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                        <span className="material-icons text-xl">thermostat</span>
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-bold uppercase">
                                            {t.checkout.freshnessLock}
                                        </h5>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                            {t.checkout.coldMonitoring}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-24 py-12 border-t border-primary/10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 opacity-50">
                        <span className="material-icons text-xl">restaurant</span>
                        <span className="text-lg font-bold tracking-tighter uppercase">
                            The Prime Cut
                        </span>
                    </div>
                    <div className="flex gap-12">
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                                {t.footer.contactTitle}
                            </span>
                            <p className="text-sm font-medium">{t.footer.email}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                                {t.footer.heritage}
                            </span>
                            <p className="text-sm font-medium">{t.footer.since}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Link href="#" className="text-slate-400 hover:text-primary transition-colors">
                            <span className="material-icons">facebook</span>
                        </Link>
                        <Link href="#" className="text-slate-400 hover:text-primary transition-colors">
                            <span className="material-icons">camera_alt</span>
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Custom Modal */}
            {modalMsg && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-bounce-in">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                                <span className="material-icons text-primary text-3xl">info</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t.checkout.notice}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{modalMsg}</p>
                        </div>
                        <div className="px-8 pb-8">
                            <button
                                onClick={() => setModalMsg(null)}
                                className="w-full bg-primary hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors"
                            >
                                {t.checkout.ok}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
