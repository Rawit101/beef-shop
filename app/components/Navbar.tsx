"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"
import { useLanguage, languages, type LangCode } from "../../lib/i18n"

interface SearchResult {
    id: string
    name: string
    slug: string
    price: number
    image_url: string
    origin: string
    portion: string
    category: string
}

export default function Navbar() {
    const router = useRouter()
    const { lang, setLang, t, currentLanguage } = useLanguage()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [user, setUser] = useState<{ email?: string; full_name?: string; role?: string } | null>(null)
    const [cartCount, setCartCount] = useState(0)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showLangMenu, setShowLangMenu] = useState(false)
    const langMenuRef = useRef<HTMLDivElement>(null)

    // Search state
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchOverlayRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (isSupabaseConfigured()) {
            checkUser()
            const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
                checkUser()
            })

            // Listen for cart updates from any component
            const handleCartUpdate = () => { refreshCartCount() }
            window.addEventListener("cart-updated", handleCartUpdate)

            return () => {
                subscription.unsubscribe()
                window.removeEventListener("cart-updated", handleCartUpdate)
            }
        }
    }, [])

    // Auto-focus search input when overlay opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
        if (!searchOpen) {
            setSearchQuery("")
            setSearchResults([])
        }
    }, [searchOpen])

    // Close search overlay on Escape or click outside
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && searchOpen) {
                setSearchOpen(false)
            }
            if (e.key === "Escape" && showLangMenu) {
                setShowLangMenu(false)
            }
        }
        const handleClickOutside = (e: MouseEvent) => {
            if (searchOverlayRef.current && !searchOverlayRef.current.contains(e.target as Node)) {
                setSearchOpen(false)
            }
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
                setShowLangMenu(false)
            }
        }
        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [searchOpen, showLangMenu])

    // Debounced search
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([])
            setSearchLoading(false)
            return
        }
        setSearchLoading(true)
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from("products")
                .select("id, name, slug, price, image_url, origin, portion, category")
                .or(`name.ilike.%${query}%,origin.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(5)
            if (!error && data) {
                setSearchResults(data)
            }
        }
        setSearchLoading(false)
    }, [])

    const handleSearchInput = (value: string) => {
        setSearchQuery(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            performSearch(value)
        }, 300)
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            setSearchOpen(false)
            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    const refreshCartCount = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
            const { count } = await supabase
                .from("cart_items")
                .select("id", { count: "exact" })
                .eq("user_id", authUser.id)
            setCartCount(count || 0)
        }
    }

    const checkUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, role")
                .eq("id", authUser.id)
                .single()
            setUser({
                email: authUser.email,
                full_name: profile?.full_name || authUser.email,
                role: profile?.role,
            })
            // Get cart count
            const { count } = await supabase
                .from("cart_items")
                .select("id", { count: "exact" })
                .eq("user_id", authUser.id)
            setCartCount(count || 0)
        } else {
            setUser(null)
            setCartCount(0)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setShowUserMenu(false)
        router.push("/")
        router.refresh()
    }

    return (
        <nav className="sticky top-0 z-50 w-full bg-background-light/95 backdrop-blur-md border-b border-primary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
                                <span className="material-icons text-white">restaurant</span>
                            </div>
                            <span className="text-2xl font-extrabold tracking-tighter uppercase">
                                Prime<span className="text-primary">Cut</span>
                            </span>
                        </Link>
                        <div className="hidden md:flex space-x-8">
                            {[
                                { label: t.navbar.home, href: "/" },
                                { label: t.navbar.shop, href: "/products" },
                                { label: t.navbar.about, href: "/our-story" },
                                { label: t.navbar.contact, href: "/contact" },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm font-semibold hover:text-primary transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <div className="relative" ref={langMenuRef}>
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className={`group flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 ${showLangMenu
                                    ? "border-primary/30 bg-primary/5 text-primary shadow-sm"
                                    : "border-gray-200 hover:border-primary/20 hover:bg-gray-50 text-charcoal hover:text-primary"
                                    }`}
                            >
                                <span className="material-icons text-[18px]">language</span>
                                <span className="text-xs font-bold uppercase tracking-wider">{lang}</span>
                                <span className={`material-icons text-sm transition-transform duration-300 ${showLangMenu ? "rotate-180" : ""}`}>expand_more</span>
                            </button>
                            {showLangMenu && (
                                <div
                                    className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100/80 overflow-hidden z-50 backdrop-blur-lg"
                                    style={{ animation: "slideDown 0.25s ease-out" }}
                                >
                                    <div className="px-4 pt-4 pb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-icons text-primary text-base">translate</span>
                                            <p className="text-xs font-extrabold uppercase tracking-widest text-charcoal">{t.navbar.langTitle}</p>
                                        </div>
                                        <p className="text-[11px] text-gray-400">{t.navbar.langSubtitle}</p>
                                    </div>
                                    <div className="p-2">
                                        {languages.map((l) => {
                                            const isActive = lang === l.code;
                                            return (
                                                <button
                                                    key={l.code}
                                                    onClick={() => {
                                                        setLang(l.code as LangCode)
                                                        setShowLangMenu(false)
                                                    }}
                                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${isActive
                                                            ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                                            : "text-charcoal hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${isActive ? "bg-primary/20 shadow-sm" : "bg-gray-100"
                                                        }`}>
                                                        {l.flag}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-bold leading-tight ${isActive ? "text-primary" : ""}`}>{l.label}</p>
                                                        <p className="text-[11px] text-gray-400 leading-tight">{l.native}</p>
                                                    </div>
                                                    {isActive && (
                                                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                                            <span className="material-icons text-white text-[14px]">check</span>
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSearchOpen(true)}
                            className="text-charcoal hover:text-primary transition-colors"
                        >
                            <span className="material-icons">search</span>
                        </button>
                        <Link href="/checkout" className="relative text-charcoal hover:text-primary transition-colors">
                            <span className="material-icons">shopping_bag</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="hidden lg:flex items-center gap-2 bg-charcoal text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors"
                                >
                                    <span className="material-icons text-base">person</span>
                                    <span className="max-w-[100px] truncate">{user.full_name}</span>
                                    <span className="material-icons text-sm">expand_more</span>
                                </button>
                                {showUserMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-primary/10 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-primary/5">
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-primary/5 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <span className="material-icons text-base text-primary">receipt_long</span>
                                            {t.navbar.myOrders}
                                        </Link>
                                        <Link
                                            href="/order-tracking"
                                            className="flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-primary/5 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <span className="material-icons text-base text-primary">local_shipping</span>
                                            {t.navbar.trackOrder}
                                        </Link>
                                        {user.role === "admin" && (
                                            <Link
                                                href="/admin"
                                                className="flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-primary/5 transition-colors"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <span className="material-icons text-base text-primary">admin_panel_settings</span>
                                                {t.navbar.adminPanel}
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium hover:bg-red-50 text-red-600 transition-colors"
                                        >
                                            <span className="material-icons text-base">logout</span>
                                            {t.navbar.signOut}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="hidden lg:block bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                            >
                                {t.navbar.login}
                            </Link>
                        )}

                        {/* Mobile toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden text-charcoal hover:text-primary transition-colors"
                        >
                            <span className="material-icons">
                                {mobileOpen ? "close" : "menu"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-primary/10 py-4 space-y-2">
                        {[
                            { label: t.navbar.home, href: "/" },
                            { label: t.navbar.shop, href: "/products" },
                            { label: t.navbar.about, href: "/our-story" },
                            { label: t.navbar.contact, href: "/contact" },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/5 hover:text-primary transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                        {user ? (
                            <>
                                <Link
                                    href="/profile"
                                    className="block px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                    {t.navbar.myOrders}
                                </Link>
                                {user.role === "admin" && (
                                    <Link
                                        href="/admin"
                                        className="block px-3 py-2 rounded-lg text-sm font-semibold text-primary"
                                    >
                                        {t.navbar.adminPanel}
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full mt-3 bg-charcoal text-white py-2.5 rounded-lg text-sm font-bold"
                                >
                                    {t.navbar.signOut}
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="block w-full mt-3 bg-primary text-white py-2.5 rounded-lg text-sm font-bold text-center hover:bg-red-700 transition-colors"
                            >
                                {t.navbar.login}
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Search Overlay ─── */}
            {searchOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

                    {/* Search Panel */}
                    <div
                        ref={searchOverlayRef}
                        className="absolute left-0 right-0 top-full z-50 bg-white shadow-2xl border-t border-primary/10"
                        style={{ animation: "slideDown 0.2s ease-out" }}
                    >
                        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
                            {/* Search Input */}
                            <form onSubmit={handleSearchSubmit}>
                                <div className="relative">
                                    <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                                        search
                                    </span>
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => handleSearchInput(e.target.value)}
                                        placeholder={t.navbar.searchPlaceholder}
                                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => { setSearchQuery(""); setSearchResults([]) }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <span className="material-icons text-xl">close</span>
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Search Results */}
                            {searchLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <span className="material-icons animate-spin text-2xl text-primary">autorenew</span>
                                </div>
                            )}

                            {!searchLoading && searchQuery.trim() && searchResults.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
                                        {t.navbar.products} ({searchResults.length})
                                    </p>
                                    {searchResults.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/products/${product.slug}`}
                                            onClick={() => setSearchOpen(false)}
                                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {product.origin} • {product.portion}
                                                </p>
                                            </div>
                                            <span className="text-base font-extrabold text-primary">
                                                ${product.price.toFixed(2)}
                                            </span>
                                        </Link>
                                    ))}

                                    {/* View all results */}
                                    <button
                                        onClick={() => {
                                            setSearchOpen(false)
                                            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
                                        }}
                                        className="w-full mt-2 py-3 text-center text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        {t.navbar.viewAllResults} &ldquo;{searchQuery}&rdquo;
                                        <span className="material-icons text-base">arrow_forward</span>
                                    </button>
                                </div>
                            )}

                            {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                                <div className="py-10 text-center">
                                    <span className="material-icons text-4xl text-gray-200 mb-3 block">search_off</span>
                                    <p className="text-gray-500 font-medium">{t.navbar.searchNoResults} &ldquo;{searchQuery}&rdquo;</p>
                                    <p className="text-xs text-gray-400 mt-1">{t.navbar.searchTryAgain}</p>
                                </div>
                            )}

                            {!searchQuery.trim() && (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-gray-400">
                                        {t.navbar.searchHint}
                                    </p>
                                    <div className="flex items-center justify-center gap-2 mt-3">
                                        {["Wagyu", "Steak", "Angus"].map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => handleSearchInput(tag)}
                                                className="px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary text-xs font-bold rounded-lg transition-colors"
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Slide down animation */}
            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </nav>
    )
}
