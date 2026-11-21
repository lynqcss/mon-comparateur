import { assertToolOpen } from '@/lib/admin/toolGuard'

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
    assertToolOpen('newsletter')
    return children
}
