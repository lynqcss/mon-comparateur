// Import des catalogues Awin dans Lynq.
//
// Pour chaque annonceur Awin dont le programme est accepté, télécharge son
// flux produits, garde un échantillon borné d'offres valides et les écrit dans
// Supabase (un marchand `source = 'awin'` + ses produits). Les offres disparues
// du flux sont retirées, puis la vue de comparaison est rafraîchie.
//
// Tourne dans GitHub Actions (cf. .github/workflows/awin-import.yml), pas sur
// Vercel : les flux font parfois plusieurs centaines de Mo, et cet import ne
// doit rien coûter aux quotas du site.
//
// Aucune dépendance : Node 20+ (fetch, zlib, streams).
//
// Variables d'environnement :
//   AWIN_FEED_LIST_URL          adresse « feedList » du compte éditeur Awin (secret)
//   SUPABASE_URL                URL du projet Supabase
//   SUPABASE_SERVICE_ROLE_KEY   clé service (secret)
//   AWIN_MAX_PRODUCTS           plafond d'offres par marchand (défaut 1000)
//   AWIN_COUNTRY                pays des offres importées (défaut FR)
//   DRY_RUN=1                   lit et valide les flux sans rien écrire
//   AWIN_LIST_FILE / AWIN_FEED_DIR   fichiers locaux à la place d'Awin (tests)

import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pathToFileURL } from 'node:url'
import { createGunzip } from 'node:zlib'

import { mapCategory } from './awin-categories.mjs'

// Colonnes demandées à Awin. L'ordre n'a pas d'importance : on lit l'en-tête.
export const FEED_COLUMNS = [
  'aw_deep_link', 'product_name', 'aw_product_id', 'merchant_product_id',
  'merchant_image_url', 'aw_image_url', 'description', 'search_price',
  'currency', 'delivery_cost', 'merchant_name', 'merchant_id',
  'merchant_deep_link', 'brand_name', 'ean', 'product_GTIN', 'mpn', 'in_stock',
  'category_name', 'merchant_category',
]

const DESCRIPTION_MAX = 1000
const BATCH_SIZE = 500

// --- CSV ---------------------------------------------------------------------

/**
 * Analyseur CSV (RFC 4180) alimenté par morceaux : guillemets doublés, virgules
 * et retours à la ligne à l'intérieur d'un champ. Renvoie les lignes complètes
 * au fur et à mesure, sans jamais garder le fichier entier en mémoire.
 */
export function createCsvParser(delimiter = ',') {
  let field = ''
  let row = []
  let inQuotes = false
  let quotePending = false // un guillemet vu dans un champ entre guillemets
  let fieldStarted = false

  const endField = () => {
    row.push(field)
    field = ''
    fieldStarted = false
  }

  return {
    push(text) {
      const rows = []
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (inQuotes) {
          if (quotePending) {
            quotePending = false
            if (ch === '"') { field += '"'; continue }
            inQuotes = false // le guillemet précédent fermait le champ
          } else {
            if (ch === '"') quotePending = true
            else field += ch
            continue
          }
        }
        if (ch === '"' && !fieldStarted) { inQuotes = true; fieldStarted = true }
        else if (ch === delimiter) endField()
        else if (ch === '\n') { endField(); rows.push(row); row = [] }
        else if (ch === '\r') { /* ignoré : géré par le \n suivant */ }
        else { field += ch; fieldStarted = true }
      }
      return rows
    },
    end() {
      if (field !== '' || row.length > 0 || fieldStarted) {
        endField()
        const last = row
        row = []
        return [last]
      }
      return []
    },
  }
}

/** Itère sur les lignes d'un flux CSV sous forme d'objets { colonne: valeur }. */
export async function* readCsv(stream, delimiter = ',') {
  const parser = createCsvParser(delimiter)
  const decoder = new TextDecoder('utf-8')
  let header = null
  const toObjects = function* (rows) {
    for (const cells of rows) {
      if (!header) {
        header = cells.map((c) => c.replace(/^﻿/, '').trim())
        continue
      }
      if (cells.length === 1 && cells[0] === '') continue
      const record = {}
      for (let i = 0; i < header.length; i++) record[header[i]] = cells[i] ?? ''
      yield record
    }
  }
  for await (const chunk of stream) {
    yield* toObjects(parser.push(decoder.decode(chunk, { stream: true })))
  }
  yield* toObjects(parser.push(decoder.decode()))
  yield* toObjects(parser.end())
}

// --- Normalisation -----------------------------------------------------------

/** Même règle que la synchro Merchant Center : 8 ou 12 à 14 chiffres. */
export function normalizeGtin(raw) {
  const v = String(raw ?? '').trim()
  return /^[0-9]{8}$|^[0-9]{12,14}$/.test(v) ? v : null
}

export function parsePrice(raw) {
  const v = String(raw ?? '').trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(v)) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function httpsUrl(raw) {
  const v = String(raw ?? '').trim()
  return /^https?:\/\/\S+$/i.test(v) ? v : null
}

/**
 * Catégorie telle que le catalogue la fournit : celle d'Awin, puis celle du
 * marchand, séparées par « | ». Sert à ranger le produit dans les rayons du site.
 */
export function sourceCategory(record) {
  const awin = String(record.category_name ?? '').trim()
  const merchant = String(record.merchant_category ?? '').trim()
  return [awin, merchant].filter(Boolean).join(' | ').slice(0, 300) || null
}

/**
 * Transforme une ligne de flux Awin en produit Lynq.
 * Renvoie `null` si l'offre n'est pas présentable : sans titre, sans lien
 * d'achat, sans image, sans prix, hors stock ou dans une autre devise.
 */
export function mapProduct(record, { merchantId, country, runId }) {
  // Certains marchands ajoutent une étiquette interne en fin de titre
  // (« Cable PS/2 5m #DEFAULT ») : on la retire.
  const title = String(record.product_name ?? '').trim().replace(/\s+#[A-Z0-9_]+$/, '').trim()
  const link = httpsUrl(record.aw_deep_link)
  const image = httpsUrl(record.merchant_image_url) ?? httpsUrl(record.aw_image_url)
  const price = parsePrice(record.search_price)
  const offerId = String(record.aw_product_id || record.merchant_product_id || '').trim()
  const currency = String(record.currency ?? '').trim().toUpperCase() || 'EUR'

  if (!title || !link || !image || !offerId) return null
  if (price === null || price <= 0) return null
  if (currency !== 'EUR') return null
  if (String(record.in_stock ?? '').trim() === '0') return null

  const description = String(record.description ?? '').trim()
  const category = sourceCategory(record)
  const rayon = mapCategory(category)
  return {
    merchant_id: merchantId,
    offer_id: offerId,
    title: title.slice(0, 300),
    description: description ? description.slice(0, DESCRIPTION_MAX) : null,
    link,
    image_link: image,
    price_value: price,
    price_currency: currency,
    availability: 'in stock',
    brand: String(record.brand_name ?? '').trim() || null,
    gtin: normalizeGtin(record.ean) ?? normalizeGtin(record.product_GTIN),
    mpn: String(record.mpn ?? '').trim() || null,
    source_category: category,
    google_product_category_id: rayon?.id ?? null,
    google_product_category_path: rayon?.path ?? null,
    shipping_price: parsePrice(record.delivery_cost),
    country_code: country,
    last_seen_at: runId,
  }
}

/** « 29.99 EUR », « 29,99 EUR » ou « 29.99 » → { value, currency }. */
function splitGooglePrice(raw) {
  const match = String(raw ?? '').trim().match(/^(\d+(?:[.,]\d+)?)\s*([A-Za-z]{3})?$/)
  return match ? { value: match[1].replace(',', '.'), currency: (match[2] ?? '').toUpperCase() } : null
}

/**
 * Frais de port au format Google : « FR:::4.90 EUR », plusieurs entrées
 * séparées par des virgules, ou simplement « 4.90 EUR ». On garde celle du
 * pays diffusé, à défaut celle sans pays.
 */
function googleShipping(raw, country) {
  let fallback = null
  for (const entry of String(raw ?? '').split(',')) {
    const parts = entry.split(':')
    const price = splitGooglePrice(parts[parts.length - 1])
    if (!price) continue
    const where = parts.length > 1 ? parts[0].trim().toUpperCase() : ''
    if (where === country) return price.value
    if (!where && fallback === null) fallback = price.value
  }
  return fallback ?? ''
}

/**
 * Ligne d'un flux Awin au format « Google » (colonnes Merchant Center) →
 * ligne au format Awin classique, pour réutiliser `mapProduct` tel quel.
 * `aw_deep_link` est le lien suivi par Awin : c'est lui qui rémunère le clic.
 */
export function googleToAwin(record, country = 'FR') {
  const regular = splitGooglePrice(record.price)
  const sale = splitGooglePrice(record.sale_price)
  const price = sale && Number(sale.value) > 0 && (!regular || Number(sale.value) < Number(regular.value)) ? sale : regular
  const availability = String(record.availability ?? '').trim().toLowerCase().replace(/_/g, ' ')
  return {
    aw_deep_link: record.aw_deep_link,
    merchant_deep_link: record.link,
    product_name: record.title,
    aw_product_id: record.id,
    merchant_product_id: record.id,
    merchant_image_url: record.image_link,
    description: record.description,
    search_price: price?.value ?? '',
    currency: price?.currency || 'EUR',
    delivery_cost: googleShipping(record.shipping, country),
    merchant_name: record.advertiser_name,
    merchant_id: record.advertiser_id,
    brand_name: record.brand,
    ean: record.gtin,
    mpn: record.mpn,
    in_stock: availability === 'out of stock' ? '0' : '1',
    category_name: record.google_product_category,
    merchant_category: record.product_type,
  }
}

/**
 * Lit tout un flux et garde au plus `max` offres. Les offres avec code-barres
 * passent en premier : ce sont les seules que Lynq peut comparer entre
 * marchands. Le reste complète jusqu'au plafond.
 */
export async function selectProducts(records, options, max) {
  const withGtin = []
  const withoutGtin = []
  const seen = new Set()
  let read = 0
  let rejected = 0
  let websiteUrl = null
  const awinCategories = new Map()
  const merchantCategories = new Map()
  const unmapped = new Map()
  const tally = (map, value) => {
    const key = String(value ?? '').trim() || '(vide)'
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  for await (const record of records) {
    read++
    tally(awinCategories, record.category_name)
    tally(merchantCategories, record.merchant_category)
    if (!mapCategory(sourceCategory(record))) tally(unmapped, sourceCategory(record))
    if (!websiteUrl) {
      const direct = httpsUrl(record.merchant_deep_link)
      if (direct) {
        try { websiteUrl = new URL(direct).origin + '/' } catch { /* lien illisible */ }
      }
    }
    const product = mapProduct(record, options)
    if (!product || seen.has(product.offer_id)) { rejected++; continue }
    seen.add(product.offer_id)
    if (product.gtin) { if (withGtin.length < max) withGtin.push(product) }
    else if (withoutGtin.length < max) withoutGtin.push(product)
  }

  const products = withGtin.concat(withoutGtin).slice(0, max)
  return { products, read, rejected, withGtin: products.filter((p) => p.gtin).length, websiteUrl, awinCategories, merchantCategories, unmapped,
    categorized: products.filter((p) => p.google_product_category_id).length }
}

// --- Awin --------------------------------------------------------------------

/** Annonceurs dont le programme est accepté, avec leurs flux en français. */
export function joinedAdvertisers(listRows) {
  const byAdvertiser = new Map()
  for (const row of listRows) {
    if (String(row['Membership Status'] ?? '').trim().toLowerCase() !== 'active') continue
    const id = Number(row['Advertiser ID'])
    // Identifiant numérique au format Awin, « F3201 » au format Google.
    const feedId = String(row['Feed ID'] ?? '').trim()
    if (!Number.isInteger(id) || !feedId) continue
    const language = String(row['Language'] ?? '').trim().toLowerCase()
    const entry = byAdvertiser.get(id) ?? {
      id,
      name: String(row['Advertiser Name'] ?? '').trim(),
      region: String(row['Primary Region'] ?? '').trim().toUpperCase(),
      feeds: [],
    }
    entry.feeds.push({
      id: feedId,
      language,
      products: Number(row['No of products']) || 0,
      // « Awin » (colonnes aw_*) ou « Google » (nouveau format des annonceurs).
      format: String(row['Datafeed Format'] ?? 'Awin').trim(),
      url: String(row['URL'] ?? '').trim(),
    })
    byAdvertiser.set(id, entry)
  }
  for (const entry of byAdvertiser.values()) {
    // Un annonceur a parfois un flux par langue : on préfère le français.
    const french = entry.feeds.filter((f) => f.language.startsWith('fr'))
    entry.feeds = (french.length ? french : entry.feeds).sort((a, b) => b.products - a.products)
  }
  return [...byAdvertiser.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// Langue attendue des flux pour chaque pays diffusé.
const COUNTRY_LANGUAGES = { FR: 'fr', PL: 'pl' }

/**
 * Programmes diffusables dans un pays : ceux de ce pays, ou ceux d'ailleurs
 * qui publient un flux dans sa langue. Une boutique slovaque ou allemande sans
 * flux français n'a rien à faire sur le site français.
 */
export function inCountry(advertisers, country) {
  const language = COUNTRY_LANGUAGES[country]
  return advertisers.filter((a) => a.region === country || (language && a.feeds.some((f) => f.language.startsWith(language))))
}

/**
 * Adresse de téléchargement d'un flux. La liste Awin fournit une adresse qui
 * contient déjà « /columns/<liste par défaut>/ » : on y substitue nos colonnes.
 */
export function feedDownloadUrl(feed) {
  const pattern = /\/columns\/[^/]*(\/|$)/
  if (!/^https:\/\//.test(feed.url) || !pattern.test(feed.url)) {
    throw new Error(`adresse de flux inattendue pour le flux ${feed.id}`)
  }
  return feed.url.replace(pattern, `/columns/${FEED_COLUMNS.join(',')}/`)
}

async function openList(env) {
  if (env.AWIN_LIST_FILE) return Readable.from([await readFile(env.AWIN_LIST_FILE)])
  const res = await fetch(env.AWIN_FEED_LIST_URL)
  if (!res.ok) throw new Error(`Liste des flux Awin : HTTP ${res.status}`)
  return Readable.fromWeb(res.body)
}

/** Lignes de tous les flux d'un annonceur, l'un après l'autre. */
async function* readAdvertiserFeeds(env, advertiser, country = 'FR') {
  if (env.AWIN_FEED_DIR) {
    yield* readCsv(createReadStream(path.join(env.AWIN_FEED_DIR, `${advertiser.id}.csv.gz`)).pipe(createGunzip()))
    return
  }
  // Format Awin classique de préférence ; sinon le format « Google ».
  const awin = advertiser.feeds.filter((feed) => feed.format.toLowerCase() !== 'google')
  const google = advertiser.feeds.filter((feed) => feed.format.toLowerCase() === 'google')
  if (awin.length > 0) {
    for (const feed of awin) {
      const res = await fetch(feedDownloadUrl(feed))
      if (!res.ok) throw new Error(`Flux Awin ${feed.id} : HTTP ${res.status}`)
      yield* readCsv(Readable.fromWeb(res.body).pipe(createGunzip()))
    }
    return
  }
  for (const feed of google) {
    if (!/^https:\/\//.test(feed.url)) throw new Error(`adresse de flux inattendue pour le flux ${feed.id}`)
    const res = await fetch(feed.url)
    if (!res.ok) throw new Error(`Flux Awin ${feed.id} : HTTP ${res.status}`)
    for await (const record of readCsv(Readable.fromWeb(res.body).pipe(createGunzip()))) yield googleToAwin(record, country)
  }
}

// --- Supabase ----------------------------------------------------------------

function supabase(env) {
  const base = env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1'
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
  return async function call(method, route, body, prefer) {
    const res = await fetch(base + route, {
      method,
      headers: prefer ? { ...headers, Prefer: prefer } : headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`Supabase ${method} ${route.split('?')[0]} : HTTP ${res.status} ${text.slice(0, 300)}`)
    return text ? JSON.parse(text) : null
  }
}

async function upsertMerchant(db, advertiser, websiteUrl, country) {
  const rows = await db('POST', '/merchants?on_conflict=awin_advertiser_id', [{
    awin_advertiser_id: advertiser.id,
    name: advertiser.name,
    website_url: websiteUrl,
    source: 'awin',
    country_code: country,
    country,
    // Hors du cron Merchant Center : ce marchand n'a pas de compte GMC.
    sync_paused: true,
  }], 'resolution=merge-duplicates,return=representation')
  return rows[0].id
}

// --- Import d'un annonceur ----------------------------------------------------

/**
 * Flux lisible mais sans rien d'exploitable (aucune offre valide, pas de
 * domaine) : le marchand est ignoré sans faire échouer l'import, qui ne passe
 * en échec que sur un vrai incident (téléchargement, base de données).
 */
class NothingToImport extends Error {}

async function importAdvertiser(env, db, advertiser, { runId, max, country, dryRun }) {
  const started = Date.now()
  // Le marchand doit exister avant ses produits. Son domaine vient du flux :
  // on lit d'abord avec un identifiant provisoire, puis on le fixe.
  const selection = await selectProducts(
    readAdvertiserFeeds(env, advertiser, country),
    { merchantId: 0, country, runId },
    max,
  )
  const { products, read, rejected, withGtin, websiteUrl } = selection
  if (env.AWIN_SHOW_CATEGORIES === '1') {
    const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
    console.log(`  Catégories Awin de ${advertiser.name} (${selection.awinCategories.size}) :`)
    for (const [name, count] of top(selection.awinCategories, 60)) console.log(`    ${count}\t${name}`)
    console.log(`  Catégories du marchand (${selection.merchantCategories.size}) :`)
    for (const [name, count] of top(selection.merchantCategories, 40)) console.log(`    ${count}\t${name}`)
    const missing = [...selection.unmapped.values()].reduce((a, b) => a + b, 0)
    console.log(`  Libellés sans rayon : ${missing} offre(s) sur ${read}, ${selection.unmapped.size} libellé(s) :`)
    for (const [name, count] of top(selection.unmapped, 60)) console.log(`    ${count}\t${name}`)
  }
  const summary = `${products.length} offres retenues sur ${read} lues (${withGtin} avec code-barres, ${selection.categorized} rangées dans un rayon, ${rejected} écartées)`

  if (!websiteUrl) throw new NothingToImport(`domaine du marchand introuvable dans le flux (${summary})`)
  if (products.length === 0) throw new NothingToImport(`aucune offre valide (${summary})`)
  if (dryRun) return { summary: `[essai] ${summary} — ${websiteUrl}`, count: products.length }

  const merchantId = await upsertMerchant(db, advertiser, websiteUrl, country)
  for (const product of products) product.merchant_id = merchantId

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    await db('POST', '/products?on_conflict=merchant_id,offer_id', products.slice(i, i + BATCH_SIZE),
      'resolution=merge-duplicates,return=minimal')
  }

  // Retire les offres absentes de ce passage. Ne s'exécute que si l'écriture
  // ci-dessus a réussi : un flux vide ou en erreur ne vide jamais un marchand.
  const stale = `merchant_id=eq.${merchantId}&or=(last_seen_at.is.null,last_seen_at.lt.${encodeURIComponent(`"${runId}"`)})`
  await db('DELETE', `/products?${stale}`, undefined, 'return=minimal')

  await db('PATCH', `/merchants?id=eq.${merchantId}`, {
    last_import_at: new Date().toISOString(),
    last_import_status: 'success',
    last_import_count: products.length,
    last_import_message: `Import Awin : ${summary}`,
  }, 'return=minimal')
  await db('POST', '/sync_logs', [{
    merchant_id: merchantId,
    product_count: products.length,
    status: 'success',
    duration_ms: Date.now() - started,
    message: `Import Awin : ${summary}`,
  }], 'return=minimal')

  return { summary, count: products.length }
}

// --- Programme principal ------------------------------------------------------

export async function main(env = process.env) {
  const dryRun = env.DRY_RUN === '1'
  const max = Number(env.AWIN_MAX_PRODUCTS) || 1000
  const country = (env.AWIN_COUNTRY || 'FR').toUpperCase()
  const runId = new Date().toISOString()

  if (!env.AWIN_FEED_LIST_URL && !env.AWIN_LIST_FILE) throw new Error('AWIN_FEED_LIST_URL manquant')
  if (!dryRun && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants')
  }
  const db = dryRun ? null : supabase(env)

  const listRows = []
  for await (const row of readCsv(await openList(env))) listRows.push(row)
  const joined = joinedAdvertisers(listRows)
  const advertisers = inCountry(joined, country)
  console.log(`${joined.length} annonceur(s) accepté(s) sur ${new Set(listRows.map((r) => r['Advertiser ID'])).size} dans la liste Awin, dont ${advertisers.length} diffusable(s) en ${country}.`)
  for (const a of joined.filter((x) => !advertisers.includes(x))) {
    console.log(`  HORS ${country}  ${a.name} (${a.id}) — programme ${a.region || '?'}, flux en ${a.feeds.map((f) => f.language || '?').join(', ')}`)
  }

  // Diagnostic : où en sont, dans la liste Awin, des annonceurs que l'on attend.
  for (const id of String(env.AWIN_WATCH_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const rows = listRows.filter((r) => String(r['Advertiser ID']).trim() === id)
    if (rows.length === 0) console.log(`  SUIVI ${id} — absent de la liste des flux Awin`)
    for (const r of rows) {
      console.log(`  SUIVI ${id} ${r['Advertiser Name']} — statut ${r['Membership Status']}, région ${r['Primary Region']}, langue ${r['Language']}, format ${r['Datafeed Format'] ?? '?'}, ${r['No of products']} produits`)
    }
  }

  let imported = 0
  let total = 0
  const failures = []
  const skipped = []
  for (const advertiser of advertisers) {
    try {
      const result = await importAdvertiser(env, db, advertiser, { runId, max, country, dryRun })
      console.log(`  OK  ${advertiser.name} (${advertiser.id}) — ${result.summary}`)
      imported++
      total += result.count
    } catch (error) {
      // Un flux en erreur n'arrête pas les autres marchands.
      const message = error instanceof Error ? error.message : String(error)
      if (error instanceof NothingToImport) {
        console.log(`  IGNORÉ ${advertiser.name} (${advertiser.id}) — ${message}`)
        skipped.push(advertiser.name)
        continue
      }
      console.log(`  ÉCHEC ${advertiser.name} (${advertiser.id}) — ${message}`)
      failures.push(advertiser.name)
    }
  }

  // Les marchands Awin qui ne sont plus diffusables (programme quitté, ou
  // hors du pays) perdent leurs offres. Seulement si la liste a été lue
  // correctement, pour ne jamais vider le site sur une liste vide.
  let purged = 0
  if (!dryRun && advertisers.length > 0) {
    const keep = new Set(advertisers.map((a) => a.id))
    const merchants = (await db('GET', '/merchants?select=id,name,awin_advertiser_id&source=eq.awin')) ?? []
    for (const m of merchants) {
      if (keep.has(Number(m.awin_advertiser_id))) continue
      await db('DELETE', `/products?merchant_id=eq.${m.id}`, undefined, 'return=minimal')
      console.log(`  RETIRÉ ${m.name} (${m.awin_advertiser_id}) — offres supprimées du site`)
      purged++
    }
  }

  if (!dryRun && (imported > 0 || purged > 0)) {
    await db('POST', '/rpc/refresh_product_groups', {})
    console.log('Vue de comparaison rafraîchie.')
  }
  console.log(`Terminé : ${imported} marchand(s), ${total} offre(s), ${skipped.length} ignoré(s), ${failures.length} échec(s).`)
  return { advertisers: advertisers.length, imported, total, failures, skipped }
}

const invokedDirectly = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  main().then(
    (result) => { if (result.failures.length > 0) process.exitCode = 1 },
    (error) => { console.error(`Erreur : ${error instanceof Error ? error.message : error}`); process.exitCode = 1 },
  )
}
