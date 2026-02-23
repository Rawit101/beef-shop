"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import en, { type TranslationKeys } from "./locales/en"
import th from "./locales/th"
import ja from "./locales/ja"
import zh from "./locales/zh"

export type LangCode = "en" | "th" | "ja" | "zh"

const translations: Record<LangCode, TranslationKeys> = { en, th, ja, zh }

export const languages = [
    { code: "en" as const, label: "English", native: "United States", flag: "🇺🇸" },
    { code: "th" as const, label: "ภาษาไทย", native: "Thai", flag: "🇹🇭" },
    { code: "ja" as const, label: "日本語", native: "Japanese", flag: "🇯🇵" },
    { code: "zh" as const, label: "中文", native: "Chinese", flag: "🇨🇳" },
]

interface LanguageContextType {
    lang: LangCode
    setLang: (lang: LangCode) => void
    t: TranslationKeys
    currentLanguage: (typeof languages)[number]
}

const LanguageContext = createContext<LanguageContextType>({
    lang: "en",
    setLang: () => { },
    t: en,
    currentLanguage: languages[0],
})

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<LangCode>("en")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem("primecut-lang") as LangCode | null
        if (saved && translations[saved]) {
            setLangState(saved)
        }
        setMounted(true)
    }, [])

    const setLang = (newLang: LangCode) => {
        setLangState(newLang)
        localStorage.setItem("primecut-lang", newLang)
    }

    const t = translations[lang]
    const currentLanguage = languages.find((l) => l.code === lang) || languages[0]

    // Prevent hydration mismatch — render English on first SSR render
    if (!mounted) {
        return (
            <LanguageContext.Provider value={{ lang: "en", setLang, t: en, currentLanguage: languages[0] }}>
                {children}
            </LanguageContext.Provider>
        )
    }

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, currentLanguage }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) throw new Error("useLanguage must be used inside LanguageProvider")
    return context
}
