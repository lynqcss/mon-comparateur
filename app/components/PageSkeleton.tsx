/**
 * Écran affiché immédiatement au clic, le temps que la page demandée arrive :
 * sans lui, la navigation semble ne pas réagir.
 */
function Bar({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800 ${className}`} />
}

export function ProductsSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-950" aria-busy="true" aria-live="polite">
            <span className="sr-only">Chargement…</span>
            <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
                <Bar className="h-3 w-24" />
                <Bar className="mt-4 h-9 w-64" />
                <div className="mt-10 grid gap-10 lg:grid-cols-[250px_1fr]">
                    <div className="hidden space-y-3 lg:block">
                        {Array.from({ length: 8 }, (_, i) => (
                            <Bar key={i} className="h-8 w-full rounded-xl" />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }, (_, i) => (
                            <div key={i} className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="aspect-square animate-pulse bg-zinc-50 dark:bg-zinc-900" />
                                <div className="space-y-2 p-4">
                                    <Bar className="h-2.5 w-16" />
                                    <Bar className="h-3.5 w-full" />
                                    <Bar className="h-4 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MerchantsSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-950" aria-busy="true" aria-live="polite">
            <span className="sr-only">Chargement…</span>
            <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-3xl flex-col items-center">
                    <Bar className="h-3 w-24" />
                    <Bar className="mt-5 h-10 w-80 max-w-full" />
                    <Bar className="mt-5 h-4 w-96 max-w-full" />
                </div>
                <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="rounded-3xl border border-zinc-100 p-6 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                                <div className="flex-1 space-y-2">
                                    <Bar className="h-3.5 w-3/4" />
                                    <Bar className="h-3 w-1/2" />
                                </div>
                            </div>
                            <Bar className="mt-5 h-10 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
