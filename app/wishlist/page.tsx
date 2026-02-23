"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"
import { useLanguage } from "../../lib/i18n"

interface WishlistProduct {
    id: string
    product_id: string
    products: {
        id: string
        name: string
        slug: string
        price: number
        image_url: string
        origin: string
        portion: string
        badge: string | null
        mb_score: boolean
        category: string
    }
}

export default function WishlistPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [items, setItems] = useState<WishlistProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState<string | null>(null)

    useEffect(() => {
        loadWishlist()
    }, [])

    const loadWishlist = async () => {
        if (!isSupabaseConfigured()) {
            setLoading(false)
            return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push("/login")
            return
        }
        const { data, error } = await supabase
            .from("wishlists")
            .select(`
                id,
                product_id,
                products (
                    id, name, slug, price, image_url, origin, portion, badge, mb_score, category
                )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Fetch wishlist error details:", JSON.stringify(error, null, 2))
            console.error("Message:", error.message, "Code:", error.code)
        }
        if (data) {
            setItems(data as unknown as WishlistProduct[])
        }
        setLoading(false)
    }

    const removeFromWishlist = async (wishlistId: string) => {
        setItems(prev => prev.filter(i => i.id !== wishlistId))
        if (isSupabaseConfigured()) {
            await supabase.from("wishlists").delete().eq("id", wishlistId)
        }
        setToast(t.wishlist.removedToast)
        setTimeout(() => setToast(null), 2000)
        window.dispatchEvent(new Event("wishlist-updated"))
    }

    const addToCart = async (product: WishlistProduct["products"], e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isSupabaseConfigured()) {
            setToast(`${product.name} added to cart! 🛒`)
            setTimeout(() => setToast(null), 2000)
            return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = "/login"
            return
        }
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
        setToast(`${product.name} added to cart! 🛒`)
        setTimeout(() => setToast(null), 2000)
        window.dispatchEvent(new Event("cart-updated"))
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
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
                    {/* Header */}
                    <div className="mb-10">
                        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-1">
                            ❤️ {t.wishlist.title}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            {t.wishlist.title}
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {items.length} {t.products.productsCount}
                        </p>
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                            <span className="material-icons text-6xl text-gray-200 mb-4">
                                favorite_border
                            </span>
                            <h3 className="text-xl font-bold mb-2">{t.wishlist.empty}</h3>
                            <p className="text-gray-400 mb-6">
                                {t.wishlist.emptyDesc}
                            </p>
                            <Link
                                href="/products"
                                className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                            >
                                {t.wishlist.browseProducts}
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map((item) => {
                                const product = item.products
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl overflow-hidden card-shadow flex flex-col group h-full"
                                    >
                                        {/* Product Image */}
                                        <Link href={`/products/${product.slug}`}>
                                            <div className="relative h-56 overflow-hidden bg-charcoal">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                {product.badge && (
                                                    <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wide">
                                                        {product.badge}
                                                    </div>
                                                )}
                                                {/* Remove button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        removeFromWishlist(item.id)
                                                    }}
                                                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 z-10"
                                                    title={t.wishlist.removeFromWishlist}
                                                >
                                                    <span className="material-icons text-xl text-red-500">
                                                        favorite
                                                    </span>
                                                </button>
                                            </div>
                                        </Link>

                                        {/* Product Info */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex items-start justify-between mb-1">
                                                <h3 className="font-bold text-base leading-tight">
                                                    {product.name}
                                                </h3>
                                                {product.mb_score && (
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold whitespace-nowrap ml-2">
                                                        {t.products.mbScore}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-4">
                                                {product.origin}
                                            </p>

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <span>{product.portion}</span>
                                                </div>
                                                <span className="text-xl font-extrabold">
                                                    ฿{product.price.toFixed(2)}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => addToCart(product, e)}
                                                className="w-full bg-primary hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-auto"
                                            >
                                                <span className="material-icons text-base">
                                                    shopping_cart
                                                </span>
                                                {t.wishlist.addToCart}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
                    <span className="material-icons text-green-400 text-lg">check_circle</span>
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}
        </>
    )
}
