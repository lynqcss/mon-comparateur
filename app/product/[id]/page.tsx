// app/product/[id]/page.tsx
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ExpandableDescription from '@/app/components/ExpandableDescription'
import { getTranslation } from '@/lib/i18n'

type ProductPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    country?: string
    lang?: string
  }>
}

type ProductRow = {
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
  sale_price_effective_date: string | null
  availability: string | null
  brand: string | null
  google_product_category_id: number | null
  google_product_category_path: string | null
  country_code: string | null
  shipping_price: number | null
  merchants: { name: string | null }[] | { name: string | null } | null
}

const formatPrice = (value: number | null, currency: string | null) => {
  if (value == null) return null
  const cur = currency || 'EUR'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(value)
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params
  const { country, lang } = await searchParams
  const productId = Number(id)

  const selectedCountry = country === 'PL' ? 'PL' : 'FR'
  const selectedLang = lang || (selectedCountry === 'FR' ? 'fr' : 'en')
  const t = getTranslation(selectedLang)

  if (Number.isNaN(productId)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Produit Invalide</h1>
        <Link href="/products" className="mt-4 inline-block text-zinc-600 underline">Retour aux produits</Link>
      </div>
    )
  }

  const { data: product } = await supabase
    .from('products')
    .select('*, merchants(name)')
    .eq('id', productId)
    .eq('country_code', selectedCountry)
    .single<ProductRow>()

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Produit Non Trouvé</h1>
        <p className="mt-2 text-zinc-500">Désolé, nous ne trouvons pas ce produit dans votre région.</p>
        <Link href="/products" className="mt-4 inline-block text-zinc-600 underline">Retour aux produits</Link>
      </div>
    )
  }

  let categoryPath: string | null = null
  if (product.google_product_category_id) {
    const { data: cat } = await supabase.from('google_categories').select('full_path').eq('id', product.google_product_category_id).single()
    categoryPath = cat?.full_path ?? null
  }
  const categoryLabel = categoryPath || product.google_product_category_path || t.product.google_category

  const { data: similars } = await supabase
    .from('products')
    .select('id, title, image_link, price_value, price_currency')
    .eq('country_code', selectedCountry)
    .eq('google_product_category_id', product.google_product_category_id)
    .neq('id', product.id)
    .order('price_value', { ascending: true })
    .limit(4)

  const similarProducts = (similars as any[]) || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-50 pb-4 dark:border-zinc-800">
        <Link href={`/?country=${selectedCountry}&lang=${selectedLang}`} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.product.home}</Link>
        <span className="opacity-30">/</span>
        <Link href={`/products?country=${selectedCountry}&lang=${selectedLang}`} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.product.products}</Link>
        <span className="opacity-30">/</span>
        <span className="text-zinc-900 dark:text-white truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* Product Image Section */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm">
          <div className="absolute top-4 left-4 z-10">
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${product.availability === 'in stock' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {product.availability === 'in stock' ? t.product.in_stock : t.product.out_of_stock}
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
            {product.merchants && (
              <>
                <span className="opacity-30 mx-1">•</span>
                <span className="text-zinc-500">
                  {Array.isArray(product.merchants) ? product.merchants[0]?.name : (product.merchants as any).name}
                </span>
              </>
            )}
          </div>

          <h1 className="mb-4 text-lg font-bold tracking-tight text-zinc-900 sm:text-xl lg:text-2xl dark:text-white leading-tight">
            {product.title}
          </h1>

          <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
              {formatPrice(product.price_value, product.price_currency)}
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800/50">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>{t.product.shipping} : {product.shipping_price != null ? formatPrice(product.shipping_price, product.price_currency) : t.product.shipping_confirm}</span>
            </div>
            {product.sale_price && product.sale_price < product.price_value! && (
              <span className="text-lg text-zinc-400 font-bold line-through">
                {formatPrice(product.price_value, product.price_currency)}
              </span>
            )}
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

          <div className="mt-auto pt-6">
            {product.link ? (
              <a
                href={product.link}
                target="_blank"
                rel="noreferrer"
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-900 py-5 text-lg font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 shadow-xl"
              >
                <span>{t.product.view_merchant}</span>
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            ) : (
              <div className="rounded-2xl bg-zinc-100 p-5 text-center text-zinc-500 font-bold">Lien non disponible</div>
            )}
            <p className="mt-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {t.product.redirect_notice}
            </p>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="mt-24 pt-12 border-t border-zinc-100 dark:border-zinc-800">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase tracking-widest">{t.product.similar}</h2>
            <Link href={`/products?country=${selectedCountry}&lang=${selectedLang}`} className="text-xs font-black text-zinc-400 hover:text-zinc-900 transition-colors">{t.product.view_all_similar}</Link>
          </div>
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((sp) => (
              <Link key={sp.id} href={`/product/${sp.id}?country=${selectedCountry}&lang=${selectedLang}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="aspect-square p-4 bg-zinc-50/50">
                  {sp.image_link ? (
                    <img src={sp.image_link} alt={sp.title || ''} className="h-full w-full object-contain transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded bg-zinc-50 text-[10px] text-zinc-300">{t.product.no_image}</div>
                  )}
                </div>
                <div className="p-4 pt-4">
                  <h4 className="mb-2 line-clamp-1 text-sm font-bold text-zinc-900 dark:text-white group-hover:underline">{sp.title}</h4>
                  <span className="text-sm font-black text-zinc-900 dark:text-white">{formatPrice(sp.price_value, sp.price_currency)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
