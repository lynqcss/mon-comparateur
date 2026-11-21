import { notFound } from 'next/navigation'
import { isToolOpen, type ToolId } from './tools'

/** First line of each tool's `layout.tsx`: answers 404 while the tool is not open. */
export function assertToolOpen(id: ToolId): void {
    if (!isToolOpen(id)) notFound()
}
