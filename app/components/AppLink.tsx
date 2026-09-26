import NextLink from 'next/link'
import type { ComponentProps } from 'react'

type AppLinkProps = ComponentProps<typeof NextLink>

/**
 * Wrapper de `next/link` avec le prefetch DÉSACTIVÉ par défaut.
 *
 * Pourquoi : Next.js préfetche chaque <Link> visible dans le viewport. Sur des
 * pages dynamiques (rendues à la demande), chaque prefetch = une invocation
 * serverless + ses requêtes Supabase. La sidebar de /products contient jusqu'à
 * ~100 liens de marques : une seule visite déclenchait ~100 rendus complets,
 * ce qui a fait exploser les quotas Vercel (edge requests, CPU, invocations,
 * origin transfer) et mis le site hors ligne.
 *
 * Le prefetch reste surchargeable au cas par cas : <AppLink prefetch />.
 */
export default function AppLink({ prefetch = false, ...props }: AppLinkProps) {
  return <NextLink prefetch={prefetch} {...props} />
}
