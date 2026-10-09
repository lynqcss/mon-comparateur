import type { Metadata } from 'next'
import Link from '@/app/components/AppLink'

export const metadata: Metadata = {
    title: 'Administration — Lynq',
    robots: { index: false, follow: false },
}

type Module = {
    title: string
    description: string
    /** Absent tant que le module n'existe pas : la carte est alors inactive. */
    href?: string
    icon: string
}

const ACTIVE: Module[] = [
    {
        title: 'Marchands',
        description: 'Ajouter un marchand, lancer ou mettre en pause la synchronisation de son catalogue.',
        href: '/admin/merchants',
        icon: 'M3 9l1.5-5h15L21 9M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M9 20v-6h6v6',
    },
    {
        title: 'Inscriptions',
        description: 'Suivre les demandes des marchands qui ont connecté leur compte Google Merchant Center.',
        href: '/admin/onboarding',
        icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6',
    },
]

// Modules prévus, pas encore développés : on cadre chacun avant de l'écrire.
const UPCOMING: Module[] = [
    {
        title: 'Alertes',
        description: 'Surveillance des flux produits des clients et alerte en cas d’anomalie.',
        icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0',
    },
    {
        title: 'Pilotage',
        description: 'Tableau de bord par client et envoi de rapports de performance.',
        icon: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3',
    },
    {
        title: 'Newsletter',
        description: 'Rédaction et envoi de la newsletter aux clients.',
        icon: 'M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
]

function Icon({ path }: { path: string }) {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
        </svg>
    )
}

export default function AdminHomePage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Espace privé</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Administration</h1>
            <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
                Le point d’entrée pour gérer les marchands de Lynq et, bientôt, le suivi de vos clients.
            </p>

            <h2 className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Disponible</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {ACTIVE.map((module) => (
                    <Link
                        key={module.title}
                        href={module.href!}
                        className="group flex gap-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-transform group-hover:scale-105 dark:bg-white dark:text-zinc-900">
                            <Icon path={module.icon} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-base font-bold text-zinc-900 dark:text-white">{module.title}</span>
                            <span className="mt-1 block text-sm leading-6 text-zinc-600 dark:text-zinc-400">{module.description}</span>
                        </span>
                    </Link>
                ))}
            </div>

            <h2 className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">À venir</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {UPCOMING.map((module) => (
                    <div
                        key={module.title}
                        className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/40"
                    >
                        <div className="flex items-center justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-400 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                                <Icon path={module.icon} />
                            </span>
                            <span className="rounded-full bg-zinc-200/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                Bientôt
                            </span>
                        </div>
                        <p className="mt-5 text-base font-bold text-zinc-500 dark:text-zinc-400">{module.title}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-500">{module.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
