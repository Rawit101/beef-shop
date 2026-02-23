"use client"

import Link from "next/link"
import { useLanguage } from "../../lib/i18n"

const categoryImages = [
    {
        catKey: "steak",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCp4A0Bzr7MATVN7sctuKaw23VBSOo-o0EV8X7p1ooGYhxzTUIA4D6ucVWIR4F8w0wyqSKoSSH_EwzlVwBeDHv02NAYV-UDUnpYWaNWCV0AyH66lC7hl7jL3sYgYnq4fBy_UX8p_D6ZpdX18NznWvGKspNgpan54U_mXQwB4VxiBrCPQxjCTFbEgZQy7ptgG-Eq9g9sOnq_WGvVSpB39T3l11_wvekmz3-CtYBE_oAQDOOFyDzu6-SaoXme3e9nxlToTxgacnvRtBJj",
    },
    {
        catKey: "shabu",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-d-4Mp4DqOQtgX_Q5siyDg1OFypPGJlLtVZt5Txzrox79bqp0V7RuVR_Wmt_YvIWZ5EOaqhqiQtoTLAy1sP4Ei5TYMCe_LkgxWJRMqmpCPhP3eyOvTYJ0mD_NRuXztF5a_66b4-R_A5NnvCe9owj73xEL8L-JmUr7uzkR54rRqZWNjUY_nUwDgfoQrpISq8XsywXhEXfev_ddY0RNkUF4zMicAfOk_qNyN93eb4k706hO6C_OMEl9bcP-N2fBDPNuS93vfkn4UVeZ",
    },
    {
        catKey: "wagyu",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjfUNXHYPXBDemM4g0pCR2HlJBrc13IPNIZv5NnppeTu0HPW0-NYsATQUpwcjosCP4wDd27zIND36R3Tra5ohmSGmRaiwfNdxelpY462E-6w4bYaXB0uORMFEbFnLUC1LtkVTorquROwLhCS30fGLGIv2y-Slll0ml3dU0rCOjetK2-xpZQ5Fm7SYWs4IMdCG_BrSXi85GO_jopASUX80tHZ82IEtV23g2VKh-OxPF6PUGQ4Re20W0VMCB5ErLGs2aRyHlMNE60JSn",
    },
]

export default function CategorySection() {
    const { t } = useLanguage()

    const categories = [
        { name: t.categories.steak, desc: t.categories.steakDesc, ...categoryImages[0] },
        { name: t.categories.shabu, desc: t.categories.shabuDesc, ...categoryImages[1] },
        { name: t.categories.wagyu, desc: t.categories.wagyuDesc, ...categoryImages[2] },
    ]

    return (
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-2">
                        {t.categories.sectionLabel}
                    </h2>
                    <p className="text-4xl font-extrabold">{t.categories.sectionTitle}</p>
                </div>
                <Link
                    href="/products"
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                    {t.categories.viewAll}{" "}
                    <span className="material-icons text-sm">north_east</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {categories.map((cat) => (
                    <Link
                        key={cat.catKey}
                        href={`/products?cat=${cat.catKey}`}
                        className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer block"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            src={cat.image}
                            alt={cat.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-8 left-8">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {cat.name}
                            </h3>
                            <p className="text-white/70 text-sm mb-4">{cat.desc}</p>
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md group-hover:bg-primary transition-colors">
                                <span className="material-icons text-white text-sm">
                                    arrow_forward
                                </span>
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
