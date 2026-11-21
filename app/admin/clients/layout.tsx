import { assertToolOpen } from '@/lib/admin/toolGuard'

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
    assertToolOpen('clients')
    return children
}
