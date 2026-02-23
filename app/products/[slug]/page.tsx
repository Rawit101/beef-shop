"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar"
import { useLanguage } from "../../../lib/i18n"
import { supabase, isSupabaseConfigured } from "../../../lib/supabaseClient"

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
    description: string | null
    mb_score?: boolean
}

const fallbackProducts: Product[] = [
    {
        id: "1",
        name: "Miyazaki Wagyu Ribeye",
        slug: "miyazaki-wagyu-ribeye",
        origin: "Japanese Kyushu Origin",
        portion: "250g Portions",
        price: 129.0,
        old_price: 158.0,
        badge: "A5 GRADE",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCw7AOxqSjAbH5XblTGWMl0ao-MtKn0rJbnecoasVtBVUmwOvvL8csVlSdWIhniO3LRXHVcrjOs3NTQK1LQFzLj8EEGOA8yygd_9-IW4NSc7vJOodMK40N9bAejwTQc3t3kMWtDw5rs2ItKFE_h_orYR4MOK96jbqVlT4BTtuuJ_LlesUt7rLLRe7sBpWRmMtlB-uxTn0xkwYcDc9e6-8cwvqVc7ztWHl5jgG-SUBALfHnIL5E7d2b2eg3p_eJEWQL-7sdo7CEvK9HZ",
        category: "wagyu",
        stock: 50,
        description:
            "Our Miyazaki Prefecture A5 Ribeye represents the absolute peak of the Kuroge Washu breed. Each cut is hand-selected for its intense intramuscular fat marbling, which gives Wagyu its legendary melt-in-your-mouth texture.",
    },
    {
        id: "2",
        name: "Black Angus Striploin",
        slug: "black-angus-striploin",
        origin: "Australian Grain-Fed",
        portion: "300g Portions",
        price: 65.0,
        old_price: null,
        badge: "BESTSELLER",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDgqSP0xVg44XxN29N_ZKnepqIMraw3cAuW-hcGSxl2C4GhzliWWT8h18BPEe-Pi6IxU5rUCTbfwkGgRNMVbLRbJ6wi0l6cr8AJlGGkawSx6a3DigTq_ezy7Xi0_JogGy9toMqTquYuNSqMmrWD_JM_UAeGJsCcB06kJ3MnY7SUIfQ2ZmkCrAemQDXuqrKSa8pliRvRhIRl5YNzPkLCGcHzs_oRFoz0KSzGDsJqKNuyfimWTCODBgyggtCveSKzBSguXwPTAcd-Z10Q",
        category: "steak",
        stock: 80,
        description:
            "Premium Australian grain-fed Black Angus Striploin. Exceptionally tender with a rich beefy flavor, this striploin is matured for optimal taste and marbling distribution.",
    },
    {
        id: "3",
        name: "Chateaubriand Tenderloin",
        slug: "chateaubriand-tenderloin",
        origin: "Center Cut Fillet",
        portion: "200g Fillet",
        price: 89.0,
        old_price: null,
        badge: "RARE ORIGIN",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBWHprhyjQ2lx8q6g55KwSOYw21agSWeKiS-j-zlaLptHU9deSn2wbPWF8g2XifpaIogiXlOW6PEU1JaRYuCkYIwN34JSWyxdEmEMbk3chw_5R4UfSZYva2zC_Z-5XKj06ZWMZGw2OBevoIYrfzUKCmMlR-WbMsr9WRk8sKPu1rrT0bMbNUYLlEldRHL9ERTgPGr4xWF4UtakhqJWWwPhdv3ks6MnG5JgHLPgcAsQ9EAX1puobSE4d4IprnzmlR7DgFZT6IEr792iyt",
        category: "steak",
        stock: 30,
        description:
            "The Chateaubriand is cut from the thickest part of the tenderloin and is considered one of the most prestigious cuts available. Butter-soft texture with a delicate, refined flavor.",
    },
    {
        id: "4",
        name: "Grand Tomahawk Steak",
        slug: "grand-tomahawk-steak",
        origin: "Bone-In Long Rib",
        portion: "1.2kg Single",
        price: 145.0,
        old_price: null,
        badge: null,
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAxaATTMLVvVmY16Y3ExdS2wif3DcfIfbEG_OooLbwAVvVBt28zuRqQcSEMjNhEDA98xAM9fYFCEZjUA-zBmsH_pN7pvBBHgFGIcEF_qYXJWL9O1DmdNg9pPd-BCAPvJUqBhLfyOcPVDAQ9H6SOIg71tfJzDyOK4FkXy6dc2VDl80-38pXqBDQu0AFbA3q8yGsoBxL005Wyi-68vpkLWu4w22gIJBUiXe7LEnJpO9A0q9JhAb48HKDY671b1CZpJm_i4k8nf_7fuDcN",
        category: "steak",
        stock: 20,
        description:
            "A showstopper cut with up to 5 inches of rib bone. This Grand Tomahawk offers incredible flavor from the bone and a generous, beautifully marbled ribeye.",
    },
    {
        id: "5",
        name: "Kobe Yakiniku Slices",
        slug: "kobe-yakiniku-slices",
        origin: "Japanese Hybrid",
        portion: "150g Box",
        price: 78.0,
        old_price: null,
        badge: null,
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuB-d-4Mp4DqOQtgX_Q5siyDg1OFypPGJlLtVZt5Txzrox79bqp0V7RuVR_Wmt_YvIWZ5EOaqhqiQtoTLAy1sP4Ei5TYMCe_LkgxWJRMqmpCPhP3eyOvTYJ0mD_NRuXztF5a_66b4-R_A5NnvCe9owj73xEL8L-JmUr7uzkR54rRqZWNjUY_nUwDgfoQrpISq8XsywXhEXfev_ddY0RNkUF4zMicAfOk_qNyN93eb4k706hO6C_OMEl9bcP-N2fBDPNuS93vfkn4UVeZ",
        category: "wagyu",
        stock: 60,
        description:
            "Thinly sliced premium Kobe-style beef, perfect for yakiniku grilling. Each slice is cut to the ideal thickness for quick searing on a hot grill.",
    },
    {
        id: "6",
        name: "Aged Porterhouse",
        slug: "aged-porterhouse",
        origin: "Premium USDA Choice",
        portion: "800g Cut",
        price: 110.0,
        old_price: null,
        badge: "45-DAY AGED",
        image_url:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDjfUNXHYPXBDemM4g0pCR2HlJBrc13IPNIZv5NnppeTu0HPW0-NYsATQUpwcjosCP4wDd27zIND36R3Tra5ohmSGmRaiwfNdxelpY462E-6w4bYaXB0uORMFEbFnLUC1LtkVTorquROwLhCS30fGLGIv2y-Slll0ml3dU0rCOjetK2-xpZQ5Fm7SYWs4IMdCG_BrSXi85GO_jopASUX80tHZ82IEtV23g2VKh-OxPF6PUGQ4Re20W0VMCB5ErLGs2aRyHlMNE60JSn",
        category: "steak",
        stock: 40,
        description:
            "Our 45-day dry-aged Porterhouse combines the best of both worlds: a tender filet on one side and a flavorful strip on the other, all intensified by our extended aging process.",
    },
]

export default function ProductDetailPage() {
    const { t } = useLanguage()
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedWeight, setSelectedWeight] = useState(0)
    const [selectedThickness, setSelectedThickness] = useState(1)
    const [quantity, setQuantity] = useState(1)

    const weights = [
        { label: "200g", sub: t.productDetail.singleServing },
        { label: "400g", sub: t.productDetail.duoPortion },
        { label: "600g", sub: t.productDetail.largeCut },
// Mockup doneness guide data
const doneness = [
    {
        name: "Rare",
        temp: "120-125°F",
        desc: "Deep Red Center",
        gradient: "from-red-900 to-red-800",
        recommended: false,
    },
    {
        name: "Med-Rare",
        temp: "130-135°F",
        desc: "Warm Red Center",
        gradient: "from-red-800 to-red-600",
        recommended: true,
    },
    {
        name: "Medium",
        temp: "140-145°F",
        desc: "Warm Pink Center",
        gradient: "from-red-600 to-orange-800",
        recommended: false,
    },
    {
        name: "Med-Well",
        temp: "150-155°F",
        desc: "Slightly Pink",
        gradient: "from-orange-800 to-amber-900",
        recommended: false,
    },
    {
        name: "Well Done",
        temp: "160°F+",
        desc: "Fully Cooked",
        gradient: "bg-zinc-950",
        recommended: false,
    },
]

// Mockup weight options based on product portion
function getWeightOptions(portion: string) {
    // Try to extract base weight from portion string
    const match = portion.match(/(\d+)/)
    if (match) {
        const base = parseInt(match[1])
        if (base >= 1000) {
            // kg-based product
            return [
                { label: `${(base * 0.5 / 1000).toFixed(1)}kg`, sub: "Half Cut" },
                { label: `${(base / 1000).toFixed(1)}kg`, sub: "Full Cut" },
                { label: `${(base * 1.5 / 1000).toFixed(1)}kg`, sub: "Large Cut" },
            ]
        }
        return [
            { label: `${base}g`, sub: "Single Serving" },
            { label: `${base * 2}g`, sub: "Duo Portion" },
            { label: `${base * 3}g`, sub: "Large Cut" },
        ]
    }
    return [
        { label: "200g", sub: "Single Serving" },
        { label: "400g", sub: "Duo Portion" },
        { label: "600g", sub: "Large Cut" },
    ]
}

    const thicknesses = [
        { label: t.productDetail.standard, checked: false },
        { label: t.productDetail.thickCut, checked: true },
    ]

    const doneness = [
        { name: t.productDetail.rare, temp: t.productDetail.rareTemp, desc: t.productDetail.rareDesc, gradient: "from-red-900 to-red-800", recommended: false },
        { name: t.productDetail.medRare, temp: t.productDetail.medRareTemp, desc: t.productDetail.medRareDesc, gradient: "from-red-800 to-red-600", recommended: true },
        { name: t.productDetail.medium, temp: t.productDetail.mediumTemp, desc: t.productDetail.mediumDesc, gradient: "from-red-600 to-orange-800", recommended: false },
        { name: t.productDetail.medWell, temp: t.productDetail.medWellTemp, desc: t.productDetail.medWellDesc, gradient: "from-orange-800 to-amber-900", recommended: false },
        { name: t.productDetail.wellDone, temp: t.productDetail.wellDoneTemp, desc: t.productDetail.wellDoneDesc, gradient: "bg-zinc-950", recommended: false },
const thicknesses = [
    { label: 'Standard (0.75")', checked: false },
    { label: 'Thick Cut (1.25")', checked: true },
]

// Mockup specs based on category
function getSpecs(product: Product) {
    if (product.category === "wagyu") {
        return [
            { label: "Breed", value: "Kuroge Washu" },
            { label: "Feeding", value: "600+ Days" },
            { label: "Aging", value: "21-Day Wet" },
        ]
    }
    if (product.badge?.includes("AGED")) {
        return [
            { label: "Breed", value: "Angus Cross" },
            { label: "Aging", value: product.badge.replace(" AGED", "") + " Dry" },
            { label: "Grade", value: "USDA Prime" },
        ]
    }
    return [
        { label: "Breed", value: "Premium Select" },
        { label: "Feeding", value: "Grain-Fed" },
        { label: "Grade", value: product.badge || "Choice" },
    ]
}

// Mockup review count
function getMockReviewCount(slug: string) {
    // Generate a consistent number from slug
    let hash = 0
    for (let i = 0; i < slug.length; i++) {
        hash = slug.charCodeAt(i) + ((hash << 5) - hash)
    }
    return 50 + Math.abs(hash % 200)
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const router = useRouter()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedWeight, setSelectedWeight] = useState(0)
    const [selectedThickness, setSelectedThickness] = useState(1)
    const [quantity, setQuantity] = useState(1)
    const [toast, setToast] = useState<string | null>(null)

    useEffect(() => {
        const fetchProduct = async () => {
            if (isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from("products")
                    .select("*")
                    .eq("slug", slug)
                    .single()

                if (data && !error) {
                    setProduct(data)
                    setLoading(false)
                    return
                }
            }
            // Fallback to static data
            const fallback = fallbackProducts.find((p) => p.slug === slug)
            if (fallback) {
                setProduct(fallback)
            }
            setLoading(false)
        }
        fetchProduct()
    }, [slug])

    const addToCart = async () => {
        if (!product) return
        if (!isSupabaseConfigured()) {
            setToast(`${product.name} added to cart!`)
            setTimeout(() => setToast(null), 2000)
            return
        }
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            router.push("/login")
            return
        }
        if (!product.id) {
            setToast("Cannot add product")
            setTimeout(() => setToast(null), 2000)
            return
        }
        const { data: existing } = await supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("user_id", user.id)
            .eq("product_id", product.id)
            .maybeSingle()

        if (existing) {
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: existing.quantity + quantity })
                .eq("id", existing.id)
            if (error) {
                setToast("Failed to update cart")
                setTimeout(() => setToast(null), 2000)
                return
            }
        } else {
            const { error } = await supabase
                .from("cart_items")
                .insert({ user_id: user.id, product_id: product.id, quantity })
            if (error) {
                setToast("Failed to add to cart")
                setTimeout(() => setToast(null), 2000)
                return
            }
        }
        setToast(`${product.name} added to cart! 🛒`)
        setTimeout(() => setToast(null), 2000)
        window.dispatchEvent(new Event("cart-updated"))
    }

    // Loading state
    if (loading) {
        return (
            <>
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="flex flex-col items-center gap-4">
                            <span className="material-icons animate-spin text-4xl text-primary">
                                autorenew
                            </span>
                            <p className="text-zinc-500 text-sm">Loading product...</p>
                        </div>
                    </div>
                </main>
            </>
        )
    }

    // Not found state
    if (!product) {
        return (
            <>
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <span className="material-icons text-6xl text-zinc-300">
                                search_off
                            </span>
                            <h2 className="text-2xl font-bold">Product Not Found</h2>
                            <p className="text-zinc-500 max-w-md">
                                The product you&apos;re looking for doesn&apos;t exist or has been removed.
                            </p>
                            <Link
                                href="/products"
                                className="mt-4 px-8 py-3 bg-primary hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-colors"
                            >
                                Browse Products
                            </Link>
                        </div>
                    </div>
                </main>
            </>
        )
    }

    const categoryLabel =
        product.category === "wagyu"
            ? "Wagyu"
            : product.category === "steak"
                ? "Steak Cuts"
                : product.category === "bbq"
                    ? "BBQ Bundles"
                    : product.category === "shabu"
                        ? "Shabu & Sukiyaki"
                        : "Products"

    const weights = getWeightOptions(product.portion)
    const specs = getSpecs(product)
    const reviewCount = getMockReviewCount(product.slug)

    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Breadcrumb */}
                <nav className="flex mb-8 text-xs font-medium uppercase tracking-widest text-zinc-500">
                    <Link href="/" className="hover:text-primary transition-colors">
                        {t.productDetail.home}
                    </Link>
                    <span className="mx-2">/</span>
                    <Link
                        href={`/products${product.category ? `?cat=${product.category}` : ""}`}
                        className="hover:text-primary transition-colors"
                    >
                        {t.productDetail.wagyu}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-zinc-900">{t.productDetail.productName}</span>
                        {categoryLabel}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-zinc-900">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Image */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square relative overflow-hidden rounded-xl bg-zinc-100 group cursor-zoom-in">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                src={product.image_url}
                                alt={product.name}
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-primary text-white px-3 py-1 text-xs font-bold tracking-widest rounded uppercase">
                                    {t.productDetail.certifiedA5}
                                </span>
                            </div>
                        </div>

                        {/* Thumbnails */}
                        <div className="grid grid-cols-4 gap-4">
                            {galleryImages.slice(1).map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx + 1)}
                                    className={`aspect-square rounded-lg overflow-hidden transition-opacity ${selectedImage === idx + 1
                                        ? "border-2 border-primary opacity-100"
                                        : "border border-zinc-200 opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        className="w-full h-full object-cover"
                                        src={img.src}
                                        alt={img.alt}
                                    />
                                </button>
                            ))}
                            {product.badge && (
                                <div className="absolute top-4 left-4">
                                    <span className="bg-primary text-white px-3 py-1 text-xs font-bold tracking-widest rounded uppercase">
                                        {product.badge}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Product Details */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="mb-2">
                            <span className="text-sm font-semibold text-primary tracking-widest uppercase">
                                {t.productDetail.origin}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold mt-2 leading-tight tracking-tight">
                                {t.productDetail.productName}
                                {product.origin}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold mt-2 leading-tight tracking-tight">
                                {product.name}
                            </h1>
                        </div>

                        {/* Rating (mockup) */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex text-primary">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-icons text-sm">
                                        star
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                {t.productDetail.reviews}
                                ({reviewCount} Reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="mb-8">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">
                                    ${product.price.toFixed(2)}
                                </span>
                                {product.old_price && (
                                    <span className="text-zinc-500 line-through text-lg">
                                        ${product.old_price.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">
                                {t.productDetail.freeShipping}
                            </p>
                        </div>

                        {/* Selectors */}
                        <div className="space-y-8">
                            {/* Weight Selector */}
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <label className="text-xs font-bold uppercase tracking-widest">
                                        {t.productDetail.selectWeight}
                                    </label>
                                    <span className="text-xs text-primary font-medium cursor-pointer">
                                        {t.productDetail.sizeGuide}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {weights.map((w, idx) => (
                                        <button
                                            key={w.label}
                                            onClick={() => setSelectedWeight(idx)}
                                            className={`py-4 rounded-lg transition-all ${selectedWeight === idx
                                                ? "border-2 border-primary bg-primary/5"
                                                : "border-2 border-zinc-200 hover:border-zinc-400"
                                                }`}
                                        >
                                            <span className="block text-sm font-bold">
                                                {w.label}
                                            </span>
                                            <span className="block text-[10px] text-zinc-500 uppercase">
                                                {w.sub}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Thickness Selector */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-4">
                                    {t.productDetail.customThickness}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {thicknesses.map((th, idx) => (
                                        <button
                                            key={th.label}
                                            onClick={() => setSelectedThickness(idx)}
                                            className={`py-3 rounded-lg flex items-center justify-center gap-2 ${selectedThickness === idx
                                                ? "border-2 border-primary bg-primary/5"
                                                : "border-2 border-zinc-200 hover:border-zinc-400"
                                                }`}
                                        >
                                            <span className="text-sm font-medium">{th.label}</span>
                                            {selectedThickness === idx && (
                                                <span className="material-icons text-primary text-sm">
                                                    check_circle
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="mt-10 pt-10 border-t border-zinc-200 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">
                                    {t.productDetail.breed}
                                </span>
                                <span className="block text-xs font-semibold">
                                    {t.productDetail.breedValue}
                                </span>
                            </div>
                            <div className="text-center border-x border-zinc-200">
                                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">
                                    {t.productDetail.feeding}
                                </span>
                                <span className="block text-xs font-semibold">{t.productDetail.feedingValue}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">
                                    {t.productDetail.aging}
                                </span>
                                <span className="block text-xs font-semibold">
                                    {t.productDetail.agingValue}
                                </span>
                            </div>
                            {specs.map((s, idx) => (
                                <div
                                    key={s.label}
                                    className={`text-center ${idx === 1 ? "border-x border-zinc-200" : ""}`}
                                >
                                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mb-1">
                                        {s.label}
                                    </span>
                                    <span className="block text-xs font-semibold">
                                        {s.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Doneness Guide */}
                <section className="mt-20 py-16 border-t border-zinc-200">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 tracking-tight uppercase italic">
                            {t.productDetail.perfectSear}
                        </h2>
                        <p className="text-zinc-500 leading-relaxed">
                            {t.productDetail.perfectSearDesc}
                            Premium beef fat melts at room temperature. We recommend a quick sear on
                            high heat in a cast-iron skillet to preserve the exquisite
                            marbling and flavor.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {doneness.map((d) => (
                            <div
                                key={d.name}
                                className={`p-4 rounded-xl ${d.recommended
                                    ? "bg-white border-2 border-primary shadow-lg scale-105"
                                    : "bg-white border border-zinc-100"
                                    }`}
                            >
                                <div
                                    className={`h-1 w-full rounded-full mb-4 ${d.name === "Well Done"
                                        ? "bg-zinc-950"
                                        : `bg-gradient-to-r ${d.gradient}`
                                        }`}
                                />
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-sm uppercase">{d.name}</h3>
                                    {d.recommended && (
                                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                                            {t.productDetail.recommended}
                                        </span>
                                    )}
                                </div>
                                <p className="text-lg font-bold text-primary">{d.temp}</p>
                                <p className="text-[10px] text-zinc-500 uppercase mt-2">
                                    {d.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Product Description */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-16 py-16 border-t border-zinc-200">
                    <div>
                        <h2 className="text-2xl font-bold mb-6 tracking-tight">
                            {t.productDetail.pinnacleTitle}
                        </h2>
                        <div className="space-y-4 text-zinc-600 leading-relaxed">
                            <p>
                                {t.productDetail.pinnacleP1}
                            </p>
                            <p>
                                {t.productDetail.pinnacleP2}
                                {product.description ||
                                    `Our ${product.name} represents exceptional quality sourced from the finest producers. Each cut is hand-selected for its outstanding flavor profile and premium texture.`}
                            </p>
                            <p>
                                Every piece undergoes rigorous quality checks to ensure it meets
                                our exacting standards for marbling, color, firmness, and fat
                                quality.
                            </p>
                        </div>
                        <ul className="mt-8 space-y-3">
                            <li className="flex items-center gap-3">
                                <span className="material-icons text-primary text-lg">
                                    verified
                                </span>
                                <span className="text-sm font-medium">
                                    {t.productDetail.feature1}
                                    Authenticity Certificate Included
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-icons text-primary text-lg">
                                    ac_unit
                                </span>
                                <span className="text-sm font-medium">
                                    {t.productDetail.feature2}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-icons text-primary text-lg">
                                    restaurant_menu
                                </span>
                                <span className="text-sm font-medium">
                                    {t.productDetail.feature3}
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden min-h-[400px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className="absolute inset-0 w-full h-full object-cover"
                            src={product.image_url}
                            alt={`${product.name} prepared`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                            <div className="text-white">
                                <p className="text-3xl font-bold italic">
                                    {t.productDetail.quote}
                                </p>
                                <p className="text-sm mt-2 opacity-80">
                                    {t.productDetail.quoteAuthor}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Sticky Add to Cart Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="hidden sm:flex flex-col">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                {t.productDetail.totalPrice}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                    ${(product.price * quantity).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-medium">
                                    {t.productDetail.excludingTaxes}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden h-12">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-3 hover:bg-zinc-100 transition-colors h-full"
                                >
                                    <span className="material-icons text-sm">remove</span>
                                </button>
                                <span className="px-4 font-bold text-sm min-w-[40px] text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-3 hover:bg-zinc-100 transition-colors h-full"
                                >
                                    <span className="material-icons text-sm">add</span>
                                </button>
                            </div>

                            {/* CTA Button */}
                            <button className="flex-1 sm:flex-none px-12 h-12 bg-primary hover:bg-primary/90 text-white font-bold text-sm uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2">
                                <span>{t.productDetail.addToCartBtn}</span>
                                <span className="material-icons text-lg">arrow_forward</span>
                            <button
                                onClick={addToCart}
                                disabled={product.stock <= 0}
                                className={`flex-1 sm:flex-none px-12 h-12 font-bold text-sm uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2 ${product.stock > 0
                                    ? "bg-primary hover:bg-primary/90 text-white"
                                    : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                                    }`}
                            >
                                <span>{product.stock > 0 ? "Add to Cart" : "Out of Stock"}</span>
                                {product.stock > 0 && (
                                    <span className="material-icons text-lg">arrow_forward</span>
                                )}
                            </button>

                            {/* Wishlist */}
                            <button className="hidden md:flex h-12 w-12 items-center justify-center border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                                <span className="material-icons text-xl">
                                    favorite_border
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Padding for sticky footer */}
            <div className="h-24" />

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
                    <span className="material-icons text-green-400 text-lg">check_circle</span>
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}
        </>
    )
}
