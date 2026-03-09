'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type MerchantAccount = {
    merchantId: string
    aggregatorId: string | null
}

function OnboardingContent() {
    const searchParams = useSearchParams()
    const stepParam = searchParams.get('step')
    const sessionId = searchParams.get('session')
    const errorParam = searchParams.get('error')
    const returnUrl = searchParams.get('return_url')

    const [currentStep, setCurrentStep] = useState<'connect' | 'merchants' | 'confirm'>(
        stepParam === 'merchants' ? 'merchants' : stepParam === 'confirm' ? 'confirm' : 'connect'
    )
    const [merchants, setMerchants] = useState<MerchantAccount[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [error, setError] = useState(errorParam || '')
    const [switchResult, setSwitchResult] = useState<string | null>(null)

    // Fetch merchants when we land on step 2
    const fetchMerchants = useCallback(async () => {
        if (!sessionId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/auth/merchants?session=${sessionId}`)
            const data = await res.json()
            if (data.error) {
                setError(data.error)
            } else {
                setMerchants(data.accounts || [])
                setEmail(data.email || '')
            }
        } catch {
            setError('Erreur lors de la récupération des comptes marchands.')
        } finally {
            setLoading(false)
        }
    }, [sessionId])

    useEffect(() => {
        if (currentStep === 'merchants' && sessionId) {
            fetchMerchants()
        }
    }, [currentStep, sessionId, fetchMerchants])

    const toggleMerchant = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const handleConfirm = async () => {
        if (selectedIds.length === 0) return
        setLoading(true)
        try {
            const res = await fetch('/api/auth/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, merchantIds: selectedIds }),
            })
            const data = await res.json()
            if (data.success) {
                setSwitchResult(data.message)
                setCurrentStep('confirm')
            } else {
                setError(data.error || 'Erreur lors du switch CSS.')
            }
        } catch {
            setError('Erreur réseau.')
        } finally {
            setLoading(false)
        }
    }

    const errorMessages: Record<string, string> = {
        consent_denied: 'Vous avez refusé l\'accès. Veuillez réessayer.',
        no_code: 'Erreur d\'authentification. Veuillez réessayer.',
        token_exchange: 'Erreur lors de l\'échange de tokens. Veuillez réessayer.',
        db_error: 'Erreur interne. Veuillez réessayer.',
    }

    const steps = [
        { key: 'connect', label: 'Connexion', num: '1' },
        { key: 'merchants', label: 'Google Merchant Center', num: '2' },
        { key: 'confirm', label: 'Confirmation', num: '3' },
    ]

    const stepIndex = steps.findIndex((s) => s.key === currentStep)

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

            {/* Progress Bar */}
            <div className="mx-auto w-full max-w-2xl px-6 pt-12">
                <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                        <div key={step.key} className="flex items-center gap-3">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${idx <= stepIndex
                                    ? 'bg-zinc-900 text-white shadow-lg'
                                    : 'bg-zinc-100 text-zinc-400'
                                    }`}
                            >
                                {idx < stepIndex ? '✓' : step.num}
                            </div>
                            <span
                                className={`text-sm font-bold whitespace-nowrap ${idx <= stepIndex ? 'text-zinc-900' : 'text-zinc-400'
                                    }`}
                            >
                                {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                                <div
                                    className={`mx-4 h-px w-16 ${idx < stepIndex ? 'bg-zinc-900' : 'bg-zinc-200'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
                {/* Error Banner */}
                {error && (
                    <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {errorMessages[error] || error}
                    </div>
                )}

                {/* Step 1: Connect */}
                {currentStep === 'connect' && (
                    <div className="text-center">
                        <div className="mb-6 text-6xl">🔗</div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
                            Connectez votre Google Merchant Center
                        </h1>
                        <p className="mx-auto mt-4 max-w-md text-lg text-zinc-500">
                            Connectez votre compte Google pour accéder à vos Merchant Center et activer Lynq CSS en quelques clics.
                        </p>
                        <div className="mt-12">
                            <a
                                href={`/api/auth/login${returnUrl ? '?return_url=' + encodeURIComponent(returnUrl) : ''}`}
                                className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-8 py-4 text-base font-bold text-zinc-700 shadow-sm transition-all hover:shadow-lg hover:scale-105 active:scale-95"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Se connecter avec Google
                            </a>
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Connexion sécurisée via Google OAuth 2.0</span>
                        </div>
                    </div>
                )}

                {/* Step 2: Select Merchants */}
                {currentStep === 'merchants' && (
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
                            Sélectionnez vos comptes
                        </h1>
                        <p className="mt-2 text-zinc-500">
                            Connecté en tant que <span className="font-bold text-zinc-900">{email}</span>
                        </p>

                        {loading ? (
                            <div className="mt-12 flex justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                            </div>
                        ) : merchants.length === 0 ? (
                            <div className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
                                <div className="text-4xl mb-4">🤷</div>
                                <p className="text-zinc-600 font-medium">
                                    Aucun compte Google Merchant Center trouvé pour ce compte Google.
                                </p>
                                <p className="mt-2 text-sm text-zinc-400">
                                    Vérifiez que votre compte Google a bien accès à un Google Merchant Center.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="mt-8 space-y-3">
                                    {merchants.map((m) => (
                                        <label
                                            key={m.merchantId}
                                            className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition-all ${selectedIds.includes(m.merchantId)
                                                ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                                                : 'border-zinc-200 hover:border-zinc-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(m.merchantId)}
                                                onChange={() => toggleMerchant(m.merchantId)}
                                                className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                            />
                                            <div>
                                                <div className="text-sm font-bold text-zinc-900">
                                                    Merchant ID: {m.merchantId}
                                                </div>
                                                {m.aggregatorId && (
                                                    <div className="text-xs text-zinc-400">
                                                        Aggregator: {m.aggregatorId}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="mt-10">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={selectedIds.length === 0 || loading}
                                        className="w-full rounded-full bg-zinc-900 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Envoi en cours...' : `Activer Lynq CSS sur ${selectedIds.length} marchand${selectedIds.length > 1 ? 's' : ''}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {currentStep === 'confirm' && (
                    <div className="text-center">
                        <div className="mb-6 text-6xl">🎉</div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
                            Demande envoyée !
                        </h1>
                        <p className="mx-auto mt-4 max-w-md text-lg text-zinc-500">
                            {switchResult || 'Votre demande de switch CSS a été envoyée avec succès. Vous recevrez un email de Google pour approuver le changement.'}
                        </p>
                        <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-left">
                            <h3 className="font-bold text-zinc-900 mb-3">Prochaines étapes :</h3>
                            <ol className="space-y-2 text-sm text-zinc-600">
                                <li className="flex gap-2">
                                    <span className="font-bold text-zinc-900">1.</span>
                                    Vérifiez votre email pour l&apos;invitation Google
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-zinc-900">2.</span>
                                    Approuvez le switch CSS dans votre Google Merchant Center
                                </li>
                            </ol>
                        </div>

                        {/* Guide: Comment approuver le switch CSS */}
                        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 text-left">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-lg">💡</span>
                                <h3 className="font-bold text-zinc-900">Comment approuver le switch CSS ?</h3>
                            </div>
                            <p className="text-sm text-zinc-600 mb-4">
                                Les administrateurs de votre compte Google Merchant Center recevront une notification pour approuver le changement de CSS. Voici où trouver cette notification selon votre type de compte :
                            </p>
                            <div className="space-y-4">
                                <div className="rounded-xl border border-blue-200/60 bg-white p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">A</span>
                                        <span className="text-sm font-bold text-zinc-900">Compte Standalone ou Multi-Client (MCA)</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 ml-8">
                                        Allez dans : <span className="font-semibold text-zinc-700">Paramètres → Général → Configuration du compte → Services de comparaison de prix</span>
                                    </p>
                                </div>
                                <div className="rounded-xl border border-blue-200/60 bg-white p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">B</span>
                                        <span className="text-sm font-bold text-zinc-900">Sous-compte d&apos;un MCA</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 ml-8">
                                        Allez dans : <span className="font-semibold text-zinc-700">Paramètres (icône ⚙️ en haut à droite) → Options générales du compte → Configuration du compte</span>
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-zinc-400">
                                Vous pouvez également retrouver la notification dans l&apos;onglet <span className="font-semibold">Notifications</span> de votre Google Merchant Center.
                            </p>
                        </div>
                        <div className="mt-10 flex flex-col items-center gap-4">
                            {returnUrl ? (
                                <Link
                                    href={(() => {
                                        try {
                                            const url = new URL(returnUrl)
                                            url.searchParams.set('lynq_connected', 'true')
                                            return url.toString()
                                        } catch {
                                            return returnUrl
                                        }
                                    })()}
                                    className="inline-flex rounded-full bg-zinc-900 px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
                                >
                                    Retourner à votre boutique
                                </Link>
                            ) : (
                                <Link
                                    href="/"
                                    className="inline-flex rounded-full bg-zinc-900 px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
                                >
                                    Retour à l&apos;accueil
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
                © {new Date().getFullYear()} Lynq CSS — Tous droits réservés
            </footer>
        </div>
    )
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    )
}
