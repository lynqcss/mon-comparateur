import type { NextConfig } from "next";

// Cache CDN des pages publiques.
//
// Par défaut, Next rend ces pages dynamiquement (elles lisent `searchParams`)
// et renvoie `Cache-Control: private, no-store` : CHAQUE requête — visiteur,
// crawler, prefetch — déclenche une invocation serverless et ses requêtes
// Supabase. C'est l'un des facteurs qui a fait dépasser les quotas Vercel.
//
// Le catalogue n'est synchronisé qu'une fois par jour (cron 4h), donc un cache
// partagé d'une heure est sans risque fonctionnel. `stale-while-revalidate`
// permet au CDN de servir instantanément une version légèrement périmée
// pendant qu'il rafraîchit en arrière-plan : une invocation au lieu de N.
//
// Volontairement NON cachés : /api/*, /admin/* (Basic Auth) et /onboarding/*.
const PUBLIC_PAGE_CACHE =
  "public, s-maxage=3600, stale-while-revalidate=86400";

// En production, Next réécrit le `Cache-Control` des pages dynamiques en
// `private, no-store` et écrase celui défini ici (constaté sur Vercel : toutes
// les pages sortaient en MISS). `CDN-Cache-Control` n'est pas touché par Next,
// est prioritaire pour le CDN de Vercel, puis est transmis tel quel à
// Cloudflare. Le navigateur, lui, continue de voir `no-store` : seul le cache
// partagé garde la page.
const PUBLIC_PAGE_HEADERS = [
  { key: "Cache-Control", value: PUBLIC_PAGE_CACHE },
  { key: "CDN-Cache-Control", value: PUBLIC_PAGE_CACHE },
];

// Ferme l'accès au site par l'URL `*.vercel.app`, qui contourne Cloudflare
// (et donc le filtrage des bots). Volontairement implémenté ici et non dans
// le middleware : une règle de `redirects()` est compilée dans la couche de
// routage de Vercel et traitée AVANT les fonctions, alors qu'un middleware
// s'exécuterait à chaque requête — y compris celles servies par le cache —
// et annulerait une partie du gain recherché.
//
// Désactivé tant que CANONICAL_HOST n'est pas défini, pour pouvoir tester un
// nouveau déploiement sur son URL .vercel.app. À définir (ex. lynq-css.com)
// une fois le domaine branché.
const CANONICAL_HOST = process.env.CANONICAL_HOST;

const nextConfig: NextConfig = {
  async redirects() {
    if (!CANONICAL_HOST) return [];
    return [
      {
        // /api est exclu : le cron Vercel et l'auto-enchaînement de la synchro
        // s'appellent sur l'hôte .vercel.app, ne suivent pas les redirections
        // et perdraient leur en-tête Authorization. Ces routes sont de toute
        // façon protégées par secret et ne sont pas explorées par les crawlers.
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        destination: `https://${CANONICAL_HOST}/:path`,
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/",
        headers: PUBLIC_PAGE_HEADERS,
      },
      {
        source: "/:path(products|merchants|join|legal|privacy|cookies|terms)",
        headers: PUBLIC_PAGE_HEADERS,
      },
      {
        source: "/product/:path*",
        headers: PUBLIC_PAGE_HEADERS,
      },
      {
        source: "/category/:path*",
        headers: PUBLIC_PAGE_HEADERS,
      },
    ];
  },
};

export default nextConfig;
