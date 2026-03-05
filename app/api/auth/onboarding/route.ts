import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 })
    }

    const { error } = await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete onboarding session error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
