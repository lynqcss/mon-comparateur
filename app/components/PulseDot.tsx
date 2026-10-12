/** Pastille verte qui pulse doucement (immobile si l'utilisateur réduit les animations). */
export default function PulseDot({ size = 'h-2 w-2' }: { size?: string }) {
    return (
        <span className={`relative flex shrink-0 ${size}`}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0FA968] opacity-60 motion-reduce:hidden" />
            <span className={`relative inline-flex rounded-full bg-[#0FA968] ${size}`} />
        </span>
    )
}
