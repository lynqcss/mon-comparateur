// app/category/[id]/page.tsx
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type CategoryPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    country?: string
    lang?: string
  }>
}

type ProductRow = {
  id: number
  title: string | null
  image_link: string | null
  price_value: number | null
  price_currency: string | null
}

const formatPrice = (value: number | null, currency: string | null) => {
  if (value == null) return null
  const cur = currency || 'EUR'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(value)
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { id } = await params
  const { country, lang } = await searchParams
  const categoryId = Number(id)

  const selectedCountry = country === 'PL' ? 'PL' : 'FR'
  const selectedLang = lang || (selectedCountry === 'FR' ? 'fr' : 'en')

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

  const { data: products } = await supabase.from('products').select('id, title, image_link, price_value, price_currency').eq('google_product_category_id', categoryId).eq('country_code', selectedCountry).order('id', { ascending: false })
  const productList = (products || []) as ProductRow[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-widest">
        <Link href={`/?country=${selectedCountry}&lang=${selectedLang}`} className="hover:text-zinc-900 transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={`/products?country=${selectedCountry}&lang=${selectedLang}`} className="hover:text-zinc-900 transition-colors">Produits</Link>
        <span>/</span>
        <span className="text-zinc-900 truncate max-w-[200px]">{category.full_path}</span>
      </nav>

      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">{category.full_path}</h1>
        <p className="text-zinc-500">{productList.length} produits disponibles</p>
      </div>

      {productList.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {productList.map((p) => (
            <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
              <Link href={`/product/${p.id}?country=${selectedCountry}&lang=${selectedLang}`} className="aspect-square p-6 bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
                {p.image_link ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_link} alt={p.title || ''} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply dark:mix-blend-normal" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-300">Pas d&apos;image</div>
                )}
              </Link>
              <div className="p-4 flex flex-1 flex-col">
                <Link href={`/product/${p.id}?country=${selectedCountry}&lang=${selectedLang}`} className="mb-4 line-clamp-2 text-sm font-bold text-zinc-900 dark:text-white hover:underline">
                  {p.title}
                </Link>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-black text-zinc-900 dark:text-white">{formatPrice(p.price_value, p.price_currency)}</span>
                  <Link href={`/product/${p.id}?country=${selectedCountry}&lang=${selectedLang}`} className="rounded-full bg-zinc-900 p-2 text-white transition-all hover:scale-110 dark:bg-white dark:text-zinc-900">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-zinc-100 p-24 text-center dark:border-zinc-800">
          <p className="text-zinc-400">Aucun produit trouvé dans cette catégorie.</p>
        </div>
      )}
    </div>
  )
}
