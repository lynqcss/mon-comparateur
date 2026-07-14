// app/category/[id]/page.tsx
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/utils'

type CategoryPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    country?: string
    lang?: string
  }>
}

type GroupRow = {
  route_key: string
  title: string | null
  image_link: string | null
  min_price: number | null
  price_currency: string | null
  merchant_count: number | null
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { id } = await params
  const { country, lang } = await searchParams
  const categoryId = Number(id)

  const selectedCountry = (country || 'FR').toUpperCase()
  const selectedLang = lang || (selectedCountry === 'FR' ? 'fr' : 'en')
  const qs = `country=${selectedCountry}&lang=${selectedLang}`

  if (Number.isNaN(categoryId)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Catégorie Invalide</h1>
        <Link href="/products" className="mt-4 inline-block text-zinc-600 underline">Retour aux produits</Link>
      </div>
    )
  }

  const { data: category } = await supabase.from('google_categories').select('id, full_path').eq('id', categoryId).single()

  if (!category) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Catégorie Non Trouvée</h1>
        <Link href="/products" className="mt-4 inline-block text-zinc-600 underline">Retour aux produits</Link>
      </div>
    )
  }

  const { data: groups } = await supabase
    .from('product_groups')
    .select('route_key, title, image_link, min_price, price_currency, merchant_count')
    .eq('google_product_category_id', categoryId)
    .eq('country_code', selectedCountry)
    .order('min_price', { ascending: true })
  const groupList = (groups || []) as GroupRow[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
        <Link href={`/?${qs}`} className="hover:text-zinc-900 transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={`/products?${qs}`} className="hover:text-zinc-900 transition-colors">Produits</Link>
        <span>/</span>
        <span className="text-zinc-900 truncate max-w-[200px]">{category.full_path}</span>
      </nav>

      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">{category.full_path}</h1>
        <p className="text-zinc-500">{groupList.length} produits disponibles</p>
      </div>

      {groupList.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {groupList.map((g) => {
            const href = `/product/${encodeURIComponent(g.route_key)}?${qs}`
            const multi = (g.merchant_count ?? 0) >= 2
            return (
              <article key={g.route_key} className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
                {multi && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
                    {g.merchant_count} marchands
                  </span>
                )}
                <Link href={href} className="aspect-square p-6 bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
                  {g.image_link ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image_link} alt={g.title || ''} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply dark:mix-blend-normal" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-300">Pas d&apos;image</div>
                  )}
                </Link>
                <div className="p-4 flex flex-1 flex-col">
                  <Link href={href} className="mb-4 line-clamp-2 text-sm font-bold text-zinc-900 dark:text-white hover:underline">
                    {g.title}
                  </Link>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-black text-zinc-900 dark:text-white">{formatPrice(g.min_price, g.price_currency)}</span>
                    <Link href={href} className="rounded-full bg-zinc-900 p-2 text-white transition-all hover:scale-110 dark:bg-white dark:text-zinc-900">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-zinc-100 p-24 text-center dark:border-zinc-800">
          <p className="text-zinc-400">Aucun produit trouvé dans cette catégorie.</p>
        </div>
      )}
    </div>
  )
}
