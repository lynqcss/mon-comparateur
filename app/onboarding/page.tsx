'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function OnboardingChoicePage() {
    const [copied, setCopied] = useState(false)

    const copyEmail = async () => {
        await navigator.clipboard.writeText('contact@lynq-css.com')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Header */}
            <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-xl font-black tracking-tight text-zinc-900">
                        Lynq<span className="text-gradient">CSS</span>
                    </Link>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Onboarding
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-24">
                <div className="text-center mb-12">
                    <div className="mb-6 text-6xl">🎯</div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl whitespace-nowrap">
                        Comment souhaitez-vous activer Lynq CSS ?
                    </h1>
                    <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500">
                        Choisissez la méthode qui vous convient le mieux.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Option 1: Auto onboarding (primary) */}
                    <Link
                        href="/onboarding/auto"
                        className="group relative flex flex-col rounded-3xl border-2 border-zinc-900 bg-white p-8 shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1"
                    >
                        <div className="absolute -top-3 left-6">
                            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white">
                                Recommandé
                            </span>
                        </div>
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-3xl transition-transform group-hover:scale-110">
                            ⚡
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-3">
                            Activation instantanée
                        </h2>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-1">
                            Connectez votre Google Merchant Center en quelques clics et activez l&apos;avantage CSS immédiatement. Tout est automatisé.
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            ~2 minutes
                        </div>
                    </Link>

                    {/* Option 2: Contact */}
                    <div className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-3xl">
                            💬
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-3">
                            Être accompagné
                        </h2>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-1">
                            Vous préférez échanger avec notre équipe ? Écrivez-nous et nous vous guiderons dans l&apos;activation.
                        </p>
                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <span className="flex-1 text-sm font-medium text-zinc-700 truncate">
                                contact@lynq-css.com
                            </span>
                            <button
                                onClick={copyEmail}
                                className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-95"
                            >
                                {copied ? 'Copié !' : 'Copier'}
                            </button>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm font-bold text-zinc-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Réponse sous 12h
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-zinc-600 transition-colors">
                        ← Retour à l&apos;accueil
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
                © {new Date().getFullYear()} Lynq CSS — Tous droits réservés
            </footer>
        </div>
    )
}
