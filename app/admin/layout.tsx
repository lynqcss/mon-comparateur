import type { Metadata } from 'next'
import AdminNav from './AdminNav'

// Aucune page d'administration ne doit être indexée.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen md:flex">
            <AdminNav />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    )
}
