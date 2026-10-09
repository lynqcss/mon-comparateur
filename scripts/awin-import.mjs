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

// Colonnes demandées à Awin. L'ordre n'a pas d'importance : on lit l'en-tête.
export const FEED_COLUMNS = [
  'aw_deep_link', 'product_name', 'aw_product_id', 'merchant_product_id',
  'merchant_image_url', 'aw_image_url', 'description', 'search_price',
  'currency', 'delivery_cost', 'merchant_name', 'merchant_id',
  'merchant_deep_link', 'brand_name', 'ean', 'product_GTIN', 'mpn', 'in_stock',
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
    shipping_price: parsePrice(record.delivery_cost),
    country_code: country,
    last_seen_at: runId,
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

  for await (const record of records) {
    read++
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
  return { products, read, rejected, withGtin: products.filter((p) => p.gtin).length, websiteUrl }
}

// --- Awin --------------------------------------------------------------------

/** Annonceurs dont le programme est accepté, avec leurs flux en français. */
export function joinedAdvertisers(listRows) {
  const byAdvertiser = new Map()
  for (const row of listRows) {
    if (String(row['Membership Status'] ?? '').trim().toLowerCase() !== 'active') continue
    const id = Number(row['Advertiser ID'])
    const feedId = Number(row['Feed ID'])
    if (!Number.isInteger(id) || !Number.isInteger(feedId)) continue
    const language = String(row['Language'] ?? '').trim().toLowerCase()
    const entry = byAdvertiser.get(id) ?? { id, name: String(row['Advertiser Name'] ?? '').trim(), feeds: [] }
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
async function* readAdvertiserFeeds(env, advertiser) {
  if (env.AWIN_FEED_DIR) {
    yield* readCsv(createReadStream(path.join(env.AWIN_FEED_DIR, `${advertiser.id}.csv.gz`)).pipe(createGunzip()))
    return
  }
  const feeds = advertiser.feeds.filter((feed) => feed.format.toLowerCase() === 'awin')
  if (feeds.length === 0) {
    throw new Error('flux au format « Google » uniquement : ce format n’est pas encore pris en charge')
  }
  for (const feed of feeds) {
    const res = await fetch(feedDownloadUrl(feed))
    if (!res.ok) throw new Error(`Flux Awin ${feed.id} : HTTP ${res.status}`)
    yield* readCsv(Readable.fromWeb(res.body).pipe(createGunzip()))
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

async function importAdvertiser(env, db, advertiser, { runId, max, country, dryRun }) {
  const started = Date.now()
  // Le marchand doit exister avant ses produits. Son domaine vient du flux :
  // on lit d'abord avec un identifiant provisoire, puis on le fixe.
  const selection = await selectProducts(
    readAdvertiserFeeds(env, advertiser),
    { merchantId: 0, country, runId },
    max,
  )
  const { products, read, rejected, withGtin, websiteUrl } = selection
  const summary = `${products.length} offres retenues sur ${read} lues (${withGtin} avec code-barres, ${rejected} écartées)`

  if (!websiteUrl) throw new Error(`domaine du marchand introuvable dans le flux (${summary})`)
  if (products.length === 0) throw new Error(`aucune offre valide (${summary})`)
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
  const advertisers = joinedAdvertisers(listRows)
  console.log(`${advertisers.length} annonceur(s) accepté(s) sur ${new Set(listRows.map((r) => r['Advertiser ID'])).size} dans la liste Awin.`)

  let imported = 0
  let total = 0
  const failures = []
  for (const advertiser of advertisers) {
    try {
      const result = await importAdvertiser(env, db, advertiser, { runId, max, country, dryRun })
      console.log(`  OK  ${advertiser.name} (${advertiser.id}) — ${result.summary}`)
      imported++
      total += result.count
    } catch (error) {
      // Un flux en erreur n'arrête pas les autres marchands.
      const message = error instanceof Error ? error.message : String(error)
      console.log(`  ÉCHEC ${advertiser.name} (${advertiser.id}) — ${message}`)
      failures.push(advertiser.name)
    }
  }

  if (!dryRun && imported > 0) {
    await db('POST', '/rpc/refresh_product_groups', {})
    console.log('Vue de comparaison rafraîchie.')
  }
  console.log(`Terminé : ${imported} marchand(s), ${total} offre(s), ${failures.length} échec(s).`)
  return { advertisers: advertisers.length, imported, total, failures }
}

const invokedDirectly = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  main().then(
    (result) => { if (result.failures.length > 0) process.exitCode = 1 },
    (error) => { console.error(`Erreur : ${error instanceof Error ? error.message : error}`); process.exitCode = 1 },
  )
}
