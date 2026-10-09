// Inspection des flux Awin : affiche la STRUCTURE de la liste des flux et d'un
// premier catalogue, pour adapter l'import au format réel. N'écrit rien nulle
// part. Les identifiants contenus dans les adresses sont masqués à l'affichage.
//
//   AWIN_FEED_LIST_URL   adresse « feedList » copiée depuis Awin (secret)

import { Readable } from 'node:stream'
import { createGunzip } from 'node:zlib'

import { readCsv } from './awin-import.mjs'

const listUrl = (process.env.AWIN_FEED_LIST_URL || '').trim()
if (!/^https?:\/\//.test(listUrl)) {
  console.error('Erreur : AWIN_FEED_LIST_URL manquant ou invalide.')
  process.exit(1)
}

// Tout segment long ou numérique de l'adresse est un identifiant : on le masque
// partout où il pourrait réapparaître (colonnes « URL » de la liste, erreurs).
const secrets = new URL(listUrl).pathname
  .split('/')
  .filter((part) => /^[0-9]{5,}$/.test(part) || /^[A-Za-z0-9]{16,}$/.test(part))
for (const value of secrets) console.log(`::add-mask::${value}`)
const mask = (text) => secrets.reduce((out, value) => out.split(value).join('***'), String(text))
const show = (label, value) => console.log(`${label} ${mask(value)}`)

show('Adresse de la liste :', listUrl.replace(/^https:\/\/[^/]+/, 'https://<hôte>'))

/** Lit au plus `limit` octets d'une réponse, décompressée si besoin. */
async function readHead(res, limit = 200_000) {
  const reader = res.body.getReader()
  const chunks = []
  let size = 0
  while (size < 64_000) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.length
  }
  await reader.cancel().catch(() => {})
  const raw = Buffer.concat(chunks)
  const gzip = raw[0] === 0x1f && raw[1] === 0x8b
  if (!gzip) return { gzip, text: raw.subarray(0, limit).toString('utf8') }

  const out = []
  let total = 0
  const gunzip = createGunzip()
  const done = new Promise((resolve) => {
    gunzip.on('data', (chunk) => { out.push(chunk); total += chunk.length; if (total > limit) gunzip.destroy() })
    gunzip.on('close', resolve)
    gunzip.on('error', resolve) // flux tronqué volontairement
  })
  gunzip.end(raw)
  await done
  return { gzip, text: Buffer.concat(out).subarray(0, limit).toString('utf8') }
}

// ---- 1. La liste des flux ----------------------------------------------------
const listRes = await fetch(listUrl)
console.log(`\n== Liste des flux : HTTP ${listRes.status}, type ${listRes.headers.get('content-type')}`)
if (!listRes.ok) {
  show('Réponse :', (await listRes.text()).slice(0, 400))
  process.exit(1)
}

const rows = []
for await (const row of readCsv(Readable.fromWeb(listRes.body))) rows.push(row)
const columns = rows.length ? Object.keys(rows[0]) : []
console.log(`${rows.length} ligne(s). Colonnes (${columns.length}) :`)
for (const column of columns) console.log(`  - ${column}`)

const count = (column) => {
  const tally = new Map()
  for (const row of rows) tally.set(row[column], (tally.get(row[column]) ?? 0) + 1)
  return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k || '(vide)'}=${v}`).join(', ')
}
for (const column of columns) {
  if (/status|language|region|vertical|format/i.test(column)) console.log(`Valeurs de « ${column} » : ${mask(count(column))}`)
}

const statusColumn = columns.find((c) => /membership/i.test(c))
const joined = statusColumn ? rows.filter((r) => /^(active|joined)$/i.test(String(r[statusColumn]).trim())) : []
console.log(`\nProgrammes acceptés : ${joined.length}`)
const sample = joined[0] ?? rows[0]
if (!sample) process.exit(0)

console.log('\n== Exemple de ligne')
for (const [key, value] of Object.entries(sample)) show(`  ${key} :`, String(value).slice(0, 160))

// ---- 2. Un premier catalogue --------------------------------------------------
const urlColumn = columns.find((c) => /^url$/i.test(c)) ?? columns.find((c) => /url|link|download/i.test(c))
const feedUrl = urlColumn ? String(sample[urlColumn]).trim() : ''
if (!/^https?:\/\//.test(feedUrl)) {
  console.log('\nAucune adresse de catalogue dans cette ligne : inspection du catalogue impossible.')
  process.exit(0)
}

const feedRes = await fetch(feedUrl)
console.log(`\n== Catalogue : HTTP ${feedRes.status}, type ${feedRes.headers.get('content-type')}, encodage ${feedRes.headers.get('content-encoding')}`)
if (!feedRes.ok) {
  show('Réponse :', (await feedRes.text()).slice(0, 400))
  process.exit(1)
}
const { gzip, text } = await readHead(feedRes)
console.log(`Compressé en gzip : ${gzip ? 'oui' : 'non'}`)
const lines = text.split(/\r?\n/).filter(Boolean)
const first = lines[0] ?? ''

if (first.trimStart().startsWith('{')) {
  console.log('Format : JSON, un produit par ligne.')
  try {
    const product = JSON.parse(first)
    console.log(`Champs du premier produit (${Object.keys(product).length}) :`)
    for (const [key, value] of Object.entries(product)) {
      const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
      show(`  ${key} :`, text.slice(0, 140))
    }
  } catch {
    show('Première ligne :', first.slice(0, 600))
  }
} else {
  console.log('Format : texte tabulaire.')
  show('En-tête :', first.slice(0, 1500))
  show('1re ligne :', (lines[1] ?? '').slice(0, 900))
  show('2e ligne :', (lines[2] ?? '').slice(0, 900))
}
