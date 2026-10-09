import AdminNav from './AdminNav'

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
