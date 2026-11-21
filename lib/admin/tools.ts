// ============================================================================
// Single source of truth for the admin tools: the home cards, the side menu
// and the access locks all read this list.
//
// A tool ships as `soon` and is switched to `active` (a reviewed code change,
// never a button) once it has been tested. In production, the pages and API
// routes of a `soon` tool answer 404, so an unfinished tool can never send an
// email by accident. In local development they stay open for testing.
// ============================================================================

export type ToolId = 'alerts' | 'clients' | 'report' | 'newsletter'
export type ToolStatus = 'soon' | 'active'

export type AdminTool = {
    id: ToolId
    title: string
    /** Label used in the side menu. */
    menuLabel: string
    href: string
    /** SVG path (24×24, stroke). */
    icon: string
    status: ToolStatus
}

export const ICONS = {
    home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    bell: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0',
    users: 'M17 20h5v-2a3 3 0 00-5.4-1.8M17 20H7m10 0v-2c0-.7-.1-1.3-.4-1.8M7 20H2v-2a3 3 0 015.4-1.8M7 20v-2c0-.7.1-1.3.4-1.8m0 0a5 5 0 019.2 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    chart: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3',
    newsletter: 'M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    store: 'M3 9l1.5-5h15L21 9M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M9 20v-6h6v6',
    inbox: 'M4 5h16v14H4zM4 7l8 6 8-6',
} as const

/** CSS tools, in display order. The first one is the main card of the home page. */
export const CSS_TOOLS: readonly AdminTool[] = [
    { id: 'alerts', title: 'Alertes & Surveillance', menuLabel: 'Alertes', href: '/admin/alerts', icon: ICONS.bell, status: 'soon' },
    { id: 'clients', title: 'Fiches clients', menuLabel: 'Fiches clients', href: '/admin/clients', icon: ICONS.users, status: 'soon' },
    { id: 'report', title: 'Rapport de performance', menuLabel: 'Rapport', href: '/admin/report', icon: ICONS.chart, status: 'soon' },
    { id: 'newsletter', title: 'Newsletter', menuLabel: 'Newsletter', href: '/admin/newsletter', icon: ICONS.newsletter, status: 'soon' },
]

/** Lynq catalogue pages (comparison site), always available. */
export const CATALOG_LINKS = [
    { href: '/admin/merchants', label: 'Marchands', icon: ICONS.store },
    { href: '/admin/leads', label: 'Demandes', icon: ICONS.inbox },
] as const

export function getTool(id: ToolId): AdminTool {
    const tool = CSS_TOOLS.find((t) => t.id === id)
    if (!tool) throw new Error(`Unknown admin tool: ${id}`)
    return tool
}

/**
 * Whether a tool can be reached: always when `active`, and only outside
 * production when `soon`.
 */
export function isToolOpen(id: ToolId, nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
    return getTool(id).status === 'active' || nodeEnv !== 'production'
}
