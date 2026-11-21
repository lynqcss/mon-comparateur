import { getTool, type ToolId } from '@/lib/admin/tools'

/** Temporary page of a tool under construction (reachable in local development only). */
export default function ToolPlaceholder({ id }: { id: ToolId }) {
    const tool = getTool(id)
    return (
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">{tool.title}</h1>
        </div>
    )
}
