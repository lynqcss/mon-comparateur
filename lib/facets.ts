import { unstable_cache } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'

/**
 * Couche de données CACHÉE pour les facettes de /products (catégories, marques).
 *
 * Source : la vue matérialisée `product_groups`, et non la table `products`.
 * La liste affiche des GROUPES de produits (un par GTIN + pays), donc ses
 * facettes doivent compter des groupes, pas des offres — sans quoi un produit
 * vendu par cinq marchands pèserait cinq fois dans le classement des marques.
 *
 * Pourquoi un cache : ces facettes ne dépendent que du catalogue synchronisé
 * (1x/jour par le cron), jamais du visiteur. Les recalculer à chaque rendu
 * faisait parcourir toute la table à chaque requête — un des facteurs du
 * dépassement des quotas Vercel/Supabase.
 *
 * `MAX_FACET_ROWS` est un filet de sécurité : il borne le coût d'un cache MISS
 * même si le catalogue grossit fortement.
 * TODO (scalabilité) : remplacer ces agrégations côté app par une agrégation
 * SQL (vue/RPC) quand le catalogue dépassera quelques dizaines de milliers de
 * lignes — le classement des marques deviendrait sinon approximatif.
 */
const REVALIDATE_SECONDS = 3600 // 1 h ; le catalogue ne change qu'une fois par jour
const MAX_FACET_ROWS = 10_000
// Supabase ne renvoie jamais plus de 1 000 lignes par requête, quelle que soit
// la limite demandée : il faut donc lire page par page.
const PAGE_ROWS = 1000

type Page<T> = PromiseLike<{ data: T[] | null }>

/**
 * Lit toutes les lignes d'une requête, par pages de 1 000, jusqu'à
 * MAX_FACET_ROWS. `page(from, to)` doit renvoyer la requête bornée par
 * `.range(from, to)`, avec un tri stable.
 */
async function fetchAllRows<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; from < MAX_FACET_ROWS; from += PAGE_ROWS) {
    const { data } = await page(from, from + PAGE_ROWS - 1)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < PAGE_ROWS) break
  }
  return rows
}

/** Catégories racines (niveau 1) ayant des produits dans ce pays. */
export const getRootCategories = unstable_cache(
  async (country: string): Promise<string[]> => {
    const data = await fetchAllRows<{ google_product_category_id: number | null }>((from, to) =>
      supabase
        .from('product_groups')
        .select('google_product_category_id')
        .eq('country_code', country)
        .not('google_product_category_id', 'is', null)
        .order('group_key')
        .range(from, to)
    )

    const ids = Array.from(
      new Set(
        data
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
      const data = await fetchAllRows<{ id: number }>((from, to) =>
        supabase
          .from('google_categories')
          .select('id')
          .ilike('full_path', `${categoryPath}%`)
          .order('id')
          .range(from, to)
      )
      return data.map((c) => c.id)
    }

    if (rootCategory) {
      // Certains rayons comptent plus de 1 000 sous-catégories (Maison et jardin).
      const data = await fetchAllRows<{ id: number }>((from, to) =>
        supabase
          .from('google_categories')
          .select('id')
          .eq('level1', rootCategory)
          .order('id')
          .range(from, to)
      )
      return data.map((c) => c.id)
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
    const data = await fetchAllRows<{ brand: string | null }>((from, to) => {
      let query = supabase
        .from('product_groups')
        .select('brand')
        .eq('country_code', country)
        .not('brand', 'is', null)

      if (categoryIds && categoryIds.length > 0) {
        query = query.in('google_product_category_id', categoryIds)
      }
      if (q) query = query.ilike('title', `%${q}%`)

      return query.order('group_key').range(from, to)
    })

    const counts: Record<string, number> = {}
    for (const r of data) {
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
