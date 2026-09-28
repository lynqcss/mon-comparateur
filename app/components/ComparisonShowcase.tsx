'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

/**
 * Animation « motion design » de la landing page : une recherche sur Lynq,
 * les offres de quatre marchands pour un même produit, le tri par prix total,
 * le meilleur prix, l'économie réalisée, puis la signature de marque.
 *
 * Pourquoi un composant plutôt qu'une vidéo MP4 : rendu vectoriel net à toutes
 * les tailles, suivi du mode sombre, et quelques Ko au lieu de plusieurs Mo
 * servis à chaque visite (la bande passante Vercel est un poste surveillé).
 *
 * Fonctionnement : une scène de taille fixe (paysage ou portrait) est mise à
 * l'échelle de son conteneur, comme une vidéo. Chaque élément calcule son
 * état à partir d'un seul temps `t` qui boucle sur DURATION secondes.
 * L'animation se met en pause hors de l'écran, respecte
 * `prefers-reduced-motion` (image fixe) et propose un bouton pause.
 */

export type ShowcaseLabels = {
  query: string
  placeholder: string
  search: string
  category: string
  productName: string
  offersFound: string
  offersTitle: string
  sortedBy: string
  bestPrice: string
  freeShipping: string
  shipping: string
  savingsLead: string
  savingsTail: string
  tagline: string
  pause: string
  play: string
  ariaLabel: string
}

type Props = {
  labels: ShowcaseLabels
  /** Locale Intl pour les prix, ex. 'fr-FR' ou 'en-IE'. */
  locale: string
}

// ---------------------------------------------------------------------------
// Timeline (secondes)
// ---------------------------------------------------------------------------
const DURATION = 16
/** Image affichée quand l'utilisateur a demandé à réduire les animations. */
const STATIC_FRAME = 11.9

// ---------------------------------------------------------------------------
// Données de démonstration — marchands et produit FICTIFS, pour ne suggérer
// aucun partenariat avec une enseigne réelle.
// ---------------------------------------------------------------------------
type Tint = 'indigo' | 'amber' | 'rose' | 'sky'

const OFFERS: { name: string; tint: Tint; price: number; shipping: number }[] = [
  { name: 'Hexa Store', tint: 'indigo', price: 1129, shipping: 0 },
  { name: 'ElectroPlus', tint: 'amber', price: 1049, shipping: 9.9 },
  { name: 'Maison Tech', tint: 'rose', price: 1199, shipping: 0 },
  { name: 'Kiwi Market', tint: 'sky', price: 989, shipping: 0 },
]

const TINT: Record<Tint, string> = {
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
}

// Le tri se fait sur le prix TOTAL (prix + livraison), comme sur le site.
const TOTALS = OFFERS.map((o) => o.price + o.shipping)
const ORDER = TOTALS.map((_, i) => i).sort((a, b) => TOTALS[a] - TOTALS[b])
const RANK = OFFERS.map((_, i) => ORDER.indexOf(i))
const BEST = ORDER[0]
// Tri en deux temps, pour que les lignes ne se traversent pas en désordre :
// 1) le gagnant se soulève et monte en tête pendant que les autres descendent
//    d'un cran ; 2) les suivants prennent leur place définitive.
const ORDER_1 = [BEST, ...OFFERS.map((_, i) => i).filter((i) => i !== BEST)]
const SLOT_1 = OFFERS.map((_, i) => ORDER_1.indexOf(i))
const SAVINGS = Math.round(TOTALS[ORDER[ORDER.length - 1]] - TOTALS[BEST])
const PRODUCT_URL = 'lynq-css.com/product/0194253401234'

// ---------------------------------------------------------------------------
// Géométrie des deux compositions (coordonnées du contenu de la fenêtre)
// ---------------------------------------------------------------------------
type Rect = { x: number; y: number; w: number; h: number }
type Geo = {
  W: number
  H: number
  win: Rect
  chrome: number
  introY: number
  searchCenter: Rect
  searchTop: Rect
  product: Rect
  compact: boolean
  savings: Rect
  offers: { x: number; w: number; headerY: number; y0: number; rowH: number; step: number }
}

const WIDE: Geo = {
  W: 960,
  H: 600,
  win: { x: 40, y: 28, w: 880, h: 544 },
  chrome: 44,
  introY: 170,
  searchCenter: { x: 160, y: 248, w: 560, h: 56 },
  searchTop: { x: 28, y: 20, w: 824, h: 48 },
  product: { x: 28, y: 88, w: 276, h: 292 },
  compact: false,
  savings: { x: 28, y: 394, w: 276, h: 90 },
  offers: { x: 328, w: 524, headerY: 90, y0: 128, rowH: 68, step: 80 },
}

const NARROW: Geo = {
  W: 420,
  H: 720,
  win: { x: 10, y: 10, w: 400, h: 700 },
  chrome: 40,
  introY: 262,
  searchCenter: { x: 20, y: 328, w: 360, h: 52 },
  searchTop: { x: 16, y: 14, w: 368, h: 44 },
  product: { x: 16, y: 72, w: 368, h: 104 },
  compact: true,
  savings: { x: 16, y: 532, w: 368, h: 80 },
  offers: { x: 16, w: 368, headerY: 190, y0: 222, rowH: 64, step: 74 },
}

// ---------------------------------------------------------------------------
// Courbes d'animation
// ---------------------------------------------------------------------------
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const prog = (t: number, start: number, dur: number) => clamp01((t - start) / dur)
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const outCubic = (p: number) => 1 - (1 - p) ** 3
const inOutCubic = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)
const outBack = (p: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2
}
const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
})

// useLayoutEffect ne s'exécute pas côté serveur : on retombe sur useEffect.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const LOGO_PATH =
  'M 35,20 V 70 A 20,20 0 0,0 55,90 H 90 A 25,25 0 0,0 115,65 A 25,25 0 0,0 90,40 H 65 A 15,15 0 0,0 50,55 A 15,15 0 0,0 65,70 H 80'

export default function ComparisonShowcase({ labels, locale }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  const [isWide, setIsWide] = useState(true)
  const [scale, setScale] = useState(0)
  const [clock, setClock] = useState(0)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)

  const g = isWide ? WIDE : NARROW

  // Composition : même seuil que la classe `md:` du conteneur (768 px).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsWide(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Mise à l'échelle de la scène sur la largeur du conteneur.
  useIsoLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / g.W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [g.W])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Pause automatique hors de l'écran : aucun calcul pour un visiteur qui a
  // fait défiler la page.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.15,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Boucle d'animation (inactive en mouvement réduit : on affiche STATIC_FRAME).
  useEffect(() => {
    if (reduced || !visible || paused) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      // Borné à 100 ms : pas de saut brutal après un changement d'onglet.
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!document.hidden) {
        elapsed.current = (elapsed.current + dt) % DURATION
        setClock(elapsed.current)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, paused, reduced])

  const fmt = useMemo(() => {
    const whole = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    const cents = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return (value: number, withCents: boolean) =>
      withCents ? cents.format(value) : whole.format(Math.round(value))
  }, [locale])

  // Temps affiché : image fixe si l'utilisateur a demandé moins d'animations.
  const t = reduced ? STATIC_FRAME : clock

  // ----------------------------------------------------------------- scène 1
  const typeP = prog(t, 0.5, 1.6)
  const upP = inOutCubic(prog(t, 2.5, 0.7))
  const outP = inOutCubic(prog(t, 12.2, 0.6))
  const loopInP = outCubic(prog(t, 15.5, 0.5))
  const looping = t >= 15.5

  const up = looping ? 0 : upP
  const search = lerpRect(g.searchCenter, g.searchTop, up)
  const searchOpacity = t < 12.2 ? 1 : looping ? loopInP : 1 - outP
  const typed = looping ? '' : labels.query.slice(0, Math.round(typeP * labels.query.length))
  const typing = typeP > 0 && typeP < 1
  const caret = (t < 3.2 || looping) && (typing || Math.floor(t * 2.4) % 2 === 0)
  const pressScale = 1 - 0.07 * Math.sin(Math.PI * prog(t, 2.15, 0.35))
  const introOpacity = looping ? loopInP : 1 - upP

  // ----------------------------------------------------------- scènes 2 à 6
  const contentOpacity = 1 - outP
  const productP = outCubic(prog(t, 2.9, 0.7))
  const headerP = outCubic(prog(t, 3.4, 0.4))
  const chipP = prog(t, 6.2, 0.3)
  const chipScale = outBack(prog(t, 6.2, 0.45))
  const sort1 = inOutCubic(prog(t, 6.6, 0.75))
  const sort2 = inOutCubic(prog(t, 7.45, 0.65))
  // Tout ce qui suit attend la fin du tri (8,1 s).
  const bestOpacity = prog(t, 8.15, 0.4)
  const badgeScale = outBack(prog(t, 8.25, 0.5))
  const dimP = prog(t, 8.15, 0.5)
  const diffOpacity = prog(t, 8.5, 0.5)
  const savMove = outBack(prog(t, 9.2, 0.6))
  const savOpacity = prog(t, 9.2, 0.3)
  const savCount = outCubic(prog(t, 9.4, 1.4))
  const shineP = inOutCubic(prog(t, 10.9, 0.8))
  const phoneFloat = Math.sin(t * 1.8) * 3

  // ----------------------------------------------------------------- scène 7
  const brandActive = t >= 12.6
  const logoP = inOutCubic(prog(t, 12.8, 1.2))
  const wordP = outCubic(prog(t, 13.6, 0.6))
  const tagP = outCubic(prog(t, 14.0, 0.6))
  const brandOpacity = 1 - outCubic(prog(t, 15.4, 0.5))

  const url = t >= 2.6 && t < 12.5 ? PRODUCT_URL : 'lynq-css.com'
  const offersFound = labels.offersFound.replace('{n}', String(OFFERS.length))
  const o = g.offers
  const contentH = g.win.h - g.chrome

  return (
    <figure aria-label={labels.ariaLabel} className="relative mx-auto w-full max-w-[440px] md:max-w-none">
      <div
        ref={wrapRef}
        className="relative w-full aspect-[420/720] md:aspect-[960/600]"
      >
        <div
          className="absolute left-0 top-0 origin-top-left transition-opacity duration-500 motion-reduce:transition-none"
          style={{ width: g.W, height: g.H, transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}
        >
          <div aria-hidden="true" className="absolute inset-0">
            {/* Halo d'ambiance : déplacés par transform pour rester sur le compositeur */}
            <div
              className="absolute rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/10"
              style={{
                width: g.W * 0.36,
                height: g.W * 0.36,
                left: g.W * 0.02,
                top: g.H * 0.34,
                transform: `translate(${Math.sin(t * 0.39) * 30}px, ${Math.cos(t * 0.31) * 24}px)`,
              }}
            />
            <div
              className="absolute rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-500/10"
              style={{
                width: g.W * 0.32,
                height: g.W * 0.32,
                left: g.W * 0.62,
                top: g.H * 0.02,
                transform: `translate(${Math.cos(t * 0.35) * 28}px, ${Math.sin(t * 0.43) * 20}px)`,
              }}
            />

            {/* Fenêtre de navigateur */}
            <div
              className="absolute overflow-hidden rounded-[22px] border border-zinc-200 bg-white shadow-[0_30px_80px_-24px_rgba(24,24,27,0.35)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_30px_80px_-24px_rgba(0,0,0,0.8)]"
              style={{ left: g.win.x, top: g.win.y, width: g.win.w, height: g.win.h }}
            >
              <div
                className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50/80 px-4 dark:border-zinc-800 dark:bg-zinc-900"
                style={{ height: g.chrome }}
              >
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="mx-auto flex h-7 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-xs text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                  </svg>
                  <span className="truncate">{url}</span>
                </div>
                <div className="w-[52px] shrink-0" />
              </div>

              <div className="relative" style={{ height: contentH }}>
                {/* Scène 1 — signature d'accueil */}
                <div
                  className="absolute inset-x-0 flex items-center justify-center gap-2.5"
                  style={{ top: g.introY, opacity: introOpacity, transform: `translateY(${-14 * up}px)` }}
                >
                  <svg viewBox="0 0 140 120" className="h-8 w-auto text-[#2B3A4A] dark:text-zinc-100">
                    <path d={LOGO_PATH} fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Lynq</span>
                </div>

                {/* Barre de recherche */}
                <div
                  className="absolute z-10 flex items-center gap-2 rounded-full border border-zinc-200 bg-white pl-4 pr-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
                  style={{ left: search.x, top: search.y, width: search.w, height: search.h, opacity: searchOpacity }}
                >
                  <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <div className="flex min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap text-[15px]">
                    {typed ? (
                      <span className="text-zinc-900 dark:text-white">{typed}</span>
                    ) : null}
                    <span
                      className="mx-px inline-block h-[18px] w-[2px] shrink-0 bg-zinc-900 dark:bg-white"
                      style={{ opacity: caret ? 1 : 0 }}
                    />
                    {typed ? null : <span className="truncate text-zinc-400">{labels.placeholder}</span>}
                  </div>
                  <div
                    className="flex h-[calc(100%-12px)] shrink-0 items-center rounded-full bg-zinc-900 px-5 text-[13px] font-bold text-white dark:bg-white dark:text-zinc-900"
                    style={{ transform: `scale(${pressScale})` }}
                  >
                    {labels.search}
                  </div>
                </div>

                {/* Scènes 2 à 6 — résultat de la comparaison */}
                <div
                  className="absolute inset-0 origin-center"
                  style={{ opacity: contentOpacity, transform: `scale(${lerp(1, 0.97, outP)})` }}
                >
                  {/* Fiche produit */}
                  <div
                    className={`absolute rounded-2xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50 ${
                      g.compact ? 'flex items-center gap-4 px-4' : 'p-5'
                    }`}
                    style={{
                      left: g.product.x,
                      top: g.product.y,
                      width: g.product.w,
                      height: g.product.h,
                      opacity: productP,
                      transform: `translateY(${(1 - productP) * 24}px)`,
                    }}
                  >
                    <div
                      className={g.compact ? 'h-[84px] w-[52px] shrink-0' : 'flex h-[150px] items-center justify-center'}
                      style={{ transform: `translateY(${phoneFloat}px)` }}
                    >
                      <Phone id={uid} />
                    </div>
                    <div className={g.compact ? 'min-w-0' : 'mt-4'}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">{labels.category}</p>
                      <p className="mt-1 truncate text-lg font-bold text-zinc-900 dark:text-white">{labels.productName}</p>
                      <span className="mt-2.5 inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
                        {offersFound}
                      </span>
                    </div>
                  </div>

                  {/* En-tête des offres + pastille de tri */}
                  <div
                    className="absolute flex items-center justify-between"
                    style={{ left: o.x, top: o.headerY, width: o.w, height: 28, opacity: headerP }}
                  >
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{labels.offersTitle}</p>
                    <span
                      className="inline-flex origin-right items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      style={{ opacity: chipP, transform: `scale(${lerp(0.8, 1, chipScale)})` }}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h13M3 12h9M3 18h5M17 8v12m0 0-3-3m3 3 3-3" />
                      </svg>
                      {labels.sortedBy}
                    </span>
                  </div>

                  {/* Offres : arrivée, tri, meilleur prix */}
                  {OFFERS.map((offer, i) => {
                    const enter = outCubic(prog(t, 3.6 + i * 0.18, 0.6))
                    const count = outCubic(prog(t, 3.6 + i * 0.18, 1.0))
                    const slot = sort2 > 0 ? lerp(SLOT_1[i], RANK[i], sort2) : lerp(i, SLOT_1[i], sort1)
                    // Profondeur pendant le tri : la ligne qui monte se soulève
                    // (échelle, ombre, léger décalage) et passe devant ; celle qui
                    // descend recule. Le croisement se lit comme un geste voulu.
                    const lift = Math.max(
                      SLOT_1[i] < i ? Math.sin(Math.PI * sort1) : 0,
                      RANK[i] < SLOT_1[i] ? Math.sin(Math.PI * sort2) : 0
                    )
                    const sink = Math.max(
                      SLOT_1[i] > i ? Math.sin(Math.PI * sort1) : 0,
                      RANK[i] > SLOT_1[i] ? Math.sin(Math.PI * sort2) : 0
                    )
                    const total = TOTALS[i]
                    const isBest = i === BEST
                    const diff = total - TOTALS[BEST]
                    const shippingLabel = offer.shipping
                      ? labels.shipping.replace('{amount}', fmt(offer.shipping, true))
                      : labels.freeShipping
                    return (
                      <div
                        key={offer.name}
                        className="absolute"
                        style={{
                          left: o.x,
                          top: o.y0,
                          width: o.w,
                          height: o.rowH,
                          zIndex: lift > 0.01 ? 3 : isBest ? 2 : 1,
                          opacity: enter * (isBest ? 1 : 1 - 0.3 * dimP),
                          transform: `translate(${(1 - enter) * 56 - 12 * lift}px, ${slot * o.step}px) scale(${1 + 0.035 * lift - 0.02 * sink})`,
                        }}
                      >
                        <div
                          className="relative flex h-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900"
                          style={{
                            boxShadow: lift > 0.01 ? `0 ${18 * lift}px ${40 * lift}px -12px rgba(24,24,27,${0.35 * lift})` : undefined,
                          }}
                        >
                          {isBest ? (
                            <div
                              className="pointer-events-none absolute -inset-px rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 shadow-[0_14px_40px_-14px_rgba(16,185,129,0.6)] dark:bg-emerald-500/10"
                              style={{ opacity: bestOpacity }}
                            />
                          ) : null}
                          <div className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${TINT[offer.tint]}`}>
                            {offer.name.charAt(0)}
                          </div>
                          <div className="relative min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">{offer.name}</p>
                            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{shippingLabel}</p>
                          </div>
                          <div className="relative flex shrink-0 flex-col items-end">
                            <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-white">
                              {fmt(total * count, total % 1 !== 0)}
                            </span>
                            {isBest ? (
                              <span
                                className="mt-0.5 origin-right rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
                                style={{ opacity: bestOpacity, transform: `scale(${badgeScale})` }}
                              >
                                {labels.bestPrice}
                              </span>
                            ) : (
                              <span
                                className="mt-0.5 text-[11px] font-semibold tabular-nums text-zinc-400"
                                style={{ opacity: diffOpacity }}
                              >
                                +{fmt(diff, diff % 1 !== 0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Économie réalisée */}
                  <div
                    className="absolute flex flex-col justify-center overflow-hidden rounded-2xl bg-emerald-600 px-5 text-white shadow-[0_20px_50px_-16px_rgba(5,150,105,0.65)]"
                    style={{
                      left: g.savings.x,
                      top: g.savings.y,
                      width: g.savings.w,
                      height: g.savings.h,
                      opacity: savOpacity,
                      transform: `translateY(${(1 - savMove) * 28}px) scale(${lerp(0.94, 1, savMove)})`,
                    }}
                  >
                    <p className="text-xs font-semibold text-emerald-100">{labels.savingsLead}</p>
                    <p className="text-3xl font-black leading-tight tracking-tight tabular-nums">
                      {fmt(SAVINGS * savCount, false)}
                    </p>
                    <p className="text-[11px] leading-snug text-emerald-100/80">{labels.savingsTail}</p>
                    <div
                      className="pointer-events-none absolute inset-y-0 w-20 -skew-x-12 bg-white/25"
                      style={{ left: lerp(-100, g.savings.w + 40, shineP), opacity: shineP > 0 && shineP < 1 ? 1 : 0 }}
                    />
                  </div>
                </div>

                {/* Scène 7 — signature de marque */}
                {brandActive ? (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
                    style={{ opacity: brandOpacity }}
                  >
                    <svg
                      viewBox="0 0 140 120"
                      className="h-24 w-auto text-[#2B3A4A] dark:text-zinc-100"
                      style={{ opacity: prog(t, 12.8, 0.1) }}
                    >
                      <path
                        d={LOGO_PATH}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={16}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pathLength={1}
                        strokeDasharray="1"
                        strokeDashoffset={1 - logoP}
                      />
                    </svg>
                    <p
                      className="mt-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-white"
                      style={{ opacity: wordP, transform: `translateY(${(1 - wordP) * 12}px)` }}
                    >
                      Lynq
                    </p>
                    <p
                      className="mt-3 bg-gradient-to-br from-zinc-950 to-zinc-500 bg-clip-text text-xl font-semibold text-transparent dark:from-white dark:to-zinc-500"
                      style={{ opacity: tagP, transform: `translateY(${(1 - tagP) * 10}px)` }}
                    >
                      {labels.tagline}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Pause : exigée pour toute animation automatique de plus de 5 s */}
          {reduced ? null : (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? labels.play : labels.pause}
              className="absolute z-20 grid h-8 w-8 place-items-center rounded-full border border-zinc-200 bg-white/85 text-zinc-700 opacity-70 shadow-sm backdrop-blur transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/85 dark:text-zinc-200 dark:focus-visible:ring-white"
              style={{ left: g.win.x + g.win.w - 42, top: g.win.y + g.win.h - 42 }}
            >
              {paused ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1.2" />
                  <rect x="14" y="5" width="4" height="14" rx="1.2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </figure>
  )
}

/** Illustration de smartphone générique (aucune marque réelle). */
function Phone({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 200" className="h-full w-auto drop-shadow-xl">
      <defs>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <radialGradient id={`${id}-glare`} cx="0.3" cy="0.12" r="0.85">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="4" y="2" width="112" height="196" rx="22" fill="#18181b" />
      <rect x="10" y="8" width="100" height="184" rx="17" fill={`url(#${id}-screen)`} />
      <rect x="10" y="8" width="100" height="184" rx="17" fill={`url(#${id}-glare)`} />
      <rect x="45" y="15" width="30" height="8" rx="4" fill="#09090b" />
      <text x="60" y="78" textAnchor="middle" fill="#ffffff" fontSize="26" fontWeight="700">
        9:41
      </text>
      <rect x="34" y="92" width="52" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.55" />
    </svg>
  )
}
