// app/products/page.tsx
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from '@/app/components/AppLink'
import { supabase } from '@/lib/supabaseClient'
import SortDropdown from '@/app/components/SortDropdown'
import ProductImage from '@/app/components/ProductImage'
import { getTranslation } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { getRootCategories, getCategoryIdsForFilter, getBrands } from '@/lib/facets'

const PAGE_SIZE = 36

// --- Garde-fou sur l'espace d'URL -------------------------------------------
//
// Chaque URL distincte est une entrée de cache distincte, donc un rendu complet
// (et ses requêtes Supabase) la première fois. Sans borne, un crawler peut en
// fabriquer une infinité : `?page=999999`, `?foo=1`, `?lang=zz`, 40 marques
// cochées... On refuse ces URLs AVANT toute requête en base :
//   - paramètre inconnu  -> redirection vers la même URL sans lui (les liens
//     entrants du type `?utm_source=` retombent ainsi sur la page en cache) ;
//   - valeur invalide ou hors bornes -> 404.
const ALLOWED_PARAMS = new Set([
  'page', 'categoryId', 'rootCategory', 'categoryPath', 'q', 'brands',
  'minPrice', 'maxPrice', 'country', 'lang', 'sort', 'merchant',
])
const MULTI_PARAMS = new Set(['brands'])
const MAX_PAGE = 100
const MAX_BRANDS = 5
const MAX_TEXT_LENGTH = 400
const MAX_PRICE = 1_000_000

type RawParams = Record<string, string | string[] | undefined>

function isValidProductsQuery(raw: RawParams): boolean {
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value) && !MULTI_PARAMS.has(key)) return false
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
    if (values.some(v => v.length > MAX_TEXT_LENGTH)) return false
  }

  const one = (key: string) => raw[key] as string | undefined
  const isInt = (v: string) => /^\d{1,9}$/.test(v)
  const isPrice = (v: string) =>
    v === '' || (/^\d{1,7}([.,]\d{1,2})?$/.test(v) && Number(v.replace(',', '.')) <= MAX_PRICE)

  const page = one('page')
  if (page !== undefined && !(isInt(page) && Number(page) >= 1 && Number(page) <= MAX_PAGE)) return false

  const categoryId = one('categoryId')
  if (categoryId !== undefined && !isInt(categoryId)) return false

  const merchant = one('merchant')
  if (merchant !== undefined && !isInt(merchant)) return false

  const country = one('country')
  if (country !== undefined && !/^[A-Za-z]{2}$/.test(country)) return false

  const lang = one('lang')
  if (lang !== undefined && lang !== 'fr' && lang !== 'en') return false

  const sort = one('sort')
  if (sort !== undefined && sort !== '' && sort !== 'price_asc' && sort !== 'price_desc') return false

  for (const key of ['minPrice', 'maxPrice']) {
    const price = one(key)
    if (price !== undefined && !isPrice(price)) return false
  }

  const brands = raw.brands === undefined ? [] : Array.isArray(raw.brands) ? raw.brands : [raw.brands]
  if (brands.length > MAX_BRANDS || new Set(brands).size !== brands.length) return false

  return true
}

function guardProductsQuery(raw: RawParams) {
  const unknown = Object.keys(raw).filter(key => !ALLOWED_PARAMS.has(key))
  if (unknown.length > 0) {
    const sp = new URLSearchParams()
    for (const [key, value] of Object.entries(raw)) {
      if (!ALLOWED_PARAMS.has(key) || value === undefined) continue
      for (const v of Array.isArray(value) ? value : [value]) sp.append(key, v)
    }
    const qs = sp.toString()
    redirect(qs ? `/products?${qs}` : '/products')
  }
  if (!isValidProductsQuery(raw)) notFound()
}

// Toutes les combinaisons de filtres (marque × catégorie × page × recherche)
// pointent vers la même URL canonique : l'espace d'URL que les crawlers
// peuvent indexer se réduit à une seule page, au lieu d'une combinatoire.
export const metadata: Metadata = {
  alternates: { canonical: '/products' },
}

type ProductsPageProps = {
  searchParams: Promise<{
    page?: string
    categoryId?: string
    rootCategory?: string
    categoryPath?: string
    q?: string
    brand?: string
    brands?: string | string[]
    minPrice?: string
    maxPrice?: string
    country?: string
    lang?: string
    sort?: 'price_asc' | 'price_desc'
    merchant?: string
  }>
}

// 1 ligne = 1 GROUPE de produit (vue matérialisée product_groups).
type GroupRow = {
  group_key: string
  route_key: string
  gtin: string | null
  title: string | null
  image_link: string | null
  brand: string | null
  price_currency: string | null
  google_product_category_id: number | null
  min_price: number | null
  merchant_count: number | null
}

// Rayons : pictogramme au trait (viewBox 24) et libellé anglais.
const GENERIC_ICON = 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z'
const ROOTS: Record<string, { icon: string; en: string }> = {
  'Adulte': { icon: GENERIC_ICON, en: 'Adult' },
  'Alimentation, boissons et tabac': { icon: 'M6 8h10v5a5 5 0 01-10 0zm10 1h2a2 2 0 010 4h-2M5 20h12', en: 'Food, beverages & tobacco' },
  'Animaux et articles pour animaux de compagnie': { icon: GENERIC_ICON, en: 'Animals & pet supplies' },
  "Appareils photo, caméras et instruments d'optique": { icon: 'M4 8h3l1.5-2h7L17 8h3v11H4zm8 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z', en: 'Cameras & optics' },
  'Appareils électroniques': { icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2zm3 5h4v4h-4z', en: 'Electronics' },
  'Arts et loisirs': { icon: 'M4 20c0-2 1-3 2.5-3S9 18 9 19.5 7.5 21 4 20zM9 16l9.5-9.5a1.8 1.8 0 012.5 2.5L11.5 18.5', en: 'Arts & entertainment' },
  'Bagages et maroquinerie': { icon: 'M4 8h16v11H4zm5 0V6a2 2 0 012-2h2a2 2 0 012 2v2M4 13h16', en: 'Luggage & bags' },
  'Bébés et tout-petits': { icon: GENERIC_ICON, en: 'Baby & toddler' },
  'Entreprise et industrie': { icon: GENERIC_ICON, en: 'Business & industrial' },
  'Fournitures de bureau': { icon: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3', en: 'Office supplies' },
  'Jeux et jouets': { icon: 'M7 8h10a4 4 0 014 4v2a3 3 0 01-5.2 2L14.5 15h-5l-1.3 1A3 3 0 013 14v-2a4 4 0 014-4zm1 3v3m-1.5-1.5h3', en: 'Toys & games' },
  'Logiciels': { icon: 'M8 8l-4 4 4 4m8-8l4 4-4 4M13.5 6l-3 12', en: 'Software' },
  'Maison et jardin': { icon: 'M3 11.5L12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5', en: 'Home & garden' },
  'Meubles': { icon: 'M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3M3 13a2 2 0 014 0v2h10v-2a2 2 0 014 0v4H3zm3 4v2m12-2v2', en: 'Furniture' },
  'Médias': { icon: 'M5 4.5h10a3 3 0 013 3V20H8a3 3 0 01-3-3zm0 12.5a3 3 0 013-3h10', en: 'Media' },
  'Offices religieux et cérémonies': { icon: GENERIC_ICON, en: 'Religious & ceremonial' },
  'Quincaillerie': { icon: 'M15 5a4 4 0 00-5.3 5.3L4 16l4 4 5.7-5.7A4 4 0 0019 9l-2.5 2.5-2-2L17 7a4 4 0 00-2-2z', en: 'Hardware' },
  'Santé et beauté': { icon: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z', en: 'Health & beauty' },
  'Véhicules et accessoires': { icon: 'M5 12l1.5-4.5A2 2 0 018.4 6h7.2a2 2 0 011.9 1.5L19 12m-14 0h14a1 1 0 011 1v4H4v-4a1 1 0 011-1zm1 5v1.5M18 17v1.5', en: 'Vehicles & parts' },
  'Vêtements et accessoires': { icon: 'M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3a3 3 0 01-6 0z', en: 'Apparel & accessories' },
  'Équipements sportifs': { icon: 'M6.5 6.5v11M3.5 9v6m14-8.5v11m3-8.5v6M6.5 12h11', en: 'Sporting goods' },
}

const COPY = {
  fr: {
    eyebrow: 'Catalogue', filters: 'Filtres', clearAll: 'Tout effacer', apply: 'Appliquer', price: 'Prix',
    search: 'Recherche', previous: 'Page précédente', next: 'Page suivante', page: 'Page',
    min: 'Min', max: 'Max', remove: 'Retirer le filtre', product: 'produit trouvé', products: 'produits trouvés',
  },
  en: {
    eyebrow: 'Catalogue', filters: 'Filters', clearAll: 'Clear all', apply: 'Apply', price: 'Price',
    search: 'Search', previous: 'Previous page', next: 'Next page', page: 'Page',
    min: 'Min', max: 'Max', remove: 'Remove filter', product: 'product found', products: 'products found',
  },
}

function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg className={className ?? 'h-[18px] w-[18px]'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

/** Numéros de page à afficher : première, dernière et voisines de la page courante. */
function pageWindow(current: number, total: number): (number | 'gap')[] {
  const wanted = new Set([1, total, current - 1, current, current + 1])
  const pages = Array.from(wanted).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('gap')
    out.push(p)
  })
  return out
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  guardProductsQuery(params as RawParams)

  const page = Math.max(Number(params.page || '1') || 1, 1)
  const categoryId = params.categoryId ? Number(params.categoryId) : null
  const categoryPath = params.categoryPath ? decodeURIComponent(params.categoryPath) : null
  const rootCategory = params.rootCategory || (categoryPath ? categoryPath.split(' > ')[0] : null)
  const q = params.q?.trim() || ''
  const merchantId = params.merchant ? Number(params.merchant) : null

  // Multi-select handling
  const getArray = (val: string | string[] | undefined) => {
    if (!val) return []
    return Array.isArray(val) ? val : [val]
  }

  const selectedBrands = getArray(params.brands)
  const minPrice = params.minPrice ? Number(params.minPrice.replace(',', '.')) : null
  const maxPrice = params.maxPrice ? Number(params.maxPrice.replace(',', '.')) : null

  // Pays = filtre de pays (défaut FR). Pass-through pour supporter d'autres
  // pays (et un pays de test isolé) sans casser FR/PL.
  const selectedCountry = (params.country || 'FR').toUpperCase()
  const selectedLang = params.lang || (selectedCountry === 'FR' ? 'fr' : 'en')
  const isFr = selectedLang !== 'en'
  const sort = params.sort || null
  const t = getTranslation(selectedLang)
  const c = COPY[isFr ? 'fr' : 'en']
  const locale = isFr ? 'fr-FR' : 'en-IE'
  const rootLabel = (root: string) => (isFr ? root : ROOTS[root]?.en ?? root)

  // Facettes mises en cache (cf. lib/facets.ts) : elles ne dépendent que du
  // catalogue synchronisé (1x/jour), jamais du visiteur. Les recalculer à
  // chaque rendu parcourait toute la vue à chaque requête — l'un des facteurs
  // du dépassement des quotas.
  const rootCategories = await getRootCategories(selectedCountry)
  const categoryIds = await getCategoryIdsForFilter(categoryId, categoryPath, rootCategory)
  // Marques disponibles pour les filtres actifs (facette cachée, cf. lib/facets.ts)
  const allBrands = await getBrands(selectedCountry, categoryIds, q)

  // Une marque cochée couvre toutes ses écritures (« Nike » et « NIKE »).
  const brandValues = selectedBrands.flatMap((name) => {
    const facet = allBrands.find((b) => b.name === name || b.variants.includes(name))
    return facet ? facet.variants : [name]
  })

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let groupList: GroupRow[] = []
  let total = 0
  let merchantName: string | null = null

  if (merchantId) {
    // Offres d'UN marchand : la vue groupée ne sait pas à quel marchand
    // appartient un groupe, on lit donc directement ses offres.
    const { data: merchant } = await supabase.from('merchants').select('name').eq('id', merchantId).maybeSingle()
    if (!merchant) notFound()
    merchantName = merchant.name

    let offers = supabase
      .from('products')
      .select('id, gtin, title, image_link, brand, price_currency, google_product_category_id, price_value, shipping_price', { count: 'exact' })
      .eq('merchant_id', merchantId)
      .eq('country_code', selectedCountry)

    if (categoryIds !== null) {
      offers = categoryIds.length > 0
        ? offers.in('google_product_category_id', categoryIds)
        : offers.eq('google_product_category_id', -1) // force no match
    }
    if (q) offers = offers.ilike('title', `%${q}%`)
    if (brandValues.length > 0) offers = offers.in('brand', brandValues)
    if (minPrice != null && !Number.isNaN(minPrice)) offers = offers.gte('price_value', minPrice)
    if (maxPrice != null && !Number.isNaN(maxPrice)) offers = offers.lte('price_value', maxPrice)

    const { data, count } = await (sort === 'price_asc'
      ? offers.order('price_value', { ascending: true })
      : sort === 'price_desc'
        ? offers.order('price_value', { ascending: false })
        : offers.order('id', { ascending: false })
    ).range(from, to)

    groupList = (data || []).map((offer) => ({
      group_key: `offer:${offer.id}`,
      route_key: offer.gtin ? offer.gtin : `id-${offer.id}`,
      gtin: offer.gtin,
      title: offer.title,
      image_link: offer.image_link,
      brand: offer.brand,
      price_currency: offer.price_currency,
      google_product_category_id: offer.google_product_category_id,
      min_price: offer.price_value == null ? null : Number(offer.price_value) + Number(offer.shipping_price ?? 0),
      merchant_count: 1,
    }))
    total = count ?? 0
  } else {
    let query = supabase
      .from('product_groups')
      .select('group_key, route_key, gtin, title, image_link, brand, price_currency, google_product_category_id, min_price, merchant_count', { count: 'exact' })
      .eq('country_code', selectedCountry)

    if (categoryIds !== null) {
      query = categoryIds.length > 0
        ? query.in('google_product_category_id', categoryIds)
        : query.eq('google_product_category_id', -1) // force no match
    }

    if (q) query = query.ilike('title', `%${q}%`)
    if (brandValues.length > 0) query = query.in('brand', brandValues)
    if (minPrice != null && !Number.isNaN(minPrice)) query = query.gte('min_price', minPrice)
    if (maxPrice != null && !Number.isNaN(maxPrice)) query = query.lte('min_price', maxPrice)

    const { data: groups, count } = await (sort === 'price_asc'
      ? query.order('min_price', { ascending: true })
      : sort === 'price_desc'
        ? query.order('min_price', { ascending: false })
        : // Ordre par défaut : les produits proposés par le plus de marchands.
          // À égalité, ceux dont le catalogue vient d'être synchronisé passent
          // devant : provisoire, pour faire descendre les fiches de démonstration
          // (images souvent mortes) tant qu'elles existent.
          query
            .order('merchant_count', { ascending: false })
            .order('is_fresh', { ascending: false })
            .order('group_key', { ascending: false })
    ).range(from, to)

    groupList = (groups as GroupRow[]) || []
    total = count ?? 0
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  const buildUrl = (extra: Record<string, string | number | null | string[]>) => {
    const sp = new URLSearchParams()
    sp.set('country', selectedCountry)
    sp.set('lang', selectedLang)
    if (q) sp.set('q', q)
    if (categoryId) sp.set('categoryId', String(categoryId))
    if (rootCategory) sp.set('rootCategory', rootCategory)
    if (categoryPath) sp.set('categoryPath', encodeURIComponent(categoryPath))
    if (minPrice) sp.set('minPrice', String(minPrice))
    if (maxPrice) sp.set('maxPrice', String(maxPrice))
    if (sort) sp.set('sort', sort)
    if (merchantId) sp.set('merchant', String(merchantId))
    selectedBrands.forEach(b => sp.append('brands', b))

    Object.entries(extra).forEach(([k, v]) => {
      if (v === null) sp.delete(k)
      else if (Array.isArray(v)) { sp.delete(k); v.forEach(item => sp.append(k, item)) }
      else sp.set(k, String(v))
    })
    return `/products?${sp.toString()}`
  }

  const resetUrl = buildUrl({ q: null, categoryId: null, rootCategory: null, categoryPath: null, brands: null, minPrice: null, maxPrice: null, sort: null, merchant: null, page: null })
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

  // Filtres actifs, affichés en pastilles que l'on retire d'un clic.
  const chips: { label: string; href: string }[] = []
  if (merchantName) chips.push({ label: merchantName, href: buildUrl({ merchant: null, page: null }) })
  if (q) chips.push({ label: `${c.search} : ${q}`, href: buildUrl({ q: null, page: null }) })
  if (rootCategory) chips.push({ label: rootLabel(rootCategory), href: buildUrl({ rootCategory: null, categoryId: null, categoryPath: null, page: null }) })
  for (const brand of selectedBrands) chips.push({ label: brand, href: buildUrl({ brands: selectedBrands.filter((b) => b !== brand), page: null }) })
  if (minPrice || maxPrice) {
    const range = minPrice && maxPrice ? `${money(minPrice)} – ${money(maxPrice)}` : minPrice ? `≥ ${money(minPrice)}` : `≤ ${money(maxPrice as number)}`
    chips.push({ label: `${c.price} : ${range}`, href: buildUrl({ minPrice: null, maxPrice: null, page: null }) })
  }

  const title = merchantName ?? (categoryPath ? categoryPath.split(' > ').pop() : rootCategory ? rootLabel(rootCategory) : q || t.products.title_all)
  const sectionTitle = 'text-xs font-bold uppercase tracking-[0.16em] text-zinc-400'

  return (
    <div className="bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-[#0FA968]" />
              {c.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-zinc-500" suppressHydrationWarning>
              {total.toLocaleString(locale)} {total > 1 ? c.products : c.product}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form className="relative sm:w-72" action="/products" method="GET">
              <input type="hidden" name="country" value={selectedCountry} />
              <input type="hidden" name="lang" value={selectedLang} />
              {rootCategory && <input type="hidden" name="rootCategory" value={rootCategory} />}
              {merchantId && <input type="hidden" name="merchant" value={merchantId} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={t.products.search_placeholder}
                aria-label={t.products.search_placeholder}
                className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-[#0FA968] focus:ring-4 focus:ring-[#0FA968]/15 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </form>
            <SortDropdown />
          </div>
        </div>

        {/* Filtres actifs */}
        {chips.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.label}
                rel="nofollow"
                href={chip.href}
                aria-label={`${c.remove} : ${chip.label}`}
                className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pl-3.5 pr-2.5 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-white"
              >
                {chip.label}
                <svg className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-zinc-900 dark:group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Link>
            ))}
            <Link rel="nofollow" href={resetUrl} className="ml-1 text-sm font-semibold text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:hover:text-white">
              {c.clearAll}
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[250px_1fr]">
          {/* Filtres : repliés sur mobile (case à cocher + peer), toujours visibles sur ordinateur */}
          <div>
            <input type="checkbox" id="filters-toggle" className="peer hidden" />
            <label
              htmlFor="filters-toggle"
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white lg:hidden"
            >
              <span className="flex items-center gap-2.5">
                <Icon path="M4 6h16M7 12h10M10 18h4" />
                {c.filters}
              </span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </label>

            <aside className="mt-6 hidden space-y-10 peer-checked:block lg:mt-0 lg:block">
              {/* Rayons */}
              <div>
                <h2 className={sectionTitle}>{t.products.categories}</h2>
                <div className="mt-4 space-y-0.5">
                  <Link
                    rel="nofollow"
                    href={buildUrl({ rootCategory: null, categoryId: null, categoryPath: null, page: null })}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${!rootCategory ? 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'}`}
                  >
                    <Icon path={GENERIC_ICON} className={`h-[18px] w-[18px] shrink-0 ${!rootCategory ? 'text-[#0FA968]' : ''}`} />
                    {t.products.all_offers}
                  </Link>
                  {rootCategories.map((root) => {
                    const active = rootCategory === root
                    return (
                      <Link
                        key={root}
                        rel="nofollow"
                        href={buildUrl({ rootCategory: root, categoryId: null, categoryPath: null, page: null })}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${active ? 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'}`}
                      >
                        <Icon path={ROOTS[root]?.icon ?? GENERIC_ICON} className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#0FA968]' : ''}`} />
                        <span className="leading-snug">{rootLabel(root)}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Budget */}
              <form action="/products" method="GET">
                <input type="hidden" name="country" value={selectedCountry} />
                <input type="hidden" name="lang" value={selectedLang} />
                {q && <input type="hidden" name="q" value={q} />}
                {rootCategory && <input type="hidden" name="rootCategory" value={rootCategory} />}
                {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
                {merchantId && <input type="hidden" name="merchant" value={merchantId} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
                {selectedBrands.map(b => <input type="hidden" key={b} name="brands" value={b} />)}

                <h2 className={sectionTitle}>{t.products.budget}</h2>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    name="minPrice"
                    defaultValue={minPrice || ''}
                    placeholder={c.min}
                    aria-label={`${t.products.budget} ${c.min}`}
                    className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[#0FA968] focus:ring-4 focus:ring-[#0FA968]/15 dark:border-zinc-800 dark:bg-zinc-900"
                  />
                  <span className="text-zinc-300">–</span>
                  <input
                    type="number"
                    min={0}
                    name="maxPrice"
                    defaultValue={maxPrice || ''}
                    placeholder={c.max}
                    aria-label={`${t.products.budget} ${c.max}`}
                    className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[#0FA968] focus:ring-4 focus:ring-[#0FA968]/15 dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-3 w-full rounded-full border border-zinc-200 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:border-zinc-900 dark:border-zinc-800 dark:text-white dark:hover:border-white"
                >
                  {c.apply}
                </button>
              </form>

              {/* Marques */}
              {allBrands.length > 0 && !merchantId ? (
                <div>
                  <h2 className={sectionTitle}>{t.products.brands}</h2>
                  <div className="mt-4 max-h-72 space-y-0.5 overflow-y-auto pr-1">
                    {allBrands.map((brand) => {
                      const checked = selectedBrands.some((name) => name === brand.name || brand.variants.includes(name))
                      const next = checked
                        ? selectedBrands.filter((name) => name !== brand.name && !brand.variants.includes(name))
                        : [...selectedBrands, brand.name]
                      return (
                        <Link
                          key={brand.name}
                          rel="nofollow"
                          href={buildUrl({ brands: next, page: null })}
                          role="checkbox"
                          aria-checked={checked}
                          className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                        >
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${checked ? 'border-[#0FA968] bg-[#0FA968]' : 'border-zinc-300 dark:border-zinc-700'}`}>
                            {checked ? (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : null}
                          </span>
                          <span className={`min-w-0 flex-1 truncate ${checked ? 'font-semibold text-zinc-900 dark:text-white' : ''}`}>{brand.name}</span>
                          <span className="text-xs tabular-nums text-zinc-400">{brand.count}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>

          {/* Produits */}
          <div className="min-w-0">
            {groupList.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {groupList.map((g) => {
                  const href = `/product/${encodeURIComponent(g.route_key)}?country=${selectedCountry}&lang=${selectedLang}`
                  const multi = (g.merchant_count ?? 0) >= 2
                  return (
                    <article key={g.group_key} className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-1 hover:border-[#0FA968] hover:shadow-[0_24px_50px_-28px_rgba(24,24,27,0.3)] dark:border-zinc-800 dark:bg-zinc-900">
                      {multi ? (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#0FA968] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          {g.merchant_count} {t.products.merchants_label}
                        </span>
                      ) : null}
                      <Link prefetch={false} href={href} className="block bg-zinc-50 dark:bg-zinc-800/60" tabIndex={-1} aria-hidden="true">
                        <div className="aspect-square p-5">
                          <ProductImage
                            src={g.image_link}
                            alt={g.title || ''}
                            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 dark:mix-blend-normal"
                          />
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                          {g.brand || t.product.brand_unknown}
                        </p>
                        <Link prefetch={false} href={href} className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 after:absolute after:inset-0 dark:text-white">
                          {g.title}
                        </Link>
                        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                          <div>
                            {multi ? (
                              <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t.products.from_label}</span>
                            ) : null}
                            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white" suppressHydrationWarning>
                              {formatPrice(g.min_price, g.price_currency)}
                            </span>
                          </div>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-colors group-hover:bg-[#0FA968] group-hover:text-white dark:bg-zinc-800 dark:text-white">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
                <h2 className="mt-5 text-lg font-bold text-zinc-900 dark:text-white">{t.products.no_results}</h2>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">{t.products.no_results_p}</p>
                <Link prefetch={false} rel="nofollow" href={resetUrl} className="mt-6 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
                  {t.products.reset}
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 ? (
              <nav className="mt-14 flex items-center justify-center gap-1.5" aria-label="Pagination">
                <Link
                  rel="nofollow"
                  href={buildUrl({ page: Math.max(page - 1, 1) })}
                  aria-label={c.previous}
                  aria-disabled={page === 1}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition-colors dark:border-zinc-800 dark:text-zinc-300 ${page === 1 ? 'pointer-events-none opacity-30' : 'hover:border-zinc-900 dark:hover:border-white'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
                  </svg>
                </Link>
                {pageWindow(page, totalPages).map((item, index) =>
                  item === 'gap' ? (
                    <span key={`gap-${index}`} className="px-1 text-zinc-400">…</span>
                  ) : (
                    <Link
                      key={item}
                      rel="nofollow"
                      href={buildUrl({ page: item })}
                      aria-label={`${c.page} ${item}`}
                      aria-current={page === item ? 'page' : undefined}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums transition-colors ${page === item ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}
                    >
                      {item}
                    </Link>
                  )
                )}
                <Link
                  rel="nofollow"
                  href={buildUrl({ page: Math.min(page + 1, totalPages) })}
                  aria-label={c.next}
                  aria-disabled={page === totalPages}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition-colors dark:border-zinc-800 dark:text-zinc-300 ${page === totalPages ? 'pointer-events-none opacity-30' : 'hover:border-zinc-900 dark:hover:border-white'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
