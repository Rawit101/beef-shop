"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"
import { useLanguage } from "../../lib/i18n"

interface Product {
    name: string
    slug: string
    origin: string
    portion: string
    price: number
    badge: string | null
    mb_score: boolean
    image_url: string
    id?: string
    category?: string
}

const fallbackProducts: Product[] = [
    {
        name: "Miyazaki Wagyu Ribeye",
        slug: "miyazaki-wagyu-ribeye",
        origin: "Japanese Kyushu Origin",
        portion: "250g Portions",
        price: 3990.0,
        badge: "A5 GRADE",
        mb_score: true,
        category: "wagyu",
        image_url: "...",
    },
    {
        name: "Black Angus Striploin",
        slug: "black-angus-striploin",
        origin: "Australian Grain-Fed",
        portion: "300g Portions",
        price: 1690.0,
        badge: "BESTSELLER",
        mb_score: true,
        category: "steak",
        image_url: "...",
    },
    {
        name: "Chateaubriand Tenderloin",
        slug: "chateaubriand-tenderloin",
        origin: "Center Cut Fillet",
        portion: "200g Fillet",
        price: 2490.0,
        badge: "RARE ORIGIN",
        mb_score: true,
        category: "steak",
        image_url: "...",
    },
    {
        name: "Grand Tomahawk Steak",
        slug: "grand-tomahawk-steak",
        origin: "Bone-In Long Rib",
        portion: "1.2kg Single",
        price: 4290.0,
        badge: "",
        mb_score: true,
        category: "steak",
        image_url: "...",
    },
    {
        name: "Kobe Yakiniku Slices",
        slug: "kobe-yakiniku-slices",
        origin: "Japanese Hybrid",
        portion: "150g Box",
        price: 2190.0,
        badge: "",
        mb_score: true,
        category: "shabu",
        image_url: "...",
    },
    {
        name: "Aged Porterhouse",
        slug: "aged-porterhouse",
        origin: "Premium USDA Choice",
        portion: "800g Cut",
        price: 3290.0,
        badge: "45-DAY AGED",
        mb_score: true,
        category: "steak",
        image_url: "...",
    },
]

const cutTypes = ["Ribeye", "Tenderloin", "Striploin", "Tomahawk"]
const marblingScores = ["A3 (Moderate)", "A5 (Supreme)", "MB 4-5", "MB 8-9+"]
const origins = ["Japanese Wagyu", "Australian Black Angus", "USDA Prime"]

function ProductsPageContent() {
    const { t } = useLanguage()
    const searchParams = useSearchParams()
    const router = useRouter()
    const catParam = searchParams.get("cat") || "all"
    const searchParam = searchParams.get("search") || ""

    const CATEGORIES = [
        { key: "all", label: t.products.catAll, icon: "grid_view" },
        { key: "steak", label: t.products.catSteak, icon: "restaurant" },
        { key: "wagyu", label: t.products.catWagyu, icon: "star" },
        { key: "bbq", label: t.products.catBBQ, icon: "outdoor_grill" },
        { key: "shabu", label: t.products.catShabu, icon: "ramen_dining" },
    ]

    const [allProducts, setAllProducts] = useState<Product[]>(fallbackProducts)
    const [activeCategory, setActiveCategory] = useState(catParam)
    const [selectedCuts, setSelectedCuts] = useState<string[]>(["Striploin"])
    const [selectedMarbling, setSelectedMarbling] = useState<string[]>(["A5 (Supreme)"])
    const [selectedOrigins, setSelectedOrigins] = useState<string[]>([])
    const [priceRange, setPriceRange] = useState([50, 600])
    const [sortBy, setSortBy] = useState("highest")
    const [mobileFilters, setMobileFilters] = useState(false)
    const [toast, setToast] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState(searchParam)
    const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (isSupabaseConfigured()) {
            fetchProducts()
            loadWishlist()
        }
    }, [])

    const loadWishlist = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
            .from("wishlists")
            .select("product_id")
            .eq("user_id", user.id)
        if (data) {
            setWishlistedIds(new Set(data.map((w: { product_id: string }) => w.product_id)))
        }
    }

    const toggleWishlist = async (productId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isSupabaseConfigured()) {
            setToast(t.wishlist.addedToast)
            setTimeout(() => setToast(null), 2000)
            return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = "/login"
            return
        }
        if (!productId) return

        const isWishlisted = wishlistedIds.has(productId)
        if (isWishlisted) {
            await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId)
            setWishlistedIds(prev => { const next = new Set(prev); next.delete(productId); return next })
            setToast(t.wishlist.removedToast)
        } else {
            await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId })
            setWishlistedIds(prev => new Set(prev).add(productId))
            setToast(t.wishlist.addedToast)
        }
        setTimeout(() => setToast(null), 2000)
        window.dispatchEvent(new Event("wishlist-updated"))
    }

    useEffect(() => {
        setActiveCategory(catParam)
    }, [catParam])

    useEffect(() => {
        setSearchQuery(searchParam)
        if (searchParam) {
            setActiveCategory("all")
        }
    }, [searchParam])

    const switchCategory = (key: string) => {
        setActiveCategory(key)
        if (key === "all") {
            router.push("/products")
        } else {
            router.push(`/products?cat=${key}`)
        }
    }

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
        if (data && !error && data.length > 0) {
            setAllProducts(data)
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
        if (!product.id) {
            setToast(t.products.cannotAdd)
            setTimeout(() => setToast(null), 2000)
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
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: existing.quantity + 1 })
                .eq("id", existing.id)
            if (error) {
                console.error("Cart update error:", error)
                setToast(t.products.failedUpdate)
                setTimeout(() => setToast(null), 2000)
                return
            }
        } else {
            const { error } = await supabase
                .from("cart_items")
                .insert({ user_id: user.id, product_id: product.id, quantity: 1 })
            if (error) {
                console.error("Cart insert error:", error)
                setToast(t.products.failedAdd)
                setTimeout(() => setToast(null), 2000)
                return
            }
        }
        setToast(`${product.name} added to cart! 🛒`)
        setTimeout(() => setToast(null), 2000)
        window.dispatchEvent(new Event("cart-updated"))
    }

    const toggleCut = (cut: string) => {
        setSelectedCuts((prev) =>
            prev.includes(cut) ? prev.filter((c) => c !== cut) : [...prev, cut]
        )
    }

    const toggleMarbling = (m: string) => {
        setSelectedMarbling((prev) =>
            prev.includes(m) ? prev.filter((c) => c !== m) : [...prev, m]
        )
    }

    const toggleOrigin = (o: string) => {
        setSelectedOrigins((prev) =>
            prev.includes(o) ? prev.filter((c) => c !== o) : [...prev, o]
        )
    }

    // Search filter
    const filteredBySearch = searchQuery.trim()
        ? allProducts.filter((p) => {
            const q = searchQuery.toLowerCase()
            return (
                p.name.toLowerCase().includes(q) ||
                p.origin.toLowerCase().includes(q) ||
                (p.category || "").toLowerCase().includes(q) ||
                (p.slug || "").toLowerCase().includes(q)
            )
        })
        : allProducts

    const getProductsByCategory = (catKey: string) => {
        return filteredBySearch
            .filter((p) => p.category === catKey)
            .sort((a, b) => sortBy === "highest" ? b.price - a.price : a.price - b.price)
    }

    const visibleCategories = activeCategory === "all"
        ? CATEGORIES.filter((c) => c.key !== "all")
        : CATEGORIES.filter((c) => c.key === activeCategory)

    const handlePageSearch = (value: string) => {
        setSearchQuery(value)
        if (value.trim()) {
            setActiveCategory("all")
            router.push(`/products?search=${encodeURIComponent(value.trim())}`, { scroll: false })
        } else {
            router.push("/products", { scroll: false })
        }
    }

    const clearSearch = () => {
        setSearchQuery("")
        router.push("/products", { scroll: false })
    }

    const renderProductCard = (product: Product) => (
        <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className="bg-white rounded-2xl overflow-hidden card-shadow flex flex-col group h-full"
        >
            {/* Product Image */}
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
                {/* Wishlist heart button */}
                {product.id && (
                    <button
                        onClick={(e) => toggleWishlist(product.id!, e)}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 z-10"
                        title={wishlistedIds.has(product.id) ? t.wishlist.removeFromWishlist : t.wishlist.addToWishlist}
                    >
                        <span className={`material-icons text-xl transition-colors ${wishlistedIds.has(product.id) ? "text-red-500" : "text-gray-400 hover:text-red-400"
                            }`}>
                            {wishlistedIds.has(product.id) ? "favorite" : "favorite_border"}
                        </span>
                    </button>
                )}
            </div>

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
                        <span className="material-icons text-xs">
                            expand_more
                        </span>
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
                    {t.products.addToCart}
                </button>
            </div>
        </Link>
    )

    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                        {searchQuery.trim() ? t.products.searchResultsTitle : t.products.pageTitle}
                    </h1>
                    <p className="text-gray-500 max-w-2xl leading-relaxed">
                        {searchQuery.trim()
                            ? <>{t.products.showingResultsFor} &ldquo;<span className="font-semibold text-charcoal">{searchQuery}</span>&rdquo;</>
                            : t.products.pageDesc
                        }
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-xl">
                        <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handlePageSearch(e.target.value)}
                            placeholder={t.products.searchPlaceholder}
                            className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="material-icons text-xl">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => switchCategory(cat.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat.key
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary"
                                }`}
                        >
                            <span className="material-icons text-base">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Sort Controls */}
                <div className="flex items-center justify-between mb-8">
                    <p className="text-sm text-gray-500">
                        {t.products.showing}{" "}
                        <span className="font-bold text-charcoal">
                            {activeCategory === "all"
                                ? filteredBySearch.length
                                : filteredBySearch.filter((p) => p.category === activeCategory).length}
                        </span>{" "}
                        {t.products.premiumCuts}
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold hidden sm:inline">
                            {t.products.sortBy}
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-charcoal focus:outline-none focus:border-primary appearance-none pr-8 cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 10px center",
                            }}
                        >
                            <option value="highest">{t.products.highestPrice}</option>
                            <option value="lowest">{t.products.lowestPrice}</option>
                        </select>
                    </div>
                </div>

                {/* Category Sections */}
                <div className="space-y-14">
                    {visibleCategories.map((cat) => {
                        const products = getProductsByCategory(cat.key)
                        if (products.length === 0) return null
                        return (
                            <section key={cat.key}>
                                {/* Section Header */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-icons text-primary text-xl">{cat.icon}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-extrabold">{cat.label}</h2>
                                        <p className="text-xs text-gray-400">{products.length} {t.products.productsCount}</p>
                                    </div>
                                    <div className="flex-1 h-px bg-gray-200 ml-4" />
                                </div>

                                {/* Product Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map(renderProductCard)}
                                </div>
                            </section>
                        )
                    })}
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

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <span className="material-icons animate-spin text-4xl text-primary">autorenew</span>
            </div>
        }>
            <ProductsPageContent />
        </Suspense>
    )
}
