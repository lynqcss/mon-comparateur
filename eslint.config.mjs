import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Interdit l'import direct de `next/link`.
    //
    // Next préfetche chaque <Link> visible dans le viewport. Sur des pages
    // rendues dynamiquement, chaque prefetch = une invocation serverless.
    // La sidebar de /products compte ~122 liens : une visite déclenchait
    // autant de rendus complets. Ce défaut a mis le site hors ligne deux
    // fois (mars et septembre 2026) parce qu'on corrigeait lien par lien.
    // Le wrapper AppLink inverse le défaut ; cette règle empêche de le
    // contourner par inadvertance dans un futur fichier.
    files: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: ["app/components/AppLink.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/link",
              message:
                "Importe `@/app/components/AppLink` : il désactive le prefetch par défaut (le prefetch a fait dépasser les quotas Vercel deux fois). Besoin du prefetch sur un lien précis : <AppLink prefetch />.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
