"use client"

import Link from "next/link"
import { useLanguage } from "../../lib/i18n"

export default function Footer() {
    const { t } = useLanguage()

    return (
        <footer className="bg-charcoal text-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
                                <span className="material-icons text-white">restaurant</span>
                            </div>
                            <span className="text-2xl font-extrabold tracking-tighter uppercase">
                                Prime<span className="text-primary">Cut</span>
                            </span>
                        </div>
                        <p className="text-gray-400 leading-relaxed text-sm mb-6">
                            {t.footer.brandDesc}
                        </p>
                        <div className="flex gap-4">
                            {[
                                { icon: "facebook", label: "Facebook" },
                                { icon: "camera_alt", label: "Instagram" },
                                { icon: "alternate_email", label: "Threads" },
                            ].map((s) => (
                                <Link
                                    key={s.label}
                                    href="#"
                                    aria-label={s.label}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors"
                                >
                                    <span className="material-icons text-xl">{s.icon}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="font-bold text-lg mb-8">{t.footer.shopTitle}</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            {t.footer.shopItems.map((item) => (
                                <li key={item}>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition-colors"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Service */}
                    <div>
                        <h4 className="font-bold text-lg mb-8">{t.footer.serviceTitle}</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            {t.footer.serviceItems.map((item) => (
                                <li key={item}>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition-colors"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-lg mb-8">{t.footer.newsletterTitle}</h4>
                        <p className="text-sm text-gray-400 mb-6">
                            {t.footer.newsletterDesc}
                        </p>
                        <div className="relative">
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm text-white placeholder:text-gray-500"
                                placeholder={t.footer.emailPlaceholder}
                                type="email"
                            />
                            <button className="absolute right-2 top-2 bg-primary px-4 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-red-700 transition-colors">
                                {t.footer.joinBtn}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-500 text-xs uppercase tracking-widest">
                        {t.footer.copyright}
                    </p>
                    <div className="flex items-center gap-8 text-xs text-gray-500 font-bold tracking-widest uppercase">
                        {[t.footer.privacy, t.footer.terms, t.footer.cookies].map((item) => (
                            <Link
                                key={item}
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
