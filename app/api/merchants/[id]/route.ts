import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const merchantId = Number(id)

    if (Number.isNaN(merchantId)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    // Fetch merchant
    const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', merchantId)
        .single()

    if (merchantError || !merchant) {
        return NextResponse.json({ error: 'Marchand introuvable' }, { status: 404 })
    }

    // Fetch sync logs (last 30 days, ordered by most recent)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: logs, error: logsError } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('merchant_id', merchantId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100)

    return NextResponse.json({
        merchant,
        logs: logs || [],
    })
}
