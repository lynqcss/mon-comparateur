import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .order('id', { ascending: false })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gmc_id, name, website_url, default_category } = body

    if (!gmc_id || !name || !website_url) {
      return NextResponse.json(
        { error: 'gmc_id, name et website_url sont obligatoires' },
        { status: 400 }
      )
    }

    // Un même compte Merchant Center ne peut être rattaché qu'à un marchand.
    const gmcId = String(gmc_id).trim()
    const { data: existing, error: lookupError } = await supabase
      .from('merchants')
      .select('id, name')
      .eq('gmc_id', gmcId)
      .limit(1)

    if (lookupError) {
      console.error(lookupError)
      return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 })
    }
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `Ce GMC ID est déjà utilisé par le marchand « ${existing[0].name} » (n° ${existing[0].id}).` },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('merchants')
      .insert([
        {
          gmc_id: gmcId,
          name,
          website_url,
          default_category: default_category || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const merchantId = searchParams.get('id')

  if (!merchantId) {
    return NextResponse.json(
      { error: 'Paramètre id manquant' },
      { status: 400 }
    )
  }

  // 1) Supprimer tous les produits du marchand
  const { error: productsError } = await supabase
    .from('products')
    .delete()
    .eq('merchant_id', Number(merchantId))

  if (productsError) {
    console.error('Erreur suppression produits:', productsError)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des produits' },
      { status: 500 }
    )
  }

  // 2) Supprimer le marchand
  const { error: merchantError } = await supabase
    .from('merchants')
    .delete()
    .eq('id', Number(merchantId))

  if (merchantError) {
    console.error('Erreur suppression marchand:', merchantError)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du marchand' },
      { status: 500 }
    )
  }

  // Sans ce rafraîchissement, les fiches du marchand supprimé resteraient dans
  // la comparaison jusqu'à la prochaine synchronisation. Au mieux : un échec
  // ici n'annule pas la suppression, déjà faite.
  const { error: refreshError } = await supabase.rpc('refresh_product_groups')
  if (refreshError) {
    console.error('refresh_product_groups:', refreshError.message)
  }

  return NextResponse.json({ success: true, refreshed: !refreshError })
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, sync_paused } = body

    if (!id || typeof sync_paused !== 'boolean') {
      return NextResponse.json(
        { error: 'id et sync_paused sont requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('merchants')
      .update({ sync_paused })
      .eq('id', Number(id))
      .select()
      .single()

    if (error) {
      console.error('Erreur toggle pause:', error)
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
