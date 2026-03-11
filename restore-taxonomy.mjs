import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function restoreTaxonomy() {
    console.log("Lecture des fichiers TXT de Google (EN et FR)...")

    const parseLines = (path) => {
        return fs.readFileSync(path, 'utf-8')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('#'))
    }

    const enLines = parseLines('taxonomy-en.txt')
    const frLines = parseLines('taxonomy-fr.txt')

    // Create a map of ID -> { id, path_en, path_fr }
    const idToPaths = new Map()

    for (const line of enLines) {
        const sepIndex = line.indexOf(' - ')
        if (sepIndex === -1) continue
        const id = parseInt(line.substring(0, sepIndex).trim(), 10)
        const full_path = line.substring(sepIndex + 3).trim()
        if (!isNaN(id)) {
            idToPaths.set(id, { id, path_en: full_path })
        }
    }

    for (const line of frLines) {
        const sepIndex = line.indexOf(' - ')
        if (sepIndex === -1) continue
        const id = parseInt(line.substring(0, sepIndex).trim(), 10)
        const full_path = line.substring(sepIndex + 3).trim()
        if (!isNaN(id) && idToPaths.has(id)) {
            idToPaths.get(id).path_fr = full_path
        }
    }

    // Now create a Map of English Path -> French Path and Data
    const enPathToFrData = new Map()
    for (const val of idToPaths.values()) {
        if (val.path_en && val.path_fr) {
            const levels = val.path_fr.split(' > ').map(l => l.trim())
            enPathToFrData.set(val.path_en, {
                id: val.id, // The TRUE official Google ID
                full_path: val.path_fr,
                level1: levels[0] || null,
                level2: levels[1] || null,
                level3: levels[2] || null,
                level4: levels[3] || null,
                level5: levels[4] || null,
                level6: levels[5] || null,
                level7: levels[6] || null
            })
        }
    }

    console.log(`Mapping construit : ${enPathToFrData.size} catégories croisées par ID.`)

    // Get all existing categories in our DB that we messed up or that need translation
    const { data: dbCategories, error } = await supabase.from('google_categories').select('*')
    if (error) {
        console.error("Erreur de lecture DB:", error)
        return
    }

    console.log(`Lecture de ${dbCategories.length} catégories existantes en base de données.`)

    const toUpdate = []

    for (const dbCat of dbCategories) {
        // If we have an english path in DB, and we know the translation
        if (dbCat.path_en && enPathToFrData.has(dbCat.path_en)) {
            const frData = enPathToFrData.get(dbCat.path_en)

            // Update the db object with the correct french translation, keeping its fake woocommerce ID intact
            // so we don't break the product relations!
            toUpdate.push({
                id: dbCat.id,
                path_en: dbCat.path_en,
                level1: frData.level1,
                level2: frData.level2,
                level3: frData.level3,
                level4: frData.level4,
                level5: frData.level5,
                level6: frData.level6,
                level7: frData.level7,
                full_path: frData.full_path
            })
        }
    }

    console.log(`${toUpdate.length} catégories prêtes à être restaurées et traduites proprement.`)

    // Batch update
    const BATCH_SIZE = 1000
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
        const batch = toUpdate.slice(i, i + BATCH_SIZE)
        console.log(`Mise à jour batch ${i} - ${i + batch.length}...`)

        const { error: upsertErr } = await supabase.from('google_categories').upsert(batch, { onConflict: 'id' })
        if (upsertErr) {
            console.error("Erreur d'update :", upsertErr)
        }
    }

    console.log("Restauration et traduction terminées avec succès !")
}

restoreTaxonomy().catch(console.error)
