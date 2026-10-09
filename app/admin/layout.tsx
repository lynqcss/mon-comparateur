import AdminNav from './AdminNav'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen">
            <AdminNav />
            {children}
        </div>
    )
}
