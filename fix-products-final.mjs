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

async function fixSpecificProducts() {
    const { data: dbProducts } = await supabase.from('products').select('id, google_product_category_id')

    const distinctIds = new Set()
    dbProducts.forEach(p => {
        if (p.google_product_category_id) distinctIds.add(p.google_product_category_id)
    })
    console.log(`Analyzing ${distinctIds.size} distinct categories actually used by products...`)

    const csvContent = fs.readFileSync('C:/Users/rode/Downloads/Taxonomy Google - Multi-langues - FR.csv', 'utf8')
    const csvLines = csvContent.split('\n').filter(l => l.includes(','))

    const wooIdToString = new Map()
    csvLines.forEach(l => {
        const cols = parseCsvLine(l)
        const idStr = cols[0]
        if (!idStr) return
        const id = parseInt(idStr.replace(/^"|"$/g, ''), 10)

        if (distinctIds.has(id)) {
            let stringPath = ''
            for (let i = 1; i < cols.length; i++) {
                let val = cols[i]
                if (val) {
                    val = val.replace(/^"|"$/g, '').trim()
                    if (val && val !== '') stringPath += (stringPath ? ' > ' : '') + val
                }
            }
            wooIdToString.set(id, stringPath.toLowerCase())
        }
    })

    const { data: dbCategories } = await supabase.from('google_categories').select('id, full_path')
    const stringToTrueId = new Map()
    dbCategories.forEach(cat => {
        // Normalizing strings to remove tiny mismatches
        let norm = cat.full_path.toLowerCase()
            .replace(/ - /g, '-')
            .replace(/  /g, ' ')
            .trim()
        stringToTrueId.set(norm, cat.id)
    })

    // Manual overrides for the worst offenders (like TVs!)
    const OVERRIDES = {
        757: 404, // Televisions
        6543: 6543, // Keep ok
        414: 6712, // example
    }

    const idRemap = new Map()

    for (const [wooId, wooString] of wooIdToString.entries()) {
        let normWoo = wooString.replace(/ - /g, '-').replace(/  /g, ' ').trim()

        if (OVERRIDES[wooId]) {
            idRemap.set(wooId, OVERRIDES[wooId])
            continue
        }

        if (stringToTrueId.has(normWoo)) {
            idRemap.set(wooId, stringToTrueId.get(normWoo))
        } else {
            // Fuzzy search: try finding a DB string that ends with the last word or two of the WooCommerce string
            const wooParts = normWoo.split(' > ')
            const lastPart = wooParts[wooParts.length - 1]

            let foundMatch = null
            for (const [dbStr, dbId] of stringToTrueId.entries()) {
                const dbParts = dbStr.split(' > ')
                if (dbParts[dbParts.length - 1] === lastPart && dbParts[0] === wooParts[0]) {
                    foundMatch = dbId
                    break
                }
            }
            if (foundMatch) {
                idRemap.set(wooId, foundMatch)
            } else {
                console.warn("COULD NOT MAP WOO ID:", wooId, "STRING:", normWoo)
            }
        }
    }

    console.log(`Successfully mapped ${idRemap.size} Woo IDs to True database IDs.`)

    const toUpdate = []
    dbProducts.forEach(p => {
        if (p.google_product_category_id && idRemap.has(p.google_product_category_id)) {
            const trueId = idRemap.get(p.google_product_category_id)
            if (p.google_product_category_id !== trueId) {
                toUpdate.push({ id: p.id, google_product_category_id: trueId })
            }
        }
    })

    console.log(`Applying updates to ${toUpdate.length} products...`)
    if (toUpdate.length > 0) {
        const BATCH = 500
        for (let i = 0; i < toUpdate.length; i += BATCH) {
            await supabase.from('products').upsert(toUpdate.slice(i, i + BATCH), { onConflict: 'id' })
        }
        console.log('Fixed!')
    }
}

fixSpecificProducts().catch(console.error)
