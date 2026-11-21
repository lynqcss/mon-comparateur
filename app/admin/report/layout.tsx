import { assertToolOpen } from '@/lib/admin/toolGuard'

export default function ReportLayout({ children }: { children: React.ReactNode }) {
    assertToolOpen('report')
    return children
}
