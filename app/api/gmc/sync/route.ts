import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getGoogleMerchantClient } from '@/lib/googleClient'

function normalizeGoogleCategory(raw: any): {
  categoryId: number | null
  categoryPath: string | null
} {
  if (!raw) {
    return { categoryId: null, categoryPath: null }
  }

  const str = String(raw).trim()
  if (!str) {
    return { categoryId: null, categoryPath: null }
  }

  // Cas 1 : uniquement des chiffres → on considère que c'est un ID
  const onlyDigits = /^[0-9]+$/.test(str)
  if (onlyDigits) {
    return {
      categoryId: Number(str),
      categoryPath: null, // on pourra récupérer le chemin via la table taxonomy plus tard
    }
  }

  // Cas 2 : sinon → on considère que c'est le chemin texte
  return {
    categoryId: null,
    categoryPath: str,
  }
}

// Petit helper pour mettre à jour le statut d'import d'un marchand
async function updateImportStatus(
  merchantId: number,
  status: 'success' | 'error',
  count: number | null,
  message: string | null,
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const merchantIdParam = searchParams.get('merchantId')

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

  // 1) Récupérer le marchand dans Supabase
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

  // Check if sync is paused
  if (merchant.sync_paused) {
    return NextResponse.json(
      { success: false, message: 'Synchronisation en pause pour ce marchand' },
      { status: 200 }
    )
  }

  const startTime = Date.now()

  try {
    const content = getGoogleMerchantClient()

    // 2) Appel Content API → liste des produits du GMC
    const gmcResponse = await content.products.list({
      merchantId: merchant.gmc_id,
      maxResults: 250, // on pourra ajuster plus tard
    })

    const gmcProducts = (gmcResponse.data.resources || []) as any[]

    // On construit les lignes en async pour pouvoir appeler Supabase
    const rows = await Promise.all(
      gmcProducts.map(async (p) => {
        const { categoryId, categoryPath } = normalizeGoogleCategory(
          (p as any).googleProductCategory ?? (p as any).google_product_category
        )

        let finalCategoryId = categoryId
        let finalCategoryPath = categoryPath

        // Si on n'a pas d'ID mais qu'on a un chemin texte,
        // on essaie de le mapper à un ID via la table google_categories
        if (!finalCategoryId && finalCategoryPath) {
          const { data: cats, error: catError } = await supabase
            .from('google_categories')
            .select('id, full_path')
            .eq('full_path', finalCategoryPath)
            .limit(1)

          if (!catError && cats && cats.length > 0) {
            finalCategoryId = cats[0].id
            // on garde le texte tel qu'envoyé par le marchand
          }
        }

        return {
          merchant_id: merchant.id,
          offer_id: p.offerId ?? null,
          title: p.title ?? null,
          description: p.description ?? null,
          link: p.link ?? null,
          image_link: p.imageLink ?? null,
          price_value: p.price?.value ? Number(p.price.value) : null,
          price_currency: p.price?.currency ?? null,
          availability: p.availability ?? null,
          brand: p.brand ?? null,
          // prix soldé (si présent dans le feed)
          sale_price: p.salePrice?.value ? Number(p.salePrice.value) : null,
          sale_price_effective_date: (p as any).salePriceEffectiveDate ?? null,

          // catégories normalisées
          google_product_category_id: finalCategoryId,
          google_product_category_path: finalCategoryPath,

          // Frais de livraison (on prend le premier prix de livraison défini)
          shipping_price: p.shipping?.[0]?.price?.value ? Number(p.shipping[0].price.value) : null,

          raw_data: p,
        }
      })
    )

    // 4) Supprimer les anciens produits de ce marchand puis insérer les nouveaux

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('merchant_id', merchant.id)

    if (deleteError) {
      await updateImportStatus(
        merchant.id,
        'error',
        0,
        `Erreur suppression produits existants: ${deleteError.message}`
      )

      return NextResponse.json(
        {
          success: false,
          message: 'Erreur suppression produits existants',
          deleteError,
        },
        { status: 500 }
      )
    }

    const { error: insertError } = await supabase.from('products').insert(rows)

    if (insertError) {
      await updateImportStatus(
        merchant.id,
        'error',
        0,
        `Erreur insertion Supabase: ${insertError.message}`
      )

      return NextResponse.json(
        {
          success: false,
          message: 'Erreur insertion Supabase',
          insertError,
        },
        { status: 500 }
      )
    }


    // 5) Mise à jour du statut d'import
    await updateImportStatus(merchant.id, 'success', rows.length, null)

    // 6) Ecrire le log de synchronisation
    const durationMs = Date.now() - startTime
    await supabase.from('sync_logs').insert({
      merchant_id: merchant.id,
      product_count: rows.length,
      status: 'success',
      duration_ms: durationMs,
      message: null,
    })

    // 7) Nettoyage des logs > 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('sync_logs').delete().lt('created_at', thirtyDaysAgo)

    return NextResponse.json({
      success: true,
      imported: rows.length,
      duration_ms: durationMs,
    })
  } catch (err: any) {
    console.error('Erreur sync GMC:', err)

    await updateImportStatus(
      merchant.id,
      'error',
      0,
      err?.message || 'Erreur inconnue lors de la synchro GMC'
    )

    // Log l'erreur aussi
    const durationMs = Date.now() - startTime
    await supabase.from('sync_logs').insert({
      merchant_id: merchant.id,
      product_count: 0,
      status: 'error',
      duration_ms: durationMs,
      message: err?.message || 'Erreur inconnue',
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la synchro GMC',
        error: err?.message || String(err),
      },
      { status: 500 }
    )
  }
}
