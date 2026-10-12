'use client'

import { useState } from 'react'
import Link from '@/app/components/AppLink'
import CopyButton from '@/app/components/CopyButton'
import PulseDot from '@/app/components/PulseDot'

const EMAIL = 'contact@lynq-css.com'

const BUDGETS = [
    { value: '', label: 'Je ne sais pas encore' },
    { value: 'lt1k', label: 'Moins de 1 000 € par mois' },
    { value: '1k-10k', label: 'De 1 000 à 10 000 € par mois' },
    { value: '10k-50k', label: 'De 10 000 à 50 000 € par mois' },
    { value: 'gt50k', label: 'Plus de 50 000 € par mois' },
]

const field =
    'mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-[#0FA968] focus:ring-4 focus:ring-[#0FA968]/15'
const label = 'block text-sm font-semibold text-zinc-900'

type Status = 'idle' | 'sending' | 'sent'

export default function OnboardingPage() {
    const [status, setStatus] = useState<Status>('idle')
    const [error, setError] = useState('')

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setStatus('sending')
        setError('')
        const data = Object.fromEntries(new FormData(event.currentTarget).entries())

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (response.ok) {
                setStatus('sent')
                return
            }
            const body = await response.json().catch(() => null)
            setError(body?.error ?? 'Envoi impossible pour le moment.')
        } catch {
            setError('Envoi impossible pour le moment.')
        }
        setStatus('idle')
    }

    return (
        <div className="bg-white">
            <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                        <PulseDot />
                        Inscription en autonomie
                    </p>
                    <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                        Activez Lynq CSS sur vos campagnes
                    </h1>
                    <p className="mt-4 text-lg text-zinc-600">
                        Deux minutes suffisent : indiquez votre identifiant Merchant Center et nous lançons votre mois d’essai gratuit.
                    </p>
                </div>

                <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    {/* Formulaire */}
                    <div className="relative rounded-3xl border-2 border-zinc-900 bg-white p-6 shadow-[0_24px_50px_-32px_rgba(24,24,27,0.25)] sm:p-8">
                        <span className="absolute -top-3 left-6 rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white">
                            Activation rapide · 2 minutes
                        </span>
                        {status === 'sent' ? (
                            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0FA968]/10 text-[#0FA968]">
                                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <h2 className="mt-5 text-xl font-bold text-zinc-900">Inscription enregistrée</h2>
                                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
                                    Nous activons votre mois d’essai gratuit et vous le confirmons par e-mail sous 2 h.
                                </p>
                                <Link href="/" className="mt-6 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
                                    Retour à l’accueil
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-5" noValidate={false}>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="lead-name" className={label}>Nom et prénom</label>
                                        <input id="lead-name" name="name" type="text" required maxLength={120} autoComplete="name" className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="lead-email" className={label}>E-mail professionnel</label>
                                        <input id="lead-email" name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="lead-website" className={label}>
                                            Site de la boutique <span className="font-normal text-zinc-400">(facultatif)</span>
                                        </label>
                                        <input id="lead-website" name="website" type="text" maxLength={200} placeholder="www.maboutique.fr" autoComplete="url" className={field} />
                                    </div>
                                    <div>
                                        <label htmlFor="lead-gmc" className={label}>Identifiant Merchant Center</label>
                                        <input id="lead-gmc" name="gmcId" type="text" required inputMode="numeric" pattern="[0-9 \-]{5,20}" maxLength={20} placeholder="123456789" className={field} />
                                    </div>
                                </div>
                                <p className="-mt-2 text-xs leading-5 text-zinc-500">
                                    L’identifiant est le numéro affiché en haut à droite de votre compte Google Merchant Center.
                                </p>

                                <div>
                                    <label htmlFor="lead-budget" className={label}>
                                        Budget Google Shopping <span className="font-normal text-zinc-400">(facultatif)</span>
                                    </label>
                                    <select id="lead-budget" name="budget" defaultValue="" className={field}>
                                        {BUDGETS.map((budget) => (
                                            <option key={budget.value} value={budget.value}>{budget.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="lead-message" className={label}>
                                        Message <span className="font-normal text-zinc-400">(facultatif)</span>
                                    </label>
                                    <textarea id="lead-message" name="message" rows={3} maxLength={2000} className={field} />
                                </div>

                                {/* Champ piège pour les robots : invisible et hors tabulation. */}
                                <div className="hidden" aria-hidden="true">
                                    <label htmlFor="lead-company">Société</label>
                                    <input id="lead-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
                                </div>

                                {error ? (
                                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error} Vous pouvez aussi nous écrire à {EMAIL}.
                                    </p>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={status === 'sending'}
                                    className="w-full rounded-full bg-zinc-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60"
                                >
                                    {status === 'sending' ? 'Envoi en cours…' : 'Activer mon essai gratuit'}
                                </button>
                                <p className="text-center text-xs leading-5 text-zinc-500">
                                    1 mois d’essai gratuit, sans engagement. Vos données servent uniquement à activer votre compte (
                                    <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900">confidentialité</Link>).
                                </p>
                            </form>
                        )}
                    </div>

                    {/* Accompagnement */}
                    <div className="flex flex-col gap-6">
                        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-900 ring-1 ring-zinc-200">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v10H9l-5 4V6z" />
                                </svg>
                            </span>
                            <h2 className="mt-5 text-lg font-bold text-zinc-900">Être accompagné</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-600">
                                Vous préférez échanger avec notre équipe d’abord ? Écrivez-nous, nous vous guidons dans l’activation.
                            </p>
                            <div className="mt-5 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
                                <a href={`mailto:${EMAIL}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900">
                                    {EMAIL}
                                </a>
                                <CopyButton value={EMAIL} label="Copier l’adresse e-mail" copiedLabel="Adresse copiée" />
                            </div>
                            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-zinc-600">
                                <PulseDot size="h-1.5 w-1.5" />
                                Réponse sous 2 h
                            </p>
                        </div>

                        <ul className="space-y-3 px-2 text-sm text-zinc-600">
                            {['Vos campagnes Google Ads restent inchangées', 'Retour au CSS Google possible à tout moment', 'Vos flux et vos enchères ne sont pas modifiés'].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#0FA968]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
