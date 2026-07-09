import { google } from 'googleapis'
import path from 'path'

export function getGoogleMerchantClient() {
  // Identifiants du compte de service Google (scope Content API).
  // En production (Vercel) : fournis via la variable d'environnement
  // GOOGLE_SERVICE_ACCOUNT_JSON, car le fichier config/service-account.json
  // est gitignored (secret) et n'est donc PAS deploye.
  // En local : on retombe sur le fichier s'il est present.
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  const auth = raw
    ? new google.auth.GoogleAuth({
        credentials: JSON.parse(raw),
        scopes: ['https://www.googleapis.com/auth/content'],
      })
    : new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), 'config', 'service-account.json'),
        scopes: ['https://www.googleapis.com/auth/content'],
      })

  return google.content({
    version: 'v2.1',
    auth,
  })
}
