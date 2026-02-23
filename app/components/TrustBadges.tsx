"use client"

import { useLanguage } from "../../lib/i18n"

export default function TrustBadges() {
    const { t } = useLanguage()

    const badges = [
        {
            icon: "ac_unit",
            title: t.trustBadges.badge1Title,
            desc: t.trustBadges.badge1Desc,
        },
        {
            icon: "agriculture",
            title: t.trustBadges.badge2Title,
            desc: t.trustBadges.badge2Desc,
        },
        {
            icon: "verified",
            title: t.trustBadges.badge3Title,
            desc: t.trustBadges.badge3Desc,
        },
    ]

    return (
        <section className="py-12 bg-white border-b border-primary/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {badges.map((badge) => (
                        <div key={badge.icon} className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="material-icons text-primary text-3xl">
                                    {badge.icon}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{badge.title}</h3>
                                <p className="text-sm text-gray-500">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
