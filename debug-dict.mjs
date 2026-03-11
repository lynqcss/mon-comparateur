import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDict() {
    const csvContent = fs.readFileSync('C:/Users/rode/Downloads/Taxonomy Google - Multi-langues - FR.csv', 'utf8')
    const csvLines = csvContent.split('\n').filter(l => l.includes(','))
    const wooIdToString = new Map()

    csvLines.forEach(l => {
        const cols = l.split(',')
        const id = parseInt(cols[0].trim(), 10)
        let stringPath = ''
        for (let i = 1; i < cols.length; i++) {
            if (cols[i] && cols[i].trim() !== '') {
                let val = cols[i].trim().replace(/^"|"$/g, '')
                stringPath += (stringPath ? ' > ' : '') + val
            }
        }
        if (!isNaN(id) && stringPath) {
            wooIdToString.set(id, stringPath)
        }
    })

    // get true db categories
    const { data: dbCategories } = await supabase.from('google_categories').select('id, full_path')
    const stringToTrueId = new Map()
    dbCategories.forEach(cat => {
        stringToTrueId.set(cat.full_path.toLowerCase(), cat.id) // Using lowercase for slightly better matching
    })

    let missed = 0
    for (const [wooId, wooString] of wooIdToString.entries()) {
        if (!stringToTrueId.has(wooString.toLowerCase())) {
            if (missed < 5) console.log('MISMATCH:', wooString)
            missed++
        }
    }

    console.log('TOTAL MATCHES:', wooIdToString.size - missed, '/ TOTAL MISSED:', missed)
}
analyzeDict()
