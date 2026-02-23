"use client"

import { useEffect } from "react"
import { LanguageProvider, useLanguage } from "../lib/i18n"

function LanguageBodyClass() {
    const { lang } = useLanguage()

    useEffect(() => {
        // Remove all lang-* classes, then add current one
        document.body.classList.forEach((cls) => {
            if (cls.startsWith("lang-")) document.body.classList.remove(cls)
        })
        document.body.classList.add(`lang-${lang}`)
    }, [lang])

    return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <LanguageBodyClass />
            {children}
        </LanguageProvider>
    )
}
