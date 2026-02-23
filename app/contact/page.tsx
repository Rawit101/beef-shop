"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../../lib/i18n";

export default function ContactPage() {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            // Using FormSubmit AJAX API
            const res = await fetch("https://formsubmit.co/ajax/kritsanaphong.ya@rmuti.ac.th", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || "Not provided",
                    _subject: `New Contact: ${formData.subject}`, // Email subject for FormSubmit
                    message: `Subject: ${formData.subject}\n\n${formData.message}`
                }),
            });

            if (res.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50 pt-10 pb-20 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-1/2 h-96 bg-primary opacity-5 blur-[100px] rounded-full z-0 pointer-events-none" />
                <div className="absolute top-40 left-0 w-1/3 h-64 bg-primary opacity-5 blur-[80px] rounded-full z-0 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 relative z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold tracking-tight text-charcoal sm:text-5xl inline-block pb-2 mb-4">
                            {t.contact.pageTitle}
                        </h1>
                        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto px-4">
                            {t.contact.pageSubtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16">
                        {/* Contact Information */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
                                <h2 className="text-3xl font-bold text-charcoal mb-8">{t.contact.infoTitle}</h2>

                                <div className="space-y-8">
                                    <div className="flex items-start group">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110">
                                                <span className="material-icons text-2xl">email</span>
                                            </div>
                                        </div>
                                        <div className="ml-6 flex-1">
                                            <h3 className="text-lg font-bold text-charcoal">{t.contact.emailLabel}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{t.contact.emailDesc}</p>
                                            <a href="mailto:hello@primecut.com" className="mt-2 block text-primary font-bold hover:underline">
                                                hello@primecut.com
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start group">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110">
                                                <span className="material-icons text-2xl">phone</span>
                                            </div>
                                        </div>
                                        <div className="ml-6 flex-1">
                                            <h3 className="text-lg font-bold text-charcoal">{t.contact.phoneLabel}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{t.contact.phoneDesc}</p>
                                            <a href="tel:+1234567890" className="mt-2 block text-primary font-bold hover:underline">
                                                +1 (555) 123-4567
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start group">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110">
                                                <span className="material-icons text-2xl">location_on</span>
                                            </div>
                                        </div>
                                        <div className="ml-6 flex-1">
                                            <h3 className="text-lg font-bold text-charcoal">{t.contact.officeLabel}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{t.contact.officeDesc}</p>
                                            <address className="mt-2 text-charcoal font-bold not-italic">
                                                100 Premium Beef Ave,<br />
                                                Meat District, NY 10001
                                            </address>
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div className="mt-12 pt-8 border-t border-gray-100">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t.contact.followUs}</p>
                                    <div className="flex gap-4">
                                        {['facebook', 'language', 'camera_alt'].map((icon) => (
                                            <a key={icon} href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors transform hover:scale-110">
                                                <span className="material-icons text-sm">{icon}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10 shadow-sm">
                                    {t.contact.respondsIn}
                                </div>

                                <h2 className="text-3xl font-bold text-charcoal mb-2">{t.contact.formTitle}</h2>
                                <p className="text-gray-500 mb-8 max-w-lg">{t.contact.formSubtitle}</p>

                                {status === "success" ? (
                                    <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-8 text-center" style={{ animation: "fadeIn 0.5s ease-out" }}>
                                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                            <span className="material-icons text-4xl">check</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">{t.contact.successTitle}</h3>
                                        <p className="mb-6 opacity-90">{t.contact.successMsg}</p>
                                        <button
                                            onClick={() => setStatus("idle")}
                                            className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                                        >
                                            {t.contact.sendAnother}
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                                                    {t.contact.nameLabel}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal outline-none placeholder:text-gray-400 font-medium"
                                                    placeholder={t.contact.namePlaceholder}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                                    {t.contact.emailAddressLabel}
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal outline-none placeholder:text-gray-400 font-medium"
                                                    placeholder={t.contact.emailAddressPlaceholder}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">
                                                    {t.contact.phoneNumberLabel} <span className="text-gray-400 font-normal ml-1">{t.contact.phoneOptional}</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal outline-none placeholder:text-gray-400 font-medium"
                                                    placeholder={t.contact.phonePlaceholder}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="subject" className="block text-sm font-bold text-gray-700 mb-2">
                                                    {t.contact.subjectLabel}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="subject"
                                                    id="subject"
                                                    required
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal outline-none placeholder:text-gray-400 font-medium"
                                                    placeholder={t.contact.subjectPlaceholder}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
                                                {t.contact.messageLabel}
                                            </label>
                                            <textarea
                                                name="message"
                                                id="message"
                                                rows={5}
                                                required
                                                value={formData.message}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal resize-none outline-none placeholder:text-gray-400 font-medium"
                                                placeholder={t.contact.messagePlaceholder}
                                            ></textarea>
                                        </div>

                                        {status === "error" && (
                                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-bold animate-pulse">
                                                <span className="material-icons text-xl">error_outline</span>
                                                {t.contact.errorMsg}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={status === "loading"}
                                            className={`w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 ${status === "loading" ? "opacity-75 cursor-not-allowed transform scale-[0.98]" : "hover:-translate-y-1"
                                                }`}
                                        >
                                            {status === "loading" ? (
                                                <>
                                                    <span className="material-icons animate-spin">autorenew</span>
                                                    {t.contact.sending}
                                                </>
                                            ) : (
                                                <>
                                                    {t.contact.sendBtn}
                                                    <span className="material-icons text-xl">send</span>
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-gray-400 font-medium mt-4">
                                            {t.contact.formDisclaimer}
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
            </main>
            <Footer />
        </>
    );
}
