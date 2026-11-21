import { assertToolOpen } from '@/lib/admin/toolGuard'

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
    assertToolOpen('alerts')
    return children
}
