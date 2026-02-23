"use client"

import Link from "next/link"
import { useLanguage } from "../../lib/i18n"

export default function OurStoryPage() {
    const { t } = useLanguage()

    const milestones = [
        { year: "2015", title: t.ourStory.milestone2015Title, description: t.ourStory.milestone2015Desc, icon: "emoji_events" },
        { year: "2017", title: t.ourStory.milestone2017Title, description: t.ourStory.milestone2017Desc, icon: "handshake" },
        { year: "2019", title: t.ourStory.milestone2019Title, description: t.ourStory.milestone2019Desc, icon: "eco" },
        { year: "2021", title: t.ourStory.milestone2021Title, description: t.ourStory.milestone2021Desc, icon: "ac_unit" },
        { year: "2024", title: t.ourStory.milestone2024Title, description: t.ourStory.milestone2024Desc, icon: "groups" },
    ]

    const values = [
        { icon: "verified", title: t.ourStory.certifiedTitle, description: t.ourStory.certifiedDesc },
        { icon: "local_florist", title: t.ourStory.sustainableTitle, description: t.ourStory.sustainableDesc },
        { icon: "local_shipping", title: t.ourStory.farmToDoorTitle, description: t.ourStory.farmToDoorDesc },
        { icon: "restaurant", title: t.ourStory.chefApprovedTitle, description: t.ourStory.chefApprovedDesc },
    ]

    return (
        <main className="bg-background-light">
            {/* Navigation Back */}
            <nav className="sticky top-0 z-50 w-full bg-background-light/95 backdrop-blur-md border-b border-primary/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-20">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
                                <span className="material-icons text-white">restaurant</span>
                            </div>
                            <span className="text-2xl font-extrabold tracking-tighter uppercase">
                                Prime<span className="text-primary">Cut</span>
                            </span>
                        </Link>
                        <div className="ml-auto">
                            <Link
                                href="/"
                                className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1"
                            >
                                <span className="material-icons text-base">arrow_back</span>
                                {t.ourStory.backToHome}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-[60vh] w-full flex items-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxaATTMLVvVmY16Y3ExdS2wif3DcfIfbEG_OooLbwAVvVBt28zuRqQcSEMjNhEDA98xAM9fYFCEZjUA-zBmsH_pN7pvBBHgFGIcEF_qYXJWL9O1DmdNg9pPd-BCAPvJUqBhLfyOcPVDAQ9H6SOIg71tfJzDyOK4FkXy6dc2VDl80-38pXqBDQu0AFbA3q8yGsoBxL005Wyi-68vpkLWu4w22gIJBUiXe7LEnJpO9A0q9JhAb48HKDY671b1CZpJm_i4k8nf_7fuDcN"
                        alt="Beautiful green pastures with cattle grazing"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white text-center w-full">
                    <span className="inline-block px-4 py-1 bg-primary text-xs font-bold tracking-widest uppercase rounded-full mb-6">
                        {t.ourStory.est}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                        {t.ourStory.heroTitle} <span className="text-primary italic">{t.ourStory.heroTitleAccent}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-light">
                        {t.ourStory.heroSubtitle}
                    </p>
                </div>
            </section>

            {/* Introduction */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4">
                        {t.ourStory.whoWeAreLabel}
                    </h2>
                    <p className="text-3xl md:text-4xl font-extrabold mb-8">
                        {t.ourStory.whoWeAreTitle}
                    </p>
                    <p className="text-lg text-gray-500 leading-relaxed mb-6">
                        {t.ourStory.whoWeAreP1}
                    </p>
                    <p className="text-lg text-gray-500 leading-relaxed">
                        {t.ourStory.whoWeAreP2}
                    </p>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-24 bg-background-light">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4">
                            {t.ourStory.journeyLabel}
                        </h2>
                        <p className="text-3xl md:text-4xl font-extrabold">
                            {t.ourStory.journeyTitle}
                        </p>
                    </div>

                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-6 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-primary/20" />

                        <div className="space-y-12">
                            {milestones.map((m, i) => (
                                <div
                                    key={m.year}
                                    className={`relative flex flex-col md:flex-row items-start gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                                        }`}
                                >
                                    {/* Content Card */}
                                    <div className="md:w-[calc(50%-2rem)] ml-16 md:ml-0">
                                        <div className="bg-white rounded-2xl p-8 card-shadow">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <span className="material-icons text-primary text-xl">
                                                        {m.icon}
                                                    </span>
                                                </div>
                                                <span className="text-primary font-extrabold text-lg">
                                                    {m.year}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-3">{m.title}</h3>
                                            <p className="text-gray-500 leading-relaxed">
                                                {m.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center Dot */}
                                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-8">
                                        <div className="w-4 h-4 bg-primary rounded-full border-4 border-background-light" />
                                    </div>

                                    {/* Spacer for opposite side */}
                                    <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-charcoal text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4">
                            {t.ourStory.valuesLabel}
                        </h2>
                        <p className="text-3xl md:text-4xl font-extrabold">
                            {t.ourStory.valuesTitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((v) => (
                            <div
                                key={v.icon}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-colors"
                            >
                                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                                    <span className="material-icons text-primary text-2xl">
                                        {v.icon}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold mb-3">{v.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {v.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Developer Section */}
            <section className="py-24 bg-gray-50 border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4">
                        {t.ourStory.devSectionLabel}
                    </h2>
                    <p className="text-3xl md:text-4xl font-extrabold mb-4 text-charcoal">
                        {t.ourStory.devSectionTitle}
                    </p>
                    <p className="text-gray-500 max-w-2xl mx-auto mb-16 leading-relaxed">
                        {t.ourStory.devSectionDesc}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 translate-y-[-50%]"></div>
                        <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 translate-y-[-50%]"></div>

                        {/* Developer 1 */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 relative overflow-hidden">
                                <span className="material-icons text-4xl relative z-10">code</span>
                            </div>

                            <h3 className="text-xl font-bold text-charcoal mb-1">Kissanaphong</h3>
                            <p className="text-primary text-sm font-bold mb-6 uppercase tracking-wider">Fullstack Developer</p>

                            <div className="flex gap-3 mt-auto">
                                <a href="mailto:kritsanaphong.ya@rmuti.ac.th" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-colors border border-gray-100" title="Email">
                                    <span className="material-icons text-[18px]">email</span>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-charcoal hover:text-white transition-colors border border-gray-100" title="Portfolio">
                                    <span className="material-icons text-[18px]">laptop_mac</span>
                                </a>
                            </div>
                        </div>

                        {/* Developer 2 */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 relative overflow-hidden">
                                <span className="material-icons text-4xl relative z-10">integration_instructions</span>
                            </div>

                            <h3 className="text-xl font-bold text-charcoal mb-1">Sorawit</h3>
                            <p className="text-primary text-sm font-bold mb-6 uppercase tracking-wider">Fullstack Developer</p>

                            <div className="flex gap-3 mt-auto">
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-colors border border-gray-100" title="Email">
                                    <span className="material-icons text-[18px]">email</span>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-charcoal hover:text-white transition-colors border border-gray-100" title="Portfolio">
                                    <span className="material-icons text-[18px]">laptop_mac</span>
                                </a>
                            </div>
                        </div>

                        {/* Developer 3 */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>

                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 relative overflow-hidden">
                                <span className="material-icons text-4xl relative z-10">api</span>
                            </div>

                            <h3 className="text-xl font-bold text-charcoal mb-1">Pusit</h3>
                            <p className="text-primary text-sm font-bold mb-6 uppercase tracking-wider">Fullstack Developer</p>

                            <div className="flex gap-3 mt-auto">
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-colors border border-gray-100" title="Email">
                                    <span className="material-icons text-[18px]">email</span>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-charcoal hover:text-white transition-colors border border-gray-100" title="GitHub">
                                    <span className="material-icons text-[18px]">code</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
                        {t.ourStory.ctaTitle} <span className="text-primary italic">{t.ourStory.ctaTitleAccent}</span>
                    </h2>
                    <p className="text-lg text-gray-500 mb-10 leading-relaxed">
                        {t.ourStory.ctaDesc}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/products"
                            className="bg-primary hover:bg-red-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                        >
                            {t.ourStory.shopNow}
                            <span className="material-icons">arrow_forward</span>
                        </Link>
                        <Link
                            href="/"
                            className="bg-charcoal hover:bg-zinc-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all text-center"
                        >
                            {t.ourStory.backToHome}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-charcoal text-gray-400 py-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
                    © {new Date().getFullYear()} PrimeCut. All rights reserved.
                </div>
            </footer>
        </main>
    )
}
