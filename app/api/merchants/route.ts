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

    const { data, error } = await supabase
      .from('merchants')
      .insert([
        {
          gmc_id,
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
