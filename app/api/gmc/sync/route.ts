import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import {
  listMerchantProductsPage,
  type MerchantProduct,
  type MerchantPrice,
} from '@/lib/googleClient'

// Synchro CATALOGUE COMPLET via la Merchant API, par curseur auto-enchaîné.
//
// Contrainte Vercel Hobby : fonctions ~10-60s, cron 1x/jour. On ne charge donc
// PAS tout le catalogue d'un coup : chaque invocation traite un lot de pages
// dans un budget de temps (~45s), sauvegarde le pageToken (curseur) sur le
// marchand, puis relance la suite (self-fetch best-effort). Le cron quotidien
// et le bouton admin servent de reprise/fallback fiable.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Budget de temps par invocation (marge sous maxDuration=60s).
const TIME_BUDGET_MS = 45_000
const PAGE_SIZE = 1000

// -------- Helpers ------------------------------------------------------------

/** Prix Merchant API (micros) -> nombre décimal, ou null. */
function priceFromMicros(p?: MerchantPrice): number | null {
  if (!p?.amountMicros) return null
  const n = Number(p.amountMicros)
  return Number.isFinite(n) ? n / 1_000_000 : null
}

/** Normalise la date d'effet du prix soldé (Interval Merchant API ou string). */
function normalizeSalePriceEffectiveDate(
  raw: { startTime?: string; endTime?: string } | string | undefined
): string | null {
  if (!raw) return null
  if (typeof raw === 'string') return raw
  const start = raw.startTime ?? ''
  const end = raw.endTime ?? ''
  const joined = `${start}/${end}`
  return joined === '/' ? null : joined
}

function normalizeGoogleCategory(raw: unknown): {
  categoryId: number | null
  categoryPath: string | null
} {
  if (!raw) return { categoryId: null, categoryPath: null }
  const str = String(raw).trim()
  if (!str) return { categoryId: null, categoryPath: null }

  // Uniquement des chiffres -> c'est un ID Google.
  if (/^[0-9]+$/.test(str)) {
    return { categoryId: Number(str), categoryPath: null }
  }
  // Sinon -> chemin texte.
  return { categoryId: null, categoryPath: str }
}

/** Met à jour le statut d'import d'un marchand. */
async function updateImportStatus(
  merchantId: number,
  status: 'success' | 'error',
  count: number | null,
  message: string | null
) {
  await supabase
    .from('merchants')
    .update({
      last_import_at: new Date().toISOString(),
      last_import_status: status,
      last_import_count: count,
      last_import_message: message,
    })
    .eq('id', merchantId)
}

/**
 * Résout les catégories Google d'une page de produits en UNE seule requête
 * (au lieu d'une requête Supabase par produit).
 * Renvoie une Map path(texte) -> id.
 */
async function resolveCategoryPaths(paths: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  const unique = Array.from(new Set(paths)).filter(Boolean)
  if (unique.length === 0) return map

  const { data, error } = await supabase
    .from('google_categories')
    .select('id, full_path')
    .in('full_path', unique)

  if (!error && data) {
    for (const row of data) {
      if (row.full_path != null) map.set(row.full_path, row.id)
    }
  }
  return map
}

/**
 * Déclenche la suite de la synchro (best-effort). On envoie la requête puis on
 * l'abandonne après un court délai : l'invocation suivante démarre côté serveur
 * indépendamment. Non fiable à 100 % sur serverless -> le cron/bouton admin
 * reprennent le curseur si la chaîne casse.
 */
async function triggerNextBatch(url: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2_500)
  try {
    // /api/gmc/sync est protégé par le middleware : on transmet le secret interne.
    await fetch(url, {
      signal: controller.signal,
      headers: process.env.CRON_SECRET
        ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
        : undefined,
    })
  } catch {
    // abort volontaire ou réseau : l'invocation suivante est déjà lancée.
  } finally {
    clearTimeout(timer)
  }
}

// -------- Route --------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const merchantIdParam = searchParams.get('merchantId')
  // Permet de désactiver l'auto-enchaînement (tests locaux pas-à-pas).
  const chain = searchParams.get('chain') !== '0'

  if (!merchantIdParam) {
    return NextResponse.json(
      { success: false, message: 'Paramètre merchantId manquant' },
      { status: 400 }
    )
  }

  const merchantId = Number(merchantIdParam)
  if (Number.isNaN(merchantId)) {
    return NextResponse.json(
      { success: false, message: 'merchantId invalide' },
      { status: 400 }
    )
  }

  // 1) Charger le marchand.
  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', merchantId)
    .single()

  if (merchantError || !merchant) {
    return NextResponse.json(
      { success: false, message: 'Marchand introuvable dans Supabase' },
      { status: 404 }
    )
  }

  if (merchant.sync_paused) {
    return NextResponse.json(
      { success: false, message: 'Synchronisation en pause pour ce marchand' },
      { status: 200 }
    )
  }

  const startTime = Date.now()

  // 2) Déterminer le cycle : reprise si un cycle est déjà en cours, sinon
  //    on démarre un nouveau cycle.
  const resuming =
    merchant.sync_state === 'running' && !!merchant.sync_run_id
  const runId: string = resuming
    ? merchant.sync_run_id
    : new Date().toISOString()
  let pageToken: string | null = resuming ? merchant.sync_cursor : null
  const country: string = merchant.country ?? 'FR'

  if (!resuming) {
    await supabase
      .from('merchants')
      .update({
        sync_state: 'running',
        sync_run_id: runId,
        sync_cursor: null,
        sync_started_at: runId,
        sync_page_count: 0,
      })
      .eq('id', merchant.id)
  }

  let pagesThisCall = 0
  let productsThisCall = 0

  try {
    // 3) Traiter des pages tant qu'il reste du temps.
    do {
      const page = await listMerchantProductsPage({
        accountId: merchant.gmc_id,
        pageToken,
        pageSize: PAGE_SIZE,
      })

      const products = page.products ?? []

      if (products.length > 0) {
        // Résolution des catégories (texte -> id) en une requête pour la page.
        const pathsToResolve: string[] = []
        const normalized = products.map((p) => {
          const cat = normalizeGoogleCategory(p.productAttributes?.googleProductCategory)
          if (!cat.categoryId && cat.categoryPath) pathsToResolve.push(cat.categoryPath)
          return cat
        })
        const pathToId = await resolveCategoryPaths(pathsToResolve)

        const rows = products.map((p: MerchantProduct, i) => {
          const attrs = p.productAttributes ?? {}
          const cat = normalized[i]
          const categoryId =
            cat.categoryId ??
            (cat.categoryPath ? pathToId.get(cat.categoryPath) ?? null : null)

          return {
            merchant_id: merchant.id,
            offer_id: p.offerId ?? null,
            title: attrs.title ?? null,
            description: attrs.description ?? null,
            link: attrs.link ?? null,
            image_link: attrs.imageLink ?? null,
            price_value: priceFromMicros(attrs.price),
            price_currency: attrs.price?.currencyCode ?? null,
            availability: attrs.availability ?? null,
            brand: attrs.brand ?? null,
            sale_price: priceFromMicros(attrs.salePrice),
            sale_price_effective_date: normalizeSalePriceEffectiveDate(
              attrs.salePriceEffectiveDate
            ),
            gtin: attrs.gtins?.[0] ?? null,
            google_product_category_id: categoryId,
            google_product_category_path: cat.categoryPath,
            shipping_price: priceFromMicros(attrs.shipping?.[0]?.price),
            country_code: country,
            // Marqueur "vu lors de ce cycle" : constant sur tout le cycle,
            // permet de supprimer les produits périmés en fin de cycle.
            last_seen_at: runId,
          }
        })

        // UPSERT (clé merchant_id + offer_id).
        const { error: upsertError } = await supabase
          .from('products')
          .upsert(rows, { onConflict: 'merchant_id,offer_id' })

        if (upsertError) {
          throw new Error(`Upsert Supabase: ${upsertError.message}`)
        }

        productsThisCall += rows.length
      }

      pageToken = page.nextPageToken ?? null
      pagesThisCall += 1

      // Sauvegarde du curseur après chaque page (reprise possible à tout moment).
      await supabase
        .from('merchants')
        .update({
          sync_cursor: pageToken,
          sync_page_count: (merchant.sync_page_count ?? 0) + pagesThisCall,
        })
        .eq('id', merchant.id)
    } while (pageToken && Date.now() - startTime < TIME_BUDGET_MS)

    const durationMs = Date.now() - startTime

    if (!pageToken) {
      // 4a) CYCLE TERMINÉ : suppression des produits non revus + clôture.
      const { error: staleError } = await supabase
        .from('products')
        .delete()
        .eq('merchant_id', merchant.id)
        .or(`last_seen_at.is.null,last_seen_at.lt."${runId}"`)

      // Comptage final des produits du marchand.
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)

      await supabase
        .from('merchants')
        .update({
          sync_state: 'idle',
          sync_cursor: null,
          sync_run_id: null,
        })
        .eq('id', merchant.id)

      await updateImportStatus(
        merchant.id,
        'success',
        count ?? productsThisCall,
        staleError ? `Produits périmés non supprimés: ${staleError.message}` : null
      )

      await supabase.from('sync_logs').insert({
        merchant_id: merchant.id,
        product_count: count ?? productsThisCall,
        status: 'success',
        duration_ms: durationMs,
        message: `Cycle terminé (${pagesThisCall} pages ce lot)`,
      })

      // Nettoyage des logs > 30 jours.
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString()
      await supabase.from('sync_logs').delete().lt('created_at', thirtyDaysAgo)

      return NextResponse.json({
        success: true,
        done: true,
        pages_this_call: pagesThisCall,
        products_this_call: productsThisCall,
        total_products: count ?? null,
        duration_ms: durationMs,
      })
    }

    // 4b) CYCLE EN COURS : le curseur est déjà sauvegardé, on relance la suite.
    if (chain) {
      const nextUrl = new URL('/api/gmc/sync', req.url)
      nextUrl.searchParams.set('merchantId', String(merchant.id))
      await triggerNextBatch(nextUrl.toString())
    }

    return NextResponse.json({
      success: true,
      done: false,
      pages_this_call: pagesThisCall,
      products_this_call: productsThisCall,
      next_cursor: pageToken,
      chained: chain,
      duration_ms: durationMs,
    })
  } catch (err: unknown) {
    console.error('Erreur sync GMC:', err)
    const message = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - startTime

    // On laisse le curseur en place (sync_state reste 'running') pour permettre
    // une reprise ultérieure par le cron/bouton admin, sans repartir de zéro.
    await updateImportStatus(merchant.id, 'error', null, message)

    await supabase.from('sync_logs').insert({
      merchant_id: merchant.id,
      product_count: productsThisCall,
      status: 'error',
      duration_ms: durationMs,
      message,
    })

    return NextResponse.json(
      { success: false, message: 'Erreur lors de la synchro GMC', error: message },
      { status: 500 }
    )
  }
}
