import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'

/**
 * Couche de données CACHÉE pour les facettes de /products (catégories, marques).
 *
 * Pourquoi : ces facettes ne dépendent que du catalogue synchronisé (1x/jour par
 * le cron), jamais du visiteur. Les recalculer à chaque rendu faisait parcourir
 * toute la table `products` à chaque requête — un des facteurs du dépassement
 * des quotas Vercel/Supabase.
 *
 * `MAX_FACET_ROWS` est un filet de sécurité : il borne le coût d'un cache MISS
 * même si le catalogue grossit fortement.
 * TODO (scalabilité) : remplacer ces agrégations côté app par une agrégation
 * SQL (vue/RPC) quand le catalogue dépassera quelques dizaines de milliers de
 * lignes — le classement des marques deviendrait sinon approximatif.
 */
const REVALIDATE_SECONDS = 3600 // 1 h ; le catalogue ne change qu'une fois par jour
const MAX_FACET_ROWS = 10_000

/** Catégories racines (niveau 1) ayant des produits dans ce pays. */
export const getRootCategories = unstable_cache(
  async (country: string): Promise<string[]> => {
    const { data } = await supabase
      .from('products')
      .select('google_product_category_id')
      .eq('country_code', country)
      .not('google_product_category_id', 'is', null)
      .limit(MAX_FACET_ROWS)

    const ids = Array.from(
      new Set(
        (data || [])
          .map((r) => r.google_product_category_id)
          .filter((id): id is number => id !== null)
      )
    )
    if (ids.length === 0) return []

    const { data: cats } = await supabase
      .from('google_categories')
      .select('level1')
      .in('id', ids)

    const roots = Array.from(
      new Set((cats || []).map((c) => c.level1).filter(Boolean))
    ) as string[]
    return roots.sort()
  },
  ['facet-root-categories'],
  { revalidate: REVALIDATE_SECONDS, tags: ['catalog'] }
)

/**
 * Résout le filtre catégorie actif en liste d'IDs google_product_category_id.
 * Renvoie null quand aucun filtre catégorie n'est actif.
 */
export const getCategoryIdsForFilter = unstable_cache(
  async (
    categoryId: number | null,
    categoryPath: string | null,
    rootCategory: string | null
  ): Promise<number[] | null> => {
    if (categoryId) return [categoryId]

    if (categoryPath) {
      const { data } = await supabase
        .from('google_categories')
        .select('id')
        .ilike('full_path', `${categoryPath}%`)
      return (data || []).map((c) => c.id)
    }

    if (rootCategory) {
      const { data } = await supabase
        .from('google_categories')
        .select('id')
        .eq('level1', rootCategory)
      return (data || []).map((c) => c.id)
    }

    return null
  },
  ['facet-category-ids'],
  { revalidate: REVALIDATE_SECONDS, tags: ['catalog'] }
)

/** Marques disponibles, triées par popularité puis alphabétiquement. */
export const getBrands = unstable_cache(
  async (
    country: string,
    categoryIds: number[] | null,
    q: string
  ): Promise<string[]> => {
    let query = supabase
      .from('products')
      .select('brand')
      .eq('country_code', country)
      .not('brand', 'is', null)
      .limit(MAX_FACET_ROWS)

    if (categoryIds && categoryIds.length > 0) {
      query = query.in('google_product_category_id', categoryIds)
    }
    if (q) query = query.ilike('title', `%${q}%`)

    const { data } = await query

    const counts: Record<string, number> = {}
    for (const r of data || []) {
      if (r.brand) counts[r.brand] = (counts[r.brand] || 0) + 1
    }

    let sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a])
    // Sur la page "tous les produits" (aucun filtre catégorie), on borne la
    // sidebar aux 100 marques les plus fréquentes — comportement d'origine.
    if (!categoryIds) sorted = sorted.slice(0, 100)
    return sorted.sort()
  },
  ['facet-brands'],
  { revalidate: REVALIDATE_SECONDS, tags: ['catalog'] }
)
