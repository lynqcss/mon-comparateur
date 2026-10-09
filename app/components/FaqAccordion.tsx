'use client'

import { useId, useState } from 'react'

type FaqItem = { q: string; a: string }

/**
 * Espace insécable avant « ? ! : ; » : en français, ces signes ne doivent
 * jamais se retrouver seuls au début d'une ligne.
 */
const keepPunctuation = (text: string) => text.replace(/ ([?!:;»])/g, ' $1')

/** Liste de questions en une colonne ; une seule réponse ouverte à la fois. */
export default function FaqAccordion({ items }: { items: FaqItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0)
    const baseId = useId()

    return (
        <div className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {items.map((item, index) => {
                const open = openIndex === index
                const panelId = `${baseId}-panel-${index}`
                const buttonId = `${baseId}-button-${index}`
                return (
                    <div key={item.q}>
                        <h3>
                            <button
                                type="button"
                                id={buttonId}
                                aria-expanded={open}
                                aria-controls={panelId}
                                onClick={() => setOpenIndex(open ? null : index)}
                                className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                            >
                                <span
                                    className={`text-base font-semibold transition-colors sm:text-[17px] ${
                                        open ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-white'
                                    }`}
                                >
                                    {keepPunctuation(item.q)}
                                </span>
                                <span
                                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                        open
                                            ? 'border-[#0FA968] bg-[#0FA968] text-white'
                                            : 'border-zinc-200 text-zinc-500 group-hover:border-zinc-900 group-hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:group-hover:border-white dark:group-hover:text-white'
                                    }`}
                                    aria-hidden="true"
                                >
                                    {/* Un « + » dont la barre verticale s'efface pour devenir « − ». */}
                                    <span className="absolute h-[1.5px] w-3 rounded bg-current" />
                                    <span
                                        className={`absolute h-3 w-[1.5px] rounded bg-current transition-transform duration-300 ${
                                            open ? 'rotate-90 scale-y-0' : ''
                                        }`}
                                    />
                                </span>
                            </button>
                        </h3>
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                            <div className="overflow-hidden">
                                <p className="max-w-2xl pb-6 pr-12 leading-7 text-zinc-600 dark:text-zinc-400">
                                    {keepPunctuation(item.a)}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
