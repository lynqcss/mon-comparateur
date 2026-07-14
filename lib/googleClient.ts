import { google } from 'googleapis'
import path from 'path'

// ============================================================================
// Client Merchant API v1 (remplace la Content API for Shopping v2.1, coupée
// par Google le 18 août 2026).
//
// On utilise l'API REST `merchantapi.googleapis.com` via un simple `fetch`
// authentifié par un access token du compte de service, plutôt que les libs
// gRPC officielles (@google-shopping/*) : bundle plus léger pour Vercel Hobby.
//
// Auth : compte de service, identifiants via GOOGLE_SERVICE_ACCOUNT_JSON en
// production (Vercel) ; fallback fichier config/service-account.json en local.
// Le scope Content reste valide pour la Merchant API.
// ============================================================================

const MERCHANT_API_BASE = 'https://merchantapi.googleapis.com'
const MERCHANT_API_SCOPE = 'https://www.googleapis.com/auth/content'

// GoogleAuth mis en cache au niveau du module (réutilisé entre invocations
// chaudes ; il met lui-même l'access token en cache jusqu'à expiration).
let cachedAuth: InstanceType<typeof google.auth.GoogleAuth> | null = null

function getAuth() {
  if (cachedAuth) return cachedAuth

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  cachedAuth = raw
    ? new google.auth.GoogleAuth({
        credentials: JSON.parse(raw),
        scopes: [MERCHANT_API_SCOPE],
      })
    : new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), 'config', 'service-account.json'),
        scopes: [MERCHANT_API_SCOPE],
      })

  return cachedAuth
}

/** Renvoie un access token valide pour le compte de service. */
export async function getMerchantAccessToken(): Promise<string> {
  const client = await getAuth().getClient()
  const { token } = await client.getAccessToken()
  if (!token) {
    throw new Error("Impossible d'obtenir un access token Google (compte de service)")
  }
  return token
}

// --- Types Merchant API (sous-ensemble utilisé pour la synchro produits) -----

export interface MerchantPrice {
  amountMicros?: string // int64 en micros (valeur * 1 000 000), sérialisé en string
  currencyCode?: string
}

export interface MerchantShipping {
  country?: string
  price?: MerchantPrice
}

export interface MerchantProductAttributes {
  title?: string
  description?: string
  link?: string
  imageLink?: string
  availability?: string
  price?: MerchantPrice
  salePrice?: MerchantPrice
  brand?: string
  gtins?: string[] // Merchant API : tableau (jusqu'à 10 GTIN)
  googleProductCategory?: string
  shipping?: MerchantShipping[]
  salePriceEffectiveDate?: { startTime?: string; endTime?: string } | string
}

export interface MerchantProduct {
  name?: string // format: accounts/{account}/products/{product}
  channel?: string
  offerId?: string
  contentLanguage?: string
  feedLabel?: string
  // /!\ Le conteneur d'attributs s'appelle bien `productAttributes` dans la
  // Merchant API v1 (et NON `attributes`, contrairement à la Content API v2.1).
  productAttributes?: MerchantProductAttributes
}

export interface ListProductsResponse {
  products?: MerchantProduct[]
  nextPageToken?: string
}

/**
 * Récupère UNE page de produits d'un compte GMC via la Merchant API.
 * pageSize max = 1000 (borné par Google).
 */
export async function listMerchantProductsPage(params: {
  accountId: number | string
  pageToken?: string | null
  pageSize?: number
}): Promise<ListProductsResponse> {
  const token = await getMerchantAccessToken()

  const url = new URL(
    `${MERCHANT_API_BASE}/products/v1/accounts/${params.accountId}/products`
  )
  url.searchParams.set('pageSize', String(Math.min(params.pageSize ?? 1000, 1000)))
  if (params.pageToken) url.searchParams.set('pageToken', params.pageToken)

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Merchant API products.list ${res.status}: ${body}`)
  }

  return (await res.json()) as ListProductsResponse
}
