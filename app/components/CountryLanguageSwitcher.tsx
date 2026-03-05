'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

const COUNTRY_OPTIONS = [
  { code: 'FR', label: 'France', flag: '🇫🇷' },
  { code: 'PL', label: 'Pologne', flag: '🇵🇱' },
]

const LANG_OPTIONS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
]

export default function CountryLanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCountry = searchParams.get('country') || 'FR'

  const currentLang = useMemo(() => {
    const lang = searchParams.get('lang')
    if (lang === 'en' || lang === 'fr') return lang
    return currentCountry === 'FR' ? 'fr' : 'en'
  }, [searchParams, currentCountry])

  function updateUrl(nextCountry: string, nextLang: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('country', nextCountry)
    params.set('lang', nextLang)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextCountry = e.target.value
    const nextLang = nextCountry === 'FR' ? 'fr' : 'en'
    updateUrl(nextCountry, nextLang)
  }

  function handleLangChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLang = e.target.value
    updateUrl(currentCountry, nextLang)
  }

  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-full border border-zinc-200 bg-white/50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Pays */}
      <div className="relative group">
        <select
          value={currentCountry}
          onChange={handleCountryChange}
          className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-900 outline-none dark:text-white cursor-pointer"
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code} className="text-zinc-900">
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

      {/* Langue */}
      <div className="relative group">
        <select
          value={currentLang}
          onChange={handleLangChange}
          className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-900 outline-none dark:text-white cursor-pointer"
        >
          {LANG_OPTIONS.map((l) => (
            <option key={l.code} value={l.code} className="text-zinc-900">
              {l.code}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
