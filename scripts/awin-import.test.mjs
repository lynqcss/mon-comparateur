// Tests de l'import Awin : `node --test scripts/`
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { test } from 'node:test'
import { gzipSync } from 'node:zlib'

import {
  FEED_COLUMNS, createCsvParser, feedDownloadUrl, joinedAdvertisers, main, mapProduct, normalizeGtin, parsePrice, readCsv, selectProducts,
} from './awin-import.mjs'

const csvLine = (cells) => cells.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')

function feedCsv(rows) {
  return [FEED_COLUMNS.join(','), ...rows.map((r) => csvLine(FEED_COLUMNS.map((c) => String(r[c] ?? ''))))].join('\r\n') + '\r\n'
}

const offer = (overrides = {}) => ({
  aw_deep_link: 'https://www.awin1.com/pclick.php?p=1&a=3117532&m=100',
  product_name: 'Casque audio',
  aw_product_id: '9001',
  merchant_product_id: 'SKU-1',
  merchant_image_url: 'https://cdn.exemple.fr/casque.jpg',
  description: 'Un casque.',
  search_price: '49.90',
  currency: 'EUR',
  delivery_cost: '4.99',
  merchant_name: 'Boutique Exemple',
  merchant_id: '100',
  merchant_deep_link: 'https://www.exemple.fr/casque',
  brand_name: 'Sonora',
  ean: '3760123456789',
  in_stock: '1',
  ...overrides,
})

test('CSV : guillemets, virgules et retours à la ligne dans un champ, découpage arbitraire', () => {
  const text = 'a,b,c\r\n1,"x, ""y""\nz",3\r\n4,,6'
  for (const size of [1, 2, 5, 100]) {
    const parser = createCsvParser()
    const rows = []
    for (let i = 0; i < text.length; i += size) rows.push(...parser.push(text.slice(i, i + size)))
    rows.push(...parser.end())
    assert.deepEqual(rows, [['a', 'b', 'c'], ['1', 'x, "y"\nz', '3'], ['4', '', '6']], `morceaux de ${size}`)
  }
})

test('CSV : lecture en objets, BOM ignoré', async () => {
  const records = []
  for await (const r of readCsv(Readable.from([Buffer.from('﻿nom,prix\r\nA,1\r\nB,2\r\n')]))) records.push(r)
  assert.deepEqual(records, [{ nom: 'A', prix: '1' }, { nom: 'B', prix: '2' }])
})

test('normalisation des codes-barres et des prix', () => {
  assert.equal(normalizeGtin(' 3760123456789 '), '3760123456789')
  assert.equal(normalizeGtin('12345'), null)
  assert.equal(normalizeGtin('ABC0123456789'), null)
  assert.equal(parsePrice('49,90'), 49.9)
  assert.equal(parsePrice(''), null)
  assert.equal(parsePrice('gratuit'), null)
})

test('une offre valide est convertie, les offres non présentables sont écartées', () => {
  const ctx = { merchantId: 7, country: 'FR', runId: '2026-10-09T00:00:00.000Z' }
  const product = mapProduct(offer(), ctx)
  assert.equal(product.merchant_id, 7)
  assert.equal(product.offer_id, '9001')
  assert.equal(product.price_value, 49.9)
  assert.equal(product.shipping_price, 4.99)
  assert.equal(product.gtin, '3760123456789')
  assert.equal(product.link, 'https://www.awin1.com/pclick.php?p=1&a=3117532&m=100')
  assert.equal(product.last_seen_at, ctx.runId)

  assert.equal(mapProduct(offer({ in_stock: '0' }), ctx), null, 'hors stock')
  assert.equal(mapProduct(offer({ search_price: '0' }), ctx), null, 'prix nul')
  assert.equal(mapProduct(offer({ currency: 'GBP' }), ctx), null, 'autre devise')
  assert.equal(mapProduct(offer({ aw_deep_link: '' }), ctx), null, 'sans lien')
  assert.equal(mapProduct(offer({ merchant_image_url: '', aw_image_url: '' }), ctx), null, 'sans image')
  assert.equal(mapProduct(offer({ product_name: ' ' }), ctx), null, 'sans titre')
  assert.equal(mapProduct(offer({ ean: 'x', product_GTIN: '4006381333931' }), ctx).gtin, '4006381333931')
})

test('sélection : plafond respecté, codes-barres en premier, doublons écartés', async () => {
  const rows = [
    offer({ aw_product_id: '1', ean: '' }),
    offer({ aw_product_id: '2', ean: '' }),
    offer({ aw_product_id: '3' }),
    offer({ aw_product_id: '3' }),
    offer({ aw_product_id: '4' }),
    offer({ aw_product_id: '5', in_stock: '0' }),
  ]
  async function* gen() { yield* rows }
  const result = await selectProducts(gen(), { merchantId: 1, country: 'FR', runId: 'r' }, 3)
  assert.deepEqual(result.products.map((p) => p.offer_id), ['3', '4', '1'])
  assert.equal(result.read, 6)
  assert.equal(result.rejected, 2)
  assert.equal(result.withGtin, 2)
  assert.equal(result.websiteUrl, 'https://www.exemple.fr/')
})

test('liste Awin : seuls les programmes acceptés, flux français préféré', () => {
  const rows = [
    { 'Advertiser ID': '100', 'Advertiser Name': 'Boutique Exemple', 'Membership Status': 'active', 'Feed ID': '11', Language: 'English', 'No of products': '900' },
    { 'Advertiser ID': '100', 'Advertiser Name': 'Boutique Exemple', 'Membership Status': 'active', 'Feed ID': '12', Language: 'French', 'No of products': '500' },
    { 'Advertiser ID': '200', 'Advertiser Name': 'En attente', 'Membership Status': 'pending', 'Feed ID': '21', Language: 'French', 'No of products': '50' },
    { 'Advertiser ID': '300', 'Advertiser Name': 'Autre', 'Membership Status': 'Active', 'Feed ID': '31', Language: 'German', 'No of products': '70' },
  ]
  const result = joinedAdvertisers(rows)
  assert.deepEqual(result.map((a) => a.id), [300, 100])
  assert.deepEqual(result.find((a) => a.id === 100).feeds.map((f) => f.id), [12])
  assert.deepEqual(result.find((a) => a.id === 300).feeds.map((f) => f.id), [31])
})

test('liste Awin réelle : statut, format et adresse de téléchargement', () => {
  const url = 'https://productdata.awin.com/datafeed/download/apikey/KEY/fid/115782/format/csv/language/fr/delimiter/%2C/compression/gzip/columns/'
  const rows = [
    { 'Advertiser ID': '126615', 'Advertiser Name': '1foDiscount', 'Membership Status': 'active', 'Datafeed Format': 'Awin', 'Feed ID': '115782', Language: 'French', 'No of products': '10271', URL: url },
    { 'Advertiser ID': '5', 'Advertiser Name': 'Autre', 'Membership Status': 'Not Joined', 'Datafeed Format': 'Google', 'Feed ID': '9', Language: 'French', 'No of products': '3', URL: url },
  ]
  const [advertiser] = joinedAdvertisers(rows)
  assert.equal(advertiser.name, '1foDiscount')
  assert.equal(advertiser.feeds[0].format, 'Awin')
  const download = feedDownloadUrl(advertiser.feeds[0])
  assert.ok(download.startsWith(url + 'aw_deep_link,product_name,'))
  assert.ok(download.endsWith(',in_stock/'))
  assert.throws(() => feedDownloadUrl({ id: 1, url: 'https://exemple.fr/flux.csv' }), /inattendue/)
})

test('import complet contre un faux Supabase : marchand, offres, purge, rafraîchissement', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'awin-'))
  await writeFile(path.join(dir, 'list.csv'),
    'Advertiser ID,Advertiser Name,Primary Region,Membership Status,Feed ID,Feed Name,Language,Vertical,Last Imported,Last Checked,No of products,URL\r\n' +
    '100,Boutique Exemple,FR,active,12,Flux,French,Retail,,,3,\r\n' +
    '200,Vide,FR,active,22,Flux,French,Retail,,,0,\r\n')
  await writeFile(path.join(dir, '100.csv.gz'), gzipSync(feedCsv([
    offer({ aw_product_id: '1' }), offer({ aw_product_id: '2', ean: '' }), offer({ aw_product_id: '3', in_stock: '0' }),
  ])))
  await writeFile(path.join(dir, '200.csv.gz'), gzipSync(feedCsv([])))

  const calls = []
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      calls.push({ method: req.method, url: decodeURIComponent(req.url), prefer: req.headers.prefer, body: body ? JSON.parse(body) : null })
      res.setHeader('Content-Type', 'application/json')
      if (req.method === 'POST' && req.url.startsWith('/rest/v1/merchants')) res.end(JSON.stringify([{ id: 42 }]))
      else res.end('')
    })
  })
  await new Promise((resolve) => server.listen(0, resolve))
  const env = {
    AWIN_LIST_FILE: path.join(dir, 'list.csv'), AWIN_FEED_DIR: dir,
    SUPABASE_URL: `http://127.0.0.1:${server.address().port}`, SUPABASE_SERVICE_ROLE_KEY: 'test',
  }
  let result
  try { result = await main(env) } finally { server.close() }

  assert.equal(result.imported, 1)
  assert.equal(result.total, 2)
  assert.deepEqual(result.failures, ['Vide'], 'un flux vide est signalé et ne supprime rien')

  const merchant = calls.find((c) => c.url.startsWith('/rest/v1/merchants?on_conflict'))
  assert.equal(merchant.body[0].awin_advertiser_id, 100)
  assert.equal(merchant.body[0].source, 'awin')
  assert.equal(merchant.body[0].website_url, 'https://www.exemple.fr/')

  const upsert = calls.find((c) => c.url.startsWith('/rest/v1/products?on_conflict=merchant_id,offer_id'))
  assert.deepEqual(upsert.body.map((p) => [p.merchant_id, p.offer_id]), [[42, '1'], [42, '2']])
  assert.match(upsert.prefer, /merge-duplicates/)

  const deletes = calls.filter((c) => c.method === 'DELETE')
  assert.equal(deletes.length, 1, 'une seule purge : celle du marchand importé')
  assert.match(deletes[0].url, /^\/rest\/v1\/products\?merchant_id=eq\.42&or=\(last_seen_at\.is\.null,last_seen_at\.lt\."\d{4}-/)

  const order = calls.map((c) => `${c.method} ${c.url.split('?')[0]}`)
  assert.deepEqual(order, [
    'POST /rest/v1/merchants', 'POST /rest/v1/products', 'DELETE /rest/v1/products',
    'PATCH /rest/v1/merchants', 'POST /rest/v1/sync_logs', 'POST /rest/v1/rpc/refresh_product_groups',
  ])
})

test('mode essai : rien n\'est écrit', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'awin-'))
  await writeFile(path.join(dir, 'list.csv'),
    'Advertiser ID,Advertiser Name,Membership Status,Feed ID,Language,No of products\r\n100,Boutique Exemple,active,12,French,1\r\n')
  await writeFile(path.join(dir, '100.csv.gz'), gzipSync(feedCsv([offer()])))
  const result = await main({ AWIN_LIST_FILE: path.join(dir, 'list.csv'), AWIN_FEED_DIR: dir, DRY_RUN: '1' })
  assert.equal(result.imported, 1)
  assert.equal(result.total, 1)
})
