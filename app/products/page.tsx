// app/products/page.tsx
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import SortDropdown from '@/app/components/SortDropdown'
import { getTranslation } from '@/lib/i18n'

const PAGE_SIZE = 36

type ProductsPageProps = {
  searchParams: Promise<{
    page?: string
    categoryId?: string
    rootCategory?: string
    categoryPath?: string
    q?: string
    brand?: string
    brands?: string | string[]
    merchants?: string | string[]
    minPrice?: string
    maxPrice?: string
    country?: string
    lang?: string
    sort?: 'price_asc' | 'price_desc'
  }>
}

type ProductRow = {
  id: number
  title: string | null
  image_link: string | null
  price_value: number | null
  price_currency: string | null
  brand: string | null
  google_product_category_id: number | null
  merchant_id: number | null
  merchants: { name: string | null }[] | { name: string | null } | null
}

type CategoryRow = {
  id: number
  level1: string | null
  full_path: string | null
}

type MerchantRow = {
  id: number
  name: string | null
}

const ROOT_ICONS: Record<string, string> = {
  'Adulte': '🔞',
  'Alimentation, boissons et tabac': '🍎',
  'Animaux et articles pour animaux de compagnie': '🐾',
  'Appareils photo, caméras et instruments d\'optique': '📷',
  'Appareils électroniques': '📱',
  'Arts et loisirs': '🎨',
  'Articles de sport': '⚽',
  'Bagages et maroquinerie': '🧳',
  'Bébés et tout-petits': '👶',
  'Commerce et industrie': '🏭',
  'Entreprise et industrie': '🏭',
  'Équipements sportifs': '⚽',
  'Fournitures de bureau': '📎',
  'Jeux et jouets': '🎮',
  'Logiciels': '💻',
  'Maison et jardin': '🏠',
  'Meubles': '🛋️',
  'Médias': '🎬',
  'Quincaillerie': '🔧',
  'Santé et beauté': '✨',
  'Véhicules et accessoires': '🚗',
  'Vêtements et accessoires': '👕',
  'Armes': '🔫',
  'Autres': '❓'
}

function formatPrice(value: number | null, currency: string | null) {
  if (value == null) return null
  const cur = currency || 'EUR'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(value)
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams

  const page = Math.max(Number(params.page || '1') || 1, 1)
  const categoryId = params.categoryId ? Number(params.categoryId) : null
  const categoryPath = params.categoryPath ? decodeURIComponent(params.categoryPath) : null
  const rootCategory = params.rootCategory || (categoryPath ? categoryPath.split(' > ')[0] : null)
  const q = params.q?.trim() || ''

  // Multi-select handling
  const getArray = (val: string | string[] | undefined) => {
    if (!val) return []
    return Array.isArray(val) ? val : [val]
  }

  const selectedBrands = getArray(params.brands)
  const selectedMerchants = getArray(params.merchants)
  const minPrice = params.minPrice ? Number(params.minPrice) : null
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : null

  const selectedCountry = params.country === 'PL' ? 'PL' : 'FR'
  const selectedLang = params.lang || (selectedCountry === 'FR' ? 'fr' : 'en')
  const sort = params.sort || null
  const t = getTranslation(selectedLang)

  // --- Data Fetching Logic ---
  const { data: categoryIdRows } = await supabase
    .from('products')
    .select('google_product_category_id')
    .eq('country_code', selectedCountry)
    .not('google_product_category_id', 'is', null)

  const uniqueCategoryIds = Array.from(new Set((categoryIdRows || []).map((r) => r.google_product_category_id).filter((id): id is number => id !== null)))

  let categories: CategoryRow[] = []
  if (uniqueCategoryIds.length > 0) {
    const { data: cats } = await supabase
      .from('google_categories')
      .select('id, level1, full_path')
      .in('id', uniqueCategoryIds)
    categories = (cats as CategoryRow[]) || []
  }

  // To build the sidebar we just need the distinct level1 of these categories
  const rootCategories = Array.from(new Set(categories.map(c => c.level1).filter(Boolean))) as string[]
  rootCategories.sort()

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('products')
    .select('id, title, image_link, price_value, price_currency, brand, google_product_category_id, merchant_id, merchants(name)', { count: 'exact' })
    .eq('country_code', selectedCountry)

  if (categoryId) query = query.eq('google_product_category_id', categoryId)
  else if (categoryPath) {
    const { data: matchedCats } = await supabase
      .from('google_categories')
      .select('id')
      .ilike('full_path', `${categoryPath}%`)

    if (matchedCats && matchedCats.length > 0) {
      query = query.in('google_product_category_id', matchedCats.map(c => c.id))
    } else {
      query = query.eq('google_product_category_id', -1) // force no match
    }
  }
  else if (rootCategory) {
    const { data: rootCatIds } = await supabase
      .from('google_categories')
      .select('id')
      .eq('level1', rootCategory)

    if (rootCatIds && rootCatIds.length > 0) {
      query = query.in('google_product_category_id', rootCatIds.map(c => c.id))
    } else {
      query = query.eq('google_product_category_id', -1) // force no match
    }
  }

  if (q) query = query.ilike('title', `%${q}%`)
  if (selectedBrands.length > 0) query = query.in('brand', selectedBrands)
  if (minPrice != null && !Number.isNaN(minPrice)) query = query.gte('price_value', minPrice)
  if (maxPrice != null && !Number.isNaN(maxPrice)) query = query.lte('price_value', maxPrice)
  if (selectedMerchants.length > 0) query = query.in('merchant_id', selectedMerchants.map(Number).filter(n => !Number.isNaN(n)))

  const { data: products, count } = await (sort === 'price_asc'
    ? query.order('price_value', { ascending: true })
    : sort === 'price_desc'
      ? query.order('price_value', { ascending: false })
      : query.order('id', { ascending: false })
  ).range(from, to)

  const productList = (products as ProductRow[]) || []
  const total = count ?? 0
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  // Meta data for filters - Fetch unique brands CONTEXTUAL TO ACTIVE FILTERS
  let brandsQuery = supabase
    .from('products')
    .select('brand')
    .eq('country_code', selectedCountry)
    .not('brand', 'is', null)

  if (categoryId) brandsQuery = brandsQuery.eq('google_product_category_id', categoryId)
  else if (categoryPath) {
    const { data: matchedCats } = await supabase
      .from('google_categories')
      .select('id')
      .ilike('full_path', `${categoryPath}%`)

    if (matchedCats && matchedCats.length > 0) {
      brandsQuery = brandsQuery.in('google_product_category_id', matchedCats.map(c => c.id))
    }
  }
  else if (rootCategory) {
    const { data: rootCatIds } = await supabase
      .from('google_categories')
      .select('id')
      .eq('level1', rootCategory)

    if (rootCatIds && rootCatIds.length > 0) {
      brandsQuery = brandsQuery.in('google_product_category_id', rootCatIds.map(c => c.id))
    }
  }
  if (q) brandsQuery = brandsQuery.ilike('title', `%${q}%`)

  const { data: brandsData } = await brandsQuery

  // Count brand frequencies for smart sorting
  const brandCounts: Record<string, number> = {}
  if (brandsData) {
    for (const r of brandsData) {
      if (r.brand) brandCounts[r.brand] = (brandCounts[r.brand] || 0) + 1
    }
  }

  // Sort by popularity (count desc)
  let sortedBrands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a])

  // Limit to top 100 ONLY on "All Products" page (safety)
  if (!categoryId && !rootCategory && !categoryPath) {
    sortedBrands = sortedBrands.slice(0, 100)
  }

  // Final sort alphabetically for UI
  const allBrands = sortedBrands.sort()

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
    selectedBrands.forEach(b => sp.append('brands', b))
    selectedMerchants.forEach(m => sp.append('merchants', m))

    Object.entries(extra).forEach(([k, v]) => {
      if (v === null) sp.delete(k)
      else if (Array.isArray(v)) { sp.delete(k); v.forEach(item => sp.append(k, item)) }
      else sp.set(k, String(v))
    })
    return `/products?${sp.toString()}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {categoryPath ? categoryPath.split(' > ').pop() : ((t.categories as any)[rootCategory || ''] || rootCategory || q || t.products.title_all)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500" suppressHydrationWarning>
            {total.toLocaleString('fr-FR')} {t.products.found}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/products"
            className="flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900"
          >
            Réinitialiser les filtres
          </Link>
          {/* Sort Dropdown (Client Component) */}
          <SortDropdown />

          {/* Quick Search */}
          <form className="relative flex-1 sm:max-w-sm" action="/products" method="GET">
            {sort && <input type="hidden" name="sort" value={sort} />}
            {params.country && <input type="hidden" name="country" value={params.country} />}
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder={t.products.search_placeholder}
              className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 pl-10 text-sm outline-none transition-all focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Sidebar Filters */}
        {/* Mobile Filter Toggle */}
        <input type="checkbox" id="mobile-filter-toggle" className="peer hidden" />
        <label
          htmlFor="mobile-filter-toggle"
          className="md:hidden flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 font-bold text-zinc-900 shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>{t.products.filter_button || 'Filtres'}</span>
          </div>
          <svg className="h-5 w-5 transition-transform peer-checked:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </label>

        <aside className="hidden peer-checked:block md:block space-y-8 mt-4 md:mt-0">
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">{t.products.categories}</h3>
            <div className="space-y-1">
              <Link
                href={buildUrl({ rootCategory: null, categoryId: null, categoryPath: null, brands: null, merchants: null, minPrice: null, maxPrice: null, q: null })}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${!rootCategory ? 'bg-zinc-900 text-white font-medium dark:bg-white dark:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
              >
                {t.products.all_offers}
              </Link>
              {rootCategories.map(root => (
                <Link
                  key={root}
                  href={buildUrl({ rootCategory: root, categoryId: null, categoryPath: null })}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${rootCategory === root ? 'bg-zinc-900 text-white font-medium dark:bg-white dark:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                >
                  <span>{ROOT_ICONS[root] || '📂'}</span>
                  <span>{(t.categories as any)[root] || root}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800" />

          {/* Pricing */}
          <form action="/products" method="GET">
            {q && <input type="hidden" name="q" value={q} />}
            {rootCategory && <input type="hidden" name="rootCategory" value={rootCategory} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {selectedBrands.map(b => <input type="hidden" key={b} name="brands" value={b} />)}
            {selectedMerchants.map(m => <input type="hidden" key={m} name="merchants" value={m} />)}

            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">{t.products.budget}</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={minPrice || ''}
                  placeholder="Min"
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice || ''}
                  placeholder="Max"
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-100 py-2 text-xs font-bold text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {t.products.filter_button}
              </button>
            </div>
          </form>

          {/* Brands */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">{t.products.brands}</h3>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-2 scrollbar-thin">
              {allBrands.map(b => (
                <Link
                  key={b}
                  href={buildUrl({ brands: selectedBrands.includes(b) ? selectedBrands.filter(x => x !== b) : [...selectedBrands, b] })}
                  className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${selectedBrands.includes(b) ? 'bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white' : 'border-zinc-300 dark:border-zinc-700'}`}>
                    {selectedBrands.includes(b) && <svg className="h-3 w-3 text-white dark:text-zinc-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                  <span>{b}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {productList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productList.map((p) => (
                <article key={p.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all hover:shadow-2xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Link href={`/product/${p.id}?country=${selectedCountry}&lang=${selectedLang}`} className="block overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                    <div className="aspect-square p-4 transition-transform duration-500 group-hover:scale-110">
                      {p.image_link ? (
                        <img src={p.image_link} alt={p.title || ''} className="h-full w-full object-contain" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">{t.product.no_image}</div>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <span>{p.brand || t.product.brand_unknown}</span>
                      {p.merchants && (
                        <span className="text-zinc-300">
                          | {Array.isArray(p.merchants) ? p.merchants[0]?.name : (p.merchants as any).name}
                        </span>
                      )}
                    </div>
                    <Link href={`/product/${p.id}?country=${selectedCountry}&lang=${selectedLang}`} className="mb-4 line-clamp-2 text-sm font-semibold leading-relaxed text-zinc-900 transition-colors hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300">
                      {p.title}
                    </Link>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-zinc-900 dark:text-white" suppressHydrationWarning>{formatPrice(p.price_value, p.price_currency)}</span>
                      <Link href={`/product/${p.id}?country=${selectedCountry}&lang=${selectedLang}`} className="rounded-full bg-zinc-900 p-2 text-white transition-all hover:scale-110 active:scale-95 dark:bg-white dark:text-zinc-900">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
              <div className="mb-4 text-4xl">🔎</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t.products.no_results}</h3>
              <p className="mt-2 text-sm text-zinc-500">{t.products.no_results_p}</p>
              <Link href={buildUrl({ q: null, categoryId: null, rootCategory: null, brands: null, merchants: null, minPrice: null, maxPrice: null })} className="mt-6 rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
                {t.products.reset}
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-16 flex items-center justify-center gap-2">
              <Link
                href={buildUrl({ page: Math.max(page - 1, 1) })}
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all ${page === 1 ? 'pointer-events-none opacity-20' : 'hover:bg-zinc-900 hover:text-white dark:border-zinc-800'}`}
              >
                ←
              </Link>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <Link
                      key={pNum}
                      href={buildUrl({ page: pNum })}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${page === pNum ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      {pNum}
                    </Link>
                  )
                })}
              </div>
              <Link
                href={buildUrl({ page: Math.min(page + 1, totalPages) })}
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all ${page === totalPages ? 'pointer-events-none opacity-20' : 'hover:bg-zinc-900 hover:text-white dark:border-zinc-800'}`}
              >
                →
              </Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
