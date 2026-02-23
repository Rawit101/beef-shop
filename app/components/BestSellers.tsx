"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"
import { useLanguage } from "../../lib/i18n"

interface Product {
    id: string
    name: string
    slug: string
    description: string
    origin: string
    portion: string
    price: number
    badge: string | null
    image_url: string
}

const fallbackProducts: Product[] = [
    {
        id: "demo-1",
        name: "Signature Ribeye",
        slug: "miyazaki-wagyu-ribeye",
        description: "Australian Full-Blood Wagyu, 300g portion.",
        origin: "Australian Wagyu",
        portion: "300g",
        price: 85.0,
        badge: "MS 9+",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCw7AOxqSjAbH5XblTGWMl0ao-MtKn0rJbnecoasVtBVUmwOvvL8csVlSdWIhniO3LRXHVcrjOs3NTQK1LQFzLj8EEGOA8yygd_9-IW4NSc7vJOodMK40N9bAejwTQc3t3kMWtDw5rs2ItKFE_h_orYR4MOK96jbqVlT4BTtuuJ_LlesUt7rLLRe7sBpWRmMtlB-uxTn0xkwYcDc9e6-8cwvqVc7ztWHl5jgG-SUBALfHnIL5E7d2b2eg3p_eJEWQL-7sdo7CEvK9HZ",
    },
    {
        id: "demo-2",
        name: "Miyazaki Striploin",
        slug: "black-angus-striploin",
        description: "World-renowned Japanese A5 Wagyu, 250g.",
        origin: "Japanese A5",
        portion: "250g",
        price: 120.0,
        badge: "A5 GRADE",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDgqSP0xVg44XxN29N_ZKnepqIMraw3cAuW-hcGSxl2C4GhzliWWT8h18BPEe-Pi6IxU5rUCTbfwkGgRNMVbLRbJ6wi0l6cr8AJlGGkawSx6a3DigTq_ezy7Xi0_JogGy9toMqTquYuNSqMmrWD_JM_UAeGJsCcB06kJ3MnY7SUIfQ2ZmkCrAemQDXuqrKSa8pliRvRhIRl5YNzPkLCGcHzs_oRFoz0KSzGDsJqKNuyfimWTCODBgyggtCveSKzBSguXwPTAcd-Z10Q",
    },
    {
        id: "demo-3",
        name: "Prime Tomahawk",
        slug: "grand-tomahawk-steak",
        description: "USDA Prime Certified, 1.2kg center cut.",
        origin: "USDA Prime",
        portion: "1.2kg",
        price: 145.0,
        badge: "FAMILY SIZE",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAxaATTMLVvVmY16Y3ExdS2wif3DcfIfbEG_OooLbwAVvVBt28zuRqQcSEMjNhEDA98xAM9fYFCEZjUA-zBmsH_pN7pvBBHgFGIcEF_qYXJWL9O1DmdNg9pPd-BCAPvJUqBhLfyOcPVDAQ9H6SOIg71tfJzDyOK4FkXy6dc2VDl80-38pXqBDQu0AFbA3q8yGsoBxL005Wyi-68vpkLWu4w22gIJBUiXe7LEnJpO9A0q9JhAb48HKDY671b1CZpJm_i4k8nf_7fuDcN",
    },
    {
        id: "demo-4",
        name: "Classic Tenderloin",
        slug: "chateaubriand-tenderloin",
        description: "Grass-fed, pasture-raised beef, 200g.",
        origin: "Grass-fed",
        portion: "200g",
        price: 55.0,
        badge: "EXTRA LEAN",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBWHprhyjQ2lx8q6g55KwSOYw21agSWeKiS-j-zlaLptHU9deSn2wbPWF8g2XifpaIogiXlOW6PEU1JaRYuCkYIwN34JSWyxdEmEMbk3chw_5R4UfSZYva2zC_Z-5XKj06ZWMZGw2OBevoIYrfzUKCmMlR-WbMsr9WRk8sKPu1rrT0bMbNUYLlEldRHL9ERTgPGr4xWF4UtakhqJWWwPhdv3ks6MnG5JgHLPgcAsQ9EAX1puobSE4d4IprnzmlR7DgFZT6IEr792iyt",
    },
]

export default function BestSellers() {
    const { t } = useLanguage()
    const [products, setProducts] = useState<Product[]>(fallbackProducts)
    const [adding, setAdding] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)

    useEffect(() => {
        if (isSupabaseConfigured()) fetchProducts()
    }, [])

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from("products")
            .select("id, name, slug, description, origin, portion, price, badge, image_url")
            .order("price", { ascending: false })
            .limit(4)
        if (data && !error && data.length > 0) {
            setProducts(data)
        }
    }

    const addToCart = async (product: Product, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isSupabaseConfigured()) {
            setToast(`${product.name} added to cart!`)
            setTimeout(() => setToast(null), 2000)
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = "/login"
            return
        }

        setAdding(product.id)

        // Check if already in cart
        const { data: existing } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("product_id", product.id)
            .maybeSingle()

        if (existing) {
            await supabase
                .from("cart_items")
                .update({ quantity: existing.quantity + 1 })
                .eq("id", existing.id)
        } else {
            await supabase
                .from("cart_items")
                .insert({ user_id: user.id, product_id: product.id, quantity: 1 })
        }

        setAdding(null)
        setToast(`${product.name} added to cart! 🛒`)
        setTimeout(() => setToast(null), 2000)
        window.dispatchEvent(new Event("cart-updated"))
    }

    return (
        <section className="py-24 bg-background-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4">
                        {t.bestSellers.sectionLabel}
                    </h2>
                    <p className="text-4xl font-extrabold">{t.bestSellers.sectionTitle}</p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((p) => (
                        <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            className="group bg-white rounded-2xl overflow-hidden card-shadow block flex flex-col"
                        >
                            {/* Image */}
                            <div className="relative h-64 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    src={p.image_url}
                                    alt={p.name}
                                />
                                {p.badge && (
                                    <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-2 py-1 rounded">
                                        {p.badge}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg mb-2">{p.name}</h3>
                                <p className="text-sm text-gray-500 mb-6 flex-1">
                                    {p.description || `${p.origin}, ${p.portion}`}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-extrabold text-primary">
                                        ${p.price.toFixed(2)}
                                    </span>
                                    <button
                                        onClick={(e) => addToCart(p, e)}
                                        disabled={adding === p.id}
                                        className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                    >
                                        <span className="material-icons text-sm">
                                            {adding === p.id ? "autorenew" : "add_shopping_cart"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce-in">
                    <span className="material-icons text-green-400 text-lg">check_circle</span>
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}
        </section>
    )
}
