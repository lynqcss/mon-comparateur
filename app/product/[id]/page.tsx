// app/product/[id]/page.tsx
// La clé d'URL ([id]) est soit un GTIN (fiche comparaison multi-marchands),
// soit 'id-<id>' (singleton sans GTIN). Un ancien id numérique est redirigé
// (308) vers la fiche canonique correspondante.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ExpandableDescription from '@/app/components/ExpandableDescription'
import { getTranslation } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

type ProductPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    country?: string
    lang?: string
  }>
}

type OfferRow = {
  id: number
  merchant_id: number
  offer_id: string | null
  title: string | null
  description: string | null
  link: string | null
  image_link: string | null
  price_value: number | null
  price_currency: string | null
  sale_price: number | null
  availability: string | null
  brand: string | null
  gtin: string | null
  google_product_category_id: number | null
  google_product_category_path: string | null
  country_code: string | null
  shipping_price: number | null
  merchants: { name: string | null; website_url: string | null }[] | { name: string | null; website_url: string | null } | null
}

const OFFER_SELECT =
  'id, merchant_id, offer_id, title, description, link, image_link, price_value, price_currency, sale_price, availability, brand, gtin, google_product_category_id, google_product_category_path, country_code, shipping_price, merchants(name, website_url)'

function merchantOf(o: OfferRow) {
  return Array.isArray(o.merchants) ? o.merchants[0] : o.merchants
}

function isInStock(availability: string | null): boolean {
  return String(availability || '').toLowerCase().replace(/[_\s]/g, '') === 'instock'
}

function NotFound({ title, message, cta }: { title: string; message?: string; cta: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      {message && <p className="mt-2 text-zinc-500">{message}</p>}
      <Link href="/products" className="mt-4 inline-block text-zinc-600 underline">{cta}</Link>
    </div>
  )
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id: key } = await params
  const { country, lang } = await searchParams

  const selectedCountry = (country || 'FR').toUpperCase()
  const selectedLang = lang || (selectedCountry === 'FR' ? 'fr' : 'en')
  const t = getTranslation(selectedLang)
  const qs = `country=${selectedCountry}&lang=${selectedLang}`

  // --- Résolution de la clé -> liste d'offres ---
  let offers: OfferRow[] = []

  const singletonMatch = /^id-(\d+)$/.exec(key)

  if (singletonMatch) {
    // Singleton explicite : une offre unique par id produit.
    const pid = Number(singletonMatch[1])
    const { data } = await supabase
      .from('products')
      .select(OFFER_SELECT)
      .eq('id', pid)
      .maybeSingle<OfferRow>()

    if (!data) {
      return <NotFound title={(t.product as any).not_found_title || 'Produit non trouvé'} cta={(t.product as any).back || 'Retour aux produits'} />
    }
    // Si ce produit a en fait un GTIN, on redirige vers la fiche canonique.
    if (data.gtin && data.gtin.trim() !== '') {
      redirect(`/product/${encodeURIComponent(data.gtin)}?${qs}`)
    }
    offers = [data]
  } else {
    // Tentative : GTIN pour le pays sélectionné.
    const { data: groupOffers } = await supabase
      .from('products')
      .select(OFFER_SELECT)
      .eq('gtin', key)
      .eq('country_code', selectedCountry)

    if (groupOffers && groupOffers.length > 0) {
      offers = groupOffers as OfferRow[]
    } else {
      // Le GTIN existe-t-il dans un autre pays ? -> "pas dans votre région".
      const { data: otherCountry } = await supabase
        .from('products')
        .select('id')
        .eq('gtin', key)
        .limit(1)

      if (otherCountry && otherCountry.length > 0) {
        return (
          <NotFound
            title={(t.product as any).not_found_region_title || 'Produit non trouvé'}
            message={(t.product as any).not_found_region || "Désolé, nous ne trouvons pas ce produit dans votre région."}
            cta={(t.product as any).back || 'Retour aux produits'}
          />
        )
      }

      // Ancien id numérique -> redirection 308 vers la fiche canonique.
      if (/^\d+$/.test(key)) {
        const { data: legacy } = await supabase
          .from('products')
          .select('id, gtin')
          .eq('id', Number(key))
          .maybeSingle<{ id: number; gtin: string | null }>()

        if (legacy) {
          const canonical = legacy.gtin && legacy.gtin.trim() !== ''
            ? encodeURIComponent(legacy.gtin)
            : `id-${legacy.id}`
          redirect(`/product/${canonical}?${qs}`)
        }
      }

      return <NotFound title={(t.product as any).not_found_title || 'Produit non trouvé'} cta={(t.product as any).back || 'Retour aux produits'} />
    }
  }

  // --- Construction des offres comparées ---
  const withTotal = offers.map((o) => ({
    offer: o,
    total: (o.price_value ?? 0) + (o.shipping_price ?? 0),
    domain: merchantOf(o)?.website_url || `merchant-${o.merchant_id}`,
  }))

  // Une offre par domaine marchand : garder la moins chère (prix total).
  withTotal.sort((a, b) => a.total - b.total)
  const byDomain = new Map<string, typeof withTotal[number]>()
  for (const item of withTotal) {
    if (!byDomain.has(item.domain)) byDomain.set(item.domain, item)
  }
  const dedup = Array.from(byDomain.values()).sort((a, b) => a.total - b.total)

  const distinctMerchants = byDomain.size
  const isComparison = distinctMerchants >= 2
  const best = dedup[0]
  const product = best.offer // offre représentative (moins chère)

  // --- Catégorie (fil d'ariane) ---
  let categoryPath: string | null = null
  if (product.google_product_category_id) {
    const { data: cat } = await supabase
      .from('google_categories')
      .select('full_path')
      .eq('id', product.google_product_category_id)
      .single()
    categoryPath = cat?.full_path ?? null
  }
  const categoryLabel = categoryPath || product.google_product_category_path || t.product.google_category

  // --- Produits similaires (groupes de la même catégorie) ---
  const currentRouteKey = product.gtin && product.gtin.trim() !== '' ? product.gtin : `id-${product.id}`
  let similarProducts: {
    route_key: string
    title: string | null
    image_link: string | null
    min_price: number | null
    price_currency: string | null
  }[] = []
  if (product.google_product_category_id) {
    const { data: similars } = await supabase
      .from('product_groups')
      .select('route_key, title, image_link, min_price, price_currency')
      .eq('country_code', selectedCountry)
      .eq('google_product_category_id', product.google_product_category_id)
      .neq('route_key', currentRouteKey)
      .order('min_price', { ascending: true })
      .limit(4)
    similarProducts = (similars as typeof similarProducts) || []
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-50 pb-4 dark:border-zinc-800">
        <Link href={`/?${qs}`} className="hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap">{t.product.home}</Link>
        <span className="opacity-30">/</span>
        <Link href={`/products?${qs}`} className="hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap">{t.product.products}</Link>
        <span className="opacity-30">/</span>
        {categoryPath && (
          <>
            {categoryPath.split(' > ').map((part, i, arr) => {
              const cumulativePath = arr.slice(0, i + 1).join(' > ')
              return (
                <span key={i} className="flex items-center gap-2">
                  <Link
                    href={`/products?${qs}&categoryPath=${encodeURIComponent(cumulativePath)}`}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    {part}
                  </Link>
                  <span className="opacity-30">/</span>
                </span>
              )
            })}
          </>
        )}
        <span className="text-zinc-900 dark:text-white truncate max-w-[300px]" title={product.title || ''}>{product.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* Product Image Section */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm">
          {isComparison && (
            <div className="absolute top-4 right-4 z-10">
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow">
                {(t.product as any).compare_offers?.replace('{n}', String(distinctMerchants)) || `Comparez ${distinctMerchants} offres`}
              </span>
            </div>
          )}
          <div className="absolute top-4 left-4 z-10">
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isInStock(product.availability) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {isInStock(product.availability) ? t.product.in_stock : t.product.out_of_stock}
            </span>
          </div>

          <div className="flex h-full w-full items-center justify-center p-8">
            {product.image_link ? (
              <img src={product.image_link} alt={product.title || ''} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
            ) : (
              <div className="text-zinc-300">{t.product.no_image}</div>
            )}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="flex flex-col">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
            <span>{product.brand || t.product.brand_unknown}</span>
          </div>

          <h1 className="mb-4 text-lg font-bold tracking-tight text-zinc-900 sm:text-xl lg:text-2xl dark:text-white leading-tight">
            {product.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            {isComparison && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                {(t.product as any).from_label || 'à partir de'}
              </span>
            )}
            <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
              {formatPrice(best.total, product.price_currency)}
            </span>
          </div>

          {/* --- Section OFFRES (comparaison) --- */}
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
              {isComparison
                ? ((t.product as any).offers_title?.replace('{n}', String(distinctMerchants)) || `${distinctMerchants} offres`)
                : ((t.product as any).offer_title || 'Offre')}
            </h3>
            <div className="space-y-3">
              {dedup.map(({ offer, total }, idx) => {
                const m = merchantOf(offer)
                return (
                  <div
                    key={offer.id}
                    className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${idx === 0 ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-zinc-100 dark:border-zinc-800'}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-zinc-900 dark:text-white">{m?.name || t.product.brand_unknown}</span>
                        {idx === 0 && isComparison && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                            {(t.product as any).best_price || 'Meilleur prix'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                        <span>
                          {t.product.shipping} : {offer.shipping_price != null ? formatPrice(offer.shipping_price, offer.price_currency) : t.product.shipping_confirm}
                        </span>
                        <span className={isInStock(offer.availability) ? 'text-emerald-600' : 'text-red-500'}>
                          {isInStock(offer.availability) ? t.product.in_stock : t.product.out_of_stock}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-lg font-black text-zinc-900 dark:text-white" suppressHydrationWarning>{formatPrice(total, offer.price_currency)}</div>
                        <div className="text-[10px] text-zinc-400" suppressHydrationWarning>
                          {formatPrice(offer.price_value, offer.price_currency)} + {t.product.shipping.toLowerCase()}
                        </div>
                      </div>
                      {offer.link ? (
                        <a
                          href={offer.link}
                          target="_blank"
                          rel="noreferrer"
                          className="whitespace-nowrap rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900"
                        >
                          {t.product.view_merchant}
                        </a>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Lien indisponible</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mb-8 h-[1px] bg-zinc-100 dark:bg-zinc-800" />

          <div className="mb-8 space-y-8">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">{t.product.description}</h3>
              <ExpandableDescription
                text={product.description || t.product.no_description}
                lang={selectedLang}
              />
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">{t.product.specifications}</h3>
              <dl className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800 bg-zinc-50/30">
                  <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t.product.google_category}</dt>
                  <dd className="font-bold text-zinc-900 dark:text-white text-xs truncate">{categoryLabel}</dd>
                </div>
              </dl>
            </div>
          </div>

          <p className="mt-2 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {t.product.redirect_notice}
          </p>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="mt-24 pt-12 border-t border-zinc-100 dark:border-zinc-800">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase tracking-widest">{t.product.similar}</h2>
            <Link href={`/products?${qs}`} className="text-xs font-black text-zinc-400 hover:text-zinc-900 transition-colors">{t.product.view_all_similar}</Link>
          </div>
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((sp) => (
              <Link key={sp.route_key} href={`/product/${encodeURIComponent(sp.route_key)}?${qs}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="aspect-square p-4 bg-zinc-50/50">
                  {sp.image_link ? (
                    <img src={sp.image_link} alt={sp.title || ''} className="h-full w-full object-contain transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded bg-zinc-50 text-[10px] text-zinc-300">{t.product.no_image}</div>
                  )}
                </div>
                <div className="p-4 pt-4">
                  <h4 className="mb-2 line-clamp-1 text-sm font-bold text-zinc-900 dark:text-white group-hover:underline">{sp.title}</h4>
                  <span className="text-sm font-black text-zinc-900 dark:text-white">{formatPrice(sp.min_price, sp.price_currency)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
