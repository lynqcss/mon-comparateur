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

const txtPath = './taxonomy-fr.txt'

async function importCategories() {
    console.log("Lecture du fichier TXT de Google...")
    const content = fs.readFileSync(txtPath, 'utf-8')

    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'))

    console.log(`Trouvé ${lines.length} catégories taxonomiques.`)

    const categories = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Format is "ID - Level 1 > Level 2 > Level 3..."
        const sepIndex = line.indexOf(' - ')
        if (sepIndex === -1) continue

        const idStr = line.substring(0, sepIndex).trim()
        const id = parseInt(idStr, 10)
        if (isNaN(id)) continue

        const full_path = line.substring(sepIndex + 3).trim()
        const levels = full_path.split(' > ').map(l => l.trim())

        categories.push({
            id,
            level1: levels[0] || null,
            level2: levels[1] || null,
            level3: levels[2] || null,
            level4: levels[3] || null,
            level5: levels[4] || null,
            level6: levels[5] || null,
            level7: levels[6] || null,
            full_path
        })
    }

    console.log(`Insertion de ${categories.length} catégories mises à jour...`)

    const BATCH_SIZE = 1000
    for (let i = 0; i < categories.length; i += BATCH_SIZE) {
        const batch = categories.slice(i, i + BATCH_SIZE)
        console.log(`Insertion batch ${i} - ${i + batch.length}...`)

        const { error } = await supabase.from('google_categories').upsert(batch, { onConflict: 'id' })
        if (error) {
            console.error("Erreur d'insertion :", error)
        }
    }

    console.log("Mise à jour (traduction) terminée avec succès !")
}

importCategories().catch(console.error)
