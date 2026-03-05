import { google } from 'googleapis'
import path from 'path'

export function getGoogleMerchantClient() {
  const keyFile = path.join(process.cwd(), 'config', 'service-account.json')

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/content'],
  })

  return google.content({
    version: 'v2.1',
    auth,
  })
}
