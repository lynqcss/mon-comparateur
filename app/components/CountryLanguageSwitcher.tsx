'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

const COUNTRY_OPTIONS = [
  { code: 'FR', label: { fr: 'France', en: 'France' } },
  { code: 'PL', label: { fr: 'Pologne', en: 'Poland' } },
]

const LANG_OPTIONS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
] as const

const LABELS = {
  fr: { button: 'Pays et langue', country: 'Pays', language: 'Langue' },
  en: { button: 'Country and language', country: 'Country', language: 'Language' },
}

export default function CountryLanguageSwitcher({ align = 'right' }: { align?: 'left' | 'right' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const currentCountry = searchParams.get('country') || 'FR'

  const currentLang = useMemo(() => {
    const lang = searchParams.get('lang')
    if (lang === 'en' || lang === 'fr') return lang
    return currentCountry === 'FR' ? 'fr' : 'en'
  }, [searchParams, currentCountry])

  const labels = LABELS[currentLang]

  // Fermeture au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function updateUrl(nextCountry: string, nextLang: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('country', nextCountry)
    params.set('lang', nextLang)
    const qs = params.toString()
    setOpen(false)
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const optionClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
    }`

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={labels.button}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span>
          {COUNTRY_OPTIONS.find((c) => c.code === currentCountry)?.label[currentLang] ?? currentCountry} · {currentLang.toUpperCase()}
        </span>
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={labels.button}
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} z-50 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{labels.country}</p>
          <div className="mt-2 flex gap-1 rounded-xl bg-zinc-50 p-1 dark:bg-zinc-950">
            {COUNTRY_OPTIONS.map((country) => (
              <button
                key={country.code}
                type="button"
                aria-pressed={country.code === currentCountry}
                onClick={() => updateUrl(country.code, country.code === 'FR' ? 'fr' : 'en')}
                className={optionClass(country.code === currentCountry)}
              >
                {country.label[currentLang]}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">{labels.language}</p>
          <div className="mt-2 flex gap-1 rounded-xl bg-zinc-50 p-1 dark:bg-zinc-950">
            {LANG_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                type="button"
                aria-pressed={lang.code === currentLang}
                onClick={() => updateUrl(currentCountry, lang.code)}
                className={optionClass(lang.code === currentLang)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
