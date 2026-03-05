import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getGoogleMerchantClient } from '@/lib/googleClient'

// This endpoint is called by Vercel Cron to sync all active merchants
// Configure in vercel.json: every 12 hours
export async function GET(req: Request) {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all non-paused merchants
    const { data: merchants, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('sync_paused', false)

    if (error || !merchants) {
        return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
    }

    const results = []

    for (const merchant of merchants) {
        try {
            // Call the existing sync endpoint internally
            const syncUrl = new URL('/api/gmc/sync', req.url)
            syncUrl.searchParams.set('merchantId', String(merchant.id))

            const res = await fetch(syncUrl.toString())
            const data = await res.json()

            results.push({
                merchant_id: merchant.id,
                name: merchant.name,
                success: data.success,
                imported: data.imported || 0,
            })
        } catch (err: any) {
            results.push({
                merchant_id: merchant.id,
                name: merchant.name,
                success: false,
                error: err.message,
            })
        }
    }

    return NextResponse.json({
        synced: results.length,
        results,
    })
}
