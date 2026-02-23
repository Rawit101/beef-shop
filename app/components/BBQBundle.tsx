"use client"

import { useEffect, useState } from "react"
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient"
import { useLanguage } from "../../lib/i18n"

const BBQ_BUNDLE_SLUG = "bbq-lovers-sampler-box"

function useCountdown(targetDate: Date) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, mins: 0, secs: 0 })

    useEffect(() => {
        const tick = () => {
            const now = new Date().getTime()
            const diff = targetDate.getTime() - now
            if (diff <= 0) {
                setTimeLeft({ hours: 0, mins: 0, secs: 0 })
                return
            }
            setTimeLeft({
                hours: Math.floor(diff / (1000 * 60 * 60)),
                mins: Math.floor((diff / (1000 * 60)) % 60),
                secs: Math.floor((diff / 1000) % 60),
            })
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [targetDate])

    return timeLeft
}

export default function BBQBundle() {
    const { t } = useLanguage()
    const [deadline] = useState(() => {
        const d = new Date()
        d.setHours(d.getHours() + 12)
        d.setMinutes(d.getMinutes() + 48)
        d.setSeconds(d.getSeconds() + 15)
        return d
    })
    const { hours, mins, secs } = useCountdown(deadline)
    const [adding, setAdding] = useState(false)
    const [toast, setToast] = useState<string | null>(null)

    const claimBundle = async () => {
        if (!isSupabaseConfigured()) {
            setToast("BBQ Bundle added to cart! 🛒")
            setTimeout(() => setToast(null), 2000)
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            window.location.href = "/login"
            return
        }

        setAdding(true)

        // Find the BBQ Bundle product by slug
        const { data: product } = await supabase
            .from("products")
            .select("id, name")
            .eq("slug", BBQ_BUNDLE_SLUG)
            .maybeSingle()

        if (!product) {
            setToast(t.bbqBundle.bundleNotFound)
            setTimeout(() => setToast(null), 2000)
            setAdding(false)
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

        setAdding(false)
        setToast(`${product.name} added to cart! 🛒`)
        setTimeout(() => setToast(null), 2000)
        window.dispatchEvent(new Event("cart-updated"))
    }

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
            <div className="relative bg-charcoal rounded-3xl overflow-hidden flex flex-col lg:flex-row items-center">
                {/* Left Content */}
                <div className="p-12 lg:p-20 lg:w-1/2">
                    <div className="flex items-center gap-2 text-primary font-bold mb-6">
                        <span className="material-icons">local_fire_department</span>
                        <span className="tracking-[0.3em] uppercase text-xs">
                            {t.bbqBundle.label}
                        </span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                        {t.bbqBundle.titleLine1} <br />
                        {t.bbqBundle.titleLine2}
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        {t.bbqBundle.description}
                    </p>

                    {/* Countdown */}
                    <div className="flex items-center gap-4 mb-10">
                        {[
                            { val: hours, label: t.bbqBundle.hours },
                            { val: mins, label: t.bbqBundle.mins },
                            { val: secs, label: t.bbqBundle.secs },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="text-center bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                            >
                                <span className="block text-2xl font-bold text-white">
                                    {String(item.val).padStart(2, "0")}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={claimBundle}
                        disabled={adding}
                        className="inline-block bg-primary hover:bg-red-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {adding ? (
                            <span className="flex items-center gap-2">
                                <span className="material-icons animate-spin text-lg">autorenew</span>
                                {t.bbqBundle.adding}
                            </span>
                        ) : (
                            t.bbqBundle.claimBtn
                        )}
                    </button>
                </div>

                {/* Right Image */}
                <div className="lg:w-1/2 h-full min-h-[400px] w-full relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZNQqQFrISRQlrF1JppJrvvSII7Sa6IhFEHnaiRjiCVf-r7f-mkheFneAwijLskcP7FDDVA_XmvfZroCCLVnw3Sq640z5SJoPf23gmG2ntKfaiGC1zeatIE316TlOITDHhJ8P-mQMnuYjp5SfduoDkHvaQrLp7me3mkpogtdcbZclQJr1rrPtvZnVA2eVmwNRJEQjJUwXSxeqcSJ6L_uVzZtU2ZBMrvqxUMBdkp6Kumh1rsNcIxcRjhj4IF9Gsxty62wES93V_zWrK"
                        alt="Platter of various raw and grilled meats for BBQ"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-transparent to-transparent hidden lg:block" />
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
