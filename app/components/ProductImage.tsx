'use client'

import { useCallback, useState } from 'react'

/**
 * Image produit qui se remplace par un visuel neutre quand elle est absente ou
 * que le marchand ne la sert plus, au lieu d'afficher une icône cassée.
 */
export default function ProductImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
    const [failed, setFailed] = useState(false)

    // L'image peut avoir échoué avant que React ne prenne la main : `onError`
    // n'est alors jamais appelé, on le constate donc quand l'élément est attaché.
    const checkLoaded = useCallback((img: HTMLImageElement | null) => {
        if (img && img.complete && img.naturalWidth === 0) setFailed(true)
    }, [])

    if (!src || failed) {
        return (
            <div className={`flex items-center justify-center text-zinc-300 dark:text-zinc-600 ${className ?? ''}`} role="img" aria-label={alt}>
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} aria-hidden="true">
                    <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
                    <circle cx="9" cy="10" r="1.6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l4.5-4.5 3.5 3.5 2.5-2.5L20 19" />
                </svg>
            </div>
        )
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={checkLoaded} src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />
    )
}
