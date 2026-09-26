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

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/:path(products|merchants|join|legal|privacy|cookies|terms)",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/product/:path*",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
      {
        source: "/category/:path*",
        headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE }],
      },
    ];
  },
};

export default nextConfig;
