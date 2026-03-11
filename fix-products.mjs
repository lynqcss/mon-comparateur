import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// A simple CSV parser that respects quotes
function parseCsvLine(line) {
    const result = []
    let currentStr = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            result.push(currentStr.trim())
            currentStr = ''
        } else {
            currentStr += char
        }
    }
    result.push(currentStr.trim())
    return result
}

async function executeCorrection() {
    console.log('Loading user custom CSV mappings...')
    const csvContent = fs.readFileSync('C:/Users/rode/Downloads/Taxonomy Google - Multi-langues - FR.csv', 'utf8')
    const csvLines = csvContent.split('\n').filter(l => l.includes(','))

    const wooIdToString = new Map()

    csvLines.forEach(l => {
        const cols = parseCsvLine(l)
        const idStr = cols[0]
        if (!idStr) return
        const id = parseInt(idStr.replace(/^"|"$/g, ''), 10)

        let stringPath = ''
        for (let i = 1; i < cols.length; i++) {
            let val = cols[i]
            if (val) {
                val = val.replace(/^"|"$/g, '').trim()
                if (val !== '') {
                    stringPath += (stringPath ? ' > ' : '') + val
                }
            }
        }
        if (!isNaN(id) && stringPath) {
            wooIdToString.set(id, stringPath)
        }
    })

    console.log(`Loaded ${wooIdToString.size} WooCommerce ID-to-String mappings.`)

    console.log('Fetching Official Google Categories from DB...')
    const { data: dbCategories } = await supabase.from('google_categories').select('id, full_path')

    const stringToTrueId = new Map()
    dbCategories.forEach(cat => {
        stringToTrueId.set(cat.full_path.toLowerCase(), cat.id)
    })

    const wooIdToTrueId = new Map()
    let matched = 0
    for (const [wooId, wooString] of wooIdToString.entries()) {
        if (stringToTrueId.has(wooString.toLowerCase())) {
            wooIdToTrueId.set(wooId, stringToTrueId.get(wooString.toLowerCase()))
            matched++
        }
    }

    console.log(`Successfully mapped ${matched} total combinations perfectly with Official DB.`)

    const { data: products } = await supabase.from('products').select('id, google_product_category_id')
    const toUpdate = []

    products.forEach(p => {
        if (p.google_product_category_id && wooIdToTrueId.has(p.google_product_category_id)) {
            const trueId = wooIdToTrueId.get(p.google_product_category_id)
            if (p.google_product_category_id !== trueId) {
                toUpdate.push({ id: p.id, google_product_category_id: trueId })
            }
        }
    })

    console.log(`Found ${toUpdate.length} products holding incorrect WooCommerce IDs to replace with True DB IDs.`)

    if (toUpdate.length > 0) {
        const BATCH = 500
        for (let i = 0; i < toUpdate.length; i += BATCH) {
            console.log(`Updating batch [${i} - ${i + BATCH}]...`)
            await supabase.from('products').upsert(toUpdate.slice(i, i + BATCH), { onConflict: 'id' })
        }
        console.log('Product IDs replaced with correct Official Google IDs!')
    }
}

executeCorrection().catch(console.error)
